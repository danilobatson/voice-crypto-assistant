import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

// Add request timeout wrapper
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

// Rate limiting tracker (simple in-memory)
const rateLimitTracker = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitTracker.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitTracker.set(ip, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (userLimit.count >= 10) { // 10 requests per minute
    return false;
  }
  
  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  let client: Client | null = null;
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Please wait a moment before trying again.',
        retryAfter: 60
      }, { status: 429 });
    }

    const { query } = await request.json();
    
    // Input validation
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid query is required',
        code: 'INVALID_INPUT'
      }, { status: 400 });
    }

    if (query.length > 500) {
      return NextResponse.json({
        success: false,
        error: 'Query too long. Please keep it under 500 characters.',
        code: 'QUERY_TOO_LONG'
      }, { status: 400 });
    }

    if (query.trim().length < 3) {
      return NextResponse.json({
        success: false,
        error: 'Query too short. Please ask a more specific question.',
        code: 'QUERY_TOO_SHORT'
      }, { status: 400 });
    }

    // Check for non-crypto queries
    const nonCryptoKeywords = ['weather', 'stock market', 'news', 'sports', 'food', 'movie'];
    const lowerQuery = query.toLowerCase();
    const seemsNonCrypto = nonCryptoKeywords.some(keyword => lowerQuery.includes(keyword)) 
                           && !lowerQuery.match(/\b(bitcoin|crypto|coin|token|blockchain|defi)\b/);
    
    if (seemsNonCrypto) {
      return NextResponse.json({
        success: false,
        error: 'I specialize in cryptocurrency analysis. Please ask about Bitcoin, Ethereum, or other cryptocurrencies.',
        code: 'NON_CRYPTO_QUERY',
        suggestion: 'Try asking: "What is the sentiment on Bitcoin?" or "How is Ethereum trending?"'
      }, { status: 400 });
    }

    console.log(`🚀 Starting analysis for: "${query}" (${query.length} chars)`);

    // API key validation with better error messages
    const lunarcrushKey = process.env.LUNARCRUSH_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    
    if (!lunarcrushKey) {
      return NextResponse.json({
        success: false,
        error: 'LunarCrush API configuration missing. Please check server configuration.',
        code: 'MISSING_LUNARCRUSH_KEY'
      }, { status: 503 });
    }

    if (!geminiKey) {
      return NextResponse.json({
        success: false,
        error: 'Gemini AI configuration missing. Please check server configuration.',
        code: 'MISSING_GEMINI_KEY'
      }, { status: 503 });
    }

    // MCP Client with timeout and retry
    try {
      client = await withTimeout(createMCPClient(lunarcrushKey), 15000);
    } catch (error) {
      console.error('❌ MCP connection failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Unable to connect to cryptocurrency data service. Please try again.',
        code: 'MCP_CONNECTION_FAILED',
        technical: error instanceof Error ? error.message : 'Unknown connection error'
      }, { status: 503 });
    }

    // Gemini AI with timeout
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    // Cryptocurrency detection with timeout
    let cryptoInfo;
    try {
      const detectionPrompt = createCryptoDetectionPrompt(query);
      const detectionResponse = await withTimeout(
        model.generateContent(detectionPrompt), 
        10000
      );
      
      const detectionText = detectionResponse.response.text();
      const jsonMatch = detectionText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        cryptoInfo = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid response from AI');
      }
    } catch (error) {
      console.warn('⚠️ Crypto detection failed, using fallback');
      cryptoInfo = {
        detected_crypto: 'bitcoin',
        confidence: 30,
        original_term: query,
        correction_made: false,
        symbol: 'BTC',
        reasoning: 'Fallback due to detection error'
      };
    }

    // Tool discovery with timeout
    let tools;
    try {
      const { tools: discoveredTools } = await withTimeout(client.listTools(), 10000);
      tools = discoveredTools;
    } catch (error) {
      console.error('❌ Tool discovery failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Unable to access cryptocurrency analysis tools. Please try again.',
        code: 'TOOL_DISCOVERY_FAILED'
      }, { status: 503 });
    }

    // Tool orchestration with timeout
    let toolCalls;
    try {
      const orchestrationPrompt = createOrchestrationPrompt(
        cryptoInfo.detected_crypto || 'bitcoin',
        cryptoInfo.symbol || 'BTC', 
        tools
      );
      
      const orchestrationResponse = await withTimeout(
        model.generateContent(orchestrationPrompt), 
        15000
      );
      
      const responseText = orchestrationResponse.response.text();
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        toolCalls = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No tool calls generated');
      }
    } catch (error) {
      console.warn('⚠️ Tool orchestration failed, using fallback');
      toolCalls = [
        {
          tool: "LunarCrush MCP:Topic",
          args: { topic: cryptoInfo.detected_crypto || "bitcoin" },
          reason: "Fallback tool call"
        }
      ];
    }

    // Execute tools with individual timeouts and retries
    const toolResults = await executeToolCallsWithRetry(client, toolCalls);

    // Final analysis with timeout
    let structuredAnalysis;
    try {
      const analysisPrompt = createStructuredAnalysisPrompt(query, cryptoInfo, toolResults);
      const analysisResponse = await withTimeout(
        model.generateContent(analysisPrompt), 
        20000
      );
      
      const analysisText = analysisResponse.response.text();
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        structuredAnalysis = JSON.parse(jsonMatch[0]);
        structuredAnalysis.crypto_detection = cryptoInfo;
      } else {
        throw new Error('No valid analysis JSON');
      }
    } catch (error) {
      console.error('❌ Analysis generation failed:', error);
      
      // Smart fallback based on available data
      structuredAnalysis = createFallbackAnalysis(query, cryptoInfo, toolResults);
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ Analysis completed in ${totalTime}ms`);

    return NextResponse.json({
      success: true,
      ...structuredAnalysis,
      toolsUsed: toolCalls.length,
      dataPoints: toolResults.filter(r => r.success).length,
      responseTime: totalTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('❌ Critical error:', error);
    
    // Smart error categorization
    let errorCode = 'UNKNOWN_ERROR';
    let errorMessage = 'An unexpected error occurred. Please try again.';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorCode = 'TIMEOUT';
        errorMessage = 'The request took too long. Please try again with a simpler query.';
        statusCode = 408;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorCode = 'NETWORK_ERROR';
        errorMessage = 'Network connection issue. Please check your internet and try again.';
        statusCode = 503;
      } else if (error.message.includes('parse') || error.message.includes('JSON')) {
        errorCode = 'PARSE_ERROR';
        errorMessage = 'Data processing error. Please try again.';
        statusCode = 502;
      }
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      code: errorCode,
      responseTime: totalTime,
      timestamp: new Date().toISOString(),
      suggestion: 'Try a simpler query like "Bitcoin sentiment" or "Ethereum price"'
    }, { status: statusCode });
    
  } finally {
    // Cleanup
    if (client) {
      try {
        await client.close();
      } catch (cleanupError) {
        console.warn('Cleanup warning:', cleanupError);
      }
    }
  }
}

// Enhanced tool execution with retry logic
async function executeToolCallsWithRetry(client: Client, toolCalls: any[]): Promise<any[]> {
  const results: any[] = [];
  
  for (const toolCall of toolCalls) {
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`🛠️ Executing: ${toolCall.tool} (attempt ${attempts + 1})`);
        
        const result = await withTimeout(
          client.callTool({
            name: toolCall.tool,
            arguments: toolCall.args
          }),
          15000
        );
        
        results.push({
          tool: toolCall.tool,
          args: toolCall.args,
          reason: toolCall.reason,
          result: result.content,
          success: true,
          attempts: attempts + 1
        });
        
        break; // Success, exit retry loop
        
      } catch (error) {
        attempts++;
        const isLastAttempt = attempts >= maxAttempts;
        
        console.error(`❌ Tool ${toolCall.tool} failed (attempt ${attempts}):`, error);
        
        if (isLastAttempt) {
          results.push({
            tool: toolCall.tool,
            args: toolCall.args,
            reason: toolCall.reason,
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false,
            attempts: attempts
          });
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  }
  
  return results;
}

// Smart fallback analysis when AI fails
function createFallbackAnalysis(query: string, cryptoInfo: any, toolResults: any[]): any {
  const hasSuccessfulResults = toolResults.some(r => r.success);
  const crypto = cryptoInfo.detected_crypto || 'the requested cryptocurrency';
  
  return {
    recommendation: "HOLD",
    confidence: hasSuccessfulResults ? 40 : 20,
    reasoning: hasSuccessfulResults 
      ? `Based on limited data available for ${crypto}, recommending a cautious HOLD position.`
      : `Unable to gather sufficient data for ${crypto}. Recommend waiting for better market conditions.`,
    social_sentiment: "neutral",
    key_metrics: extractMetricsFromResults(toolResults),
    ai_analysis: hasSuccessfulResults
      ? `I was able to gather some data about ${crypto}, but encountered issues with the full analysis. Based on the available information, the market appears to be in a neutral state. Consider waiting for more comprehensive data before making investment decisions.`
      : `I encountered technical difficulties gathering comprehensive data about ${crypto}. This could be due to the cryptocurrency being very new, having limited social activity, or temporary data service issues. I recommend trying again later or asking about a more established cryptocurrency like Bitcoin or Ethereum.`,
    miscellaneous: "Analysis generated with limited data due to technical constraints",
    symbol: cryptoInfo.symbol || "UNKNOWN",
    spokenResponse: cryptoInfo.correction_made 
      ? `I believe you asked about ${crypto}. However, I encountered some technical difficulties and could only provide a partial analysis. ${hasSuccessfulResults ? 'Based on the limited data available, I recommend a cautious approach.' : 'Please try again later or ask about a different cryptocurrency.'}`
      : `I attempted to analyze ${crypto} but encountered technical difficulties. ${hasSuccessfulResults ? 'Based on the partial data I could gather, I recommend being cautious.' : 'Please try again later.'}`
  };
}

function extractMetricsFromResults(toolResults: any[]): any {
  const metrics = {
    price: "Not Available",
    galaxy_score: "Not Available",
    alt_rank: "Not Available",
    social_dominance: "Not Available",
    market_cap: "Not Available",
    volume_24h: "Not Available",
    mentions: "Not Available",
    engagements: "Not Available",
    creators: "Not Available"
  };

  // Try to extract any available metrics from successful tool results
  for (const result of toolResults) {
    if (result.success && result.result) {
      try {
        const data = typeof result.result === 'string' ? JSON.parse(result.result) : result.result;
        
        if (data.price) metrics.price = data.price;
        if (data.galaxy_score) metrics.galaxy_score = data.galaxy_score;
        if (data.alt_rank) metrics.alt_rank = data.alt_rank;
        // ... extract other metrics as available
      } catch (e) {
        // Ignore parsing errors for individual results
      }
    }
  }

  return metrics;
}

// ... (include the other functions from previous implementation)
