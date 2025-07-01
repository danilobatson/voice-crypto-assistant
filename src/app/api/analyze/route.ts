import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createMCPClient, executeToolCalls, createOrchestrationPrompt, withTimeout } from '@/lib/mcp-client';
import { parseAIResponse, createStrictJSONPrompt } from '@/lib/json-utils';

// Rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userRequests = requestCounts.get(ip);

  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (userRequests.count >= RATE_LIMIT) {
    return false;
  }

  userRequests.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let client = null;

  try {
    // Rate limiting
    const ip = request.ip ?? 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Please wait before making another request.',
        spokenResponse: 'Please wait a moment before making another request.'
      }, { status: 429 });
    }

    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Query is required',
        spokenResponse: 'Please provide a query to analyze.'
      }, { status: 400 });
    }

    console.log(`🚀 Starting analysis for query: "${query}"`);

    // Get API keys
    const lunarcrushKey = process.env.LUNARCRUSH_API_KEY || process.env.NEXT_PUBLIC_LUNARCRUSH_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!lunarcrushKey || !geminiKey) {
      return NextResponse.json({
        success: false,
        error: 'API keys not configured',
        spokenResponse: 'The service is temporarily unavailable. Please try again later.'
      }, { status: 500 });
    }

    // Initialize services
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // MCP Client with timeout and retry
    try {
      client = await withTimeout(createMCPClient(lunarcrushKey), 15000);
    } catch (error) {
      console.error('❌ MCP connection failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to LunarCrush MCP',
        spokenResponse: 'I apologize, but I am unable to connect to the cryptocurrency data service right now. Please try again in a moment.',
        fallback: true
      }, { status: 503 });
    }

    // Get available tools
    const { tools } = await client.listTools();
    console.log(`📋 Available MCP tools: ${tools.length}`);

    // Detect cryptocurrency from query with strict JSON prompt
    const cryptoDetectionPrompt = createStrictJSONPrompt(`
Analyze this query and extract the main cryptocurrency being discussed: "${query}"

If a cryptocurrency is mentioned, respond with JSON:
{
  "detected_crypto": "full name",
  "symbol": "SYMBOL",
  "confidence": 95,
  "reasoning": "why you detected this crypto"
}

If no cryptocurrency is mentioned, respond with:
{
  "detected_crypto": "none",
  "symbol": "",
  "confidence": 0,
  "reasoning": "no cryptocurrency mentioned"
}

Common crypto corrections:
- cordana/cardano → Cardano (ADA)
- etherium → Ethereum (ETH) 
- bit coin → Bitcoin (BTC)
`);

    const cryptoDetectionResult = await model.generateContent(cryptoDetectionPrompt);
    let cryptoInfo;
    
    try {
      cryptoInfo = parseAIResponse(cryptoDetectionResult.response.text());
    } catch (error) {
      console.error('❌ Crypto detection parsing failed:', error);
      cryptoInfo = { detected_crypto: "Bitcoin", symbol: "BTC", confidence: 50, reasoning: "Fallback to Bitcoin" };
    }

    // If no crypto detected, provide helpful response
    if (cryptoInfo.detected_crypto === "none" || cryptoInfo.confidence < 30) {
      return NextResponse.json({
        success: true,
        recommendation: "HOLD" as const,
        confidence: 0,
        reasoning: "No specific cryptocurrency was mentioned in your query.",
        social_sentiment: "neutral" as const,
        key_metrics: {
          price: "N/A",
          galaxy_score: "N/A",
          alt_rank: "N/A",
          social_dominance: "N/A",
          market_cap: "N/A",
          volume_24h: "N/A",
          mentions: "N/A",
          engagements: "N/A",
          creators: "N/A"
        },
        ai_analysis: "I'd be happy to help you analyze cryptocurrency data! Please ask about a specific cryptocurrency like Bitcoin, Ethereum, Solana, or any other digital asset you're interested in.",
        miscellaneous: "Try asking: 'What's the sentiment on Bitcoin?' or 'How is Ethereum trending?'",
        symbol: "",
        spokenResponse: "I'd be happy to help you analyze cryptocurrency data! Please ask about a specific cryptocurrency like Bitcoin, Ethereum, or Solana.",
        toolsUsed: 0,
        dataPoints: 0,
        responseTime: Date.now() - startTime,
        crypto_detection: cryptoInfo
      });
    }

    const symbol = cryptoInfo.symbol || cryptoInfo.detected_crypto;
    console.log(`🎯 Analyzing cryptocurrency: ${symbol}`);

    // Create orchestration prompt for tool selection with strict JSON
    const orchestrationPrompt = createStrictJSONPrompt(createOrchestrationPrompt(symbol, tools));
    
    const orchestrationResult = await model.generateContent(orchestrationPrompt);
    let toolCalls;
    
    try {
      toolCalls = parseAIResponse(orchestrationResult.response.text());
    } catch (error) {
      console.error('❌ Tool orchestration parsing failed:', error);
      // Fallback tool calls
      toolCalls = [
        { tool: "LunarCrush MCP:Topic", args: { topic: symbol.toLowerCase() }, reason: "Get basic topic data" }
      ];
    }

    // Execute MCP tool calls
    console.log(`🔄 Executing ${toolCalls.length} MCP tool calls...`);
    const toolResults = await executeToolCalls(client, toolCalls.slice(0, 4)); // Limit to 4 tools

    // Prepare analysis prompt with strict JSON formatting
    const analysisPrompt = createStrictJSONPrompt(`
You are a professional cryptocurrency analyst. Analyze the following data for ${symbol} and provide a comprehensive investment recommendation.

QUERY: "${query}"

MCP TOOL RESULTS:
${JSON.stringify(toolResults, null, 2)}

CRYPTO DETECTION:
${JSON.stringify(cryptoInfo, null, 2)}

Provide your analysis in this EXACT JSON format (no additional text, no markdown):
{
  "recommendation": "BUY",
  "confidence": 85,
  "reasoning": "Clear explanation of recommendation based on the data",
  "social_sentiment": "bullish",
  "key_metrics": {
    "price": "$43,250",
    "galaxy_score": "85/100",
    "alt_rank": "#1",
    "social_dominance": "15.2%",
    "market_cap": "$850B",
    "volume_24h": "$25B",
    "mentions": "1,250",
    "engagements": "45,000",
    "creators": "890"
  },
  "ai_analysis": "Two paragraph beginner-friendly analysis explaining the current market situation and social sentiment trends.",
  "miscellaneous": "Additional relevant insights from the data",
  "spokenResponse": "Natural conversational response optimized for voice synthesis, 30-45 seconds when read aloud"
}

Use only: BUY, SELL, or HOLD for recommendation.
Use only: bullish, bearish, or neutral for social_sentiment.
Focus on the actual data provided in the MCP tool results.
`);

    // Generate AI analysis with better error handling
    const analysisResult = await model.generateContent(analysisPrompt);
    let analysis;
    
    try {
      const rawResponse = analysisResult.response.text();
      console.log(`🔍 Raw AI response preview: ${rawResponse.substring(0, 100)}...`);
      
      analysis = parseAIResponse(rawResponse);
      console.log('✅ Successfully parsed AI analysis');
    } catch (error) {
      console.error('❌ Analysis parsing failed:', error);
      
      // Enhanced fallback analysis with actual data if available
      const hasToolData = toolResults.some(r => r.success);
      const dataStatus = hasToolData ? "with limited data" : "due to data processing issues";
      
      analysis = {
        recommendation: "HOLD",
        confidence: hasToolData ? 60 : 30,
        reasoning: `Analysis completed ${dataStatus}. ${hasToolData ? 'Some social metrics were retrieved but full analysis was incomplete.' : 'Unable to retrieve comprehensive market data.'}`,
        social_sentiment: "neutral",
        key_metrics: {
          price: hasToolData ? "Available in tool data" : "Data unavailable",
          galaxy_score: hasToolData ? "Available in tool data" : "Data unavailable",
          alt_rank: hasToolData ? "Available in tool data" : "Data unavailable",
          social_dominance: hasToolData ? "Available in tool data" : "Data unavailable",
          market_cap: hasToolData ? "Available in tool data" : "Data unavailable",
          volume_24h: hasToolData ? "Available in tool data" : "Data unavailable",
          mentions: hasToolData ? "Available in tool data" : "Data unavailable",
          engagements: hasToolData ? "Available in tool data" : "Data unavailable",
          creators: hasToolData ? "Available in tool data" : "Data unavailable"
        },
        ai_analysis: `Analysis for ${symbol}: ${hasToolData ? 'I was able to gather some social sentiment data, but encountered issues with the full analysis processing. The available data suggests moderate social activity.' : 'I encountered issues accessing comprehensive market data.'} Please try asking about this cryptocurrency again for a complete analysis with detailed insights and recommendations.`,
        miscellaneous: `${hasToolData ? 'Partial data available - retry recommended.' : 'Full retry recommended.'} Raw tool results: ${toolResults.length} tools executed, ${toolResults.filter(r => r.success).length} successful.`,
        spokenResponse: `I found some information about ${symbol}, but encountered processing issues with the complete analysis. ${hasToolData ? 'I was able to gather social sentiment data, but please ask about this cryptocurrency again for a full detailed analysis.' : 'Please try asking about this cryptocurrency again for a complete assessment.'}`
      };
    }

    // Construct final response
    const response = {
      success: true,
      ...analysis,
      symbol,
      toolsUsed: toolResults.length,
      dataPoints: toolResults.filter(r => r.success).length,
      responseTime: Date.now() - startTime,
      crypto_detection: cryptoInfo
    };

    console.log(`✅ Analysis complete for ${symbol} in ${response.responseTime}ms`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ API Error:', error);
    
    const fallbackResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed',
      spokenResponse: 'I apologize, but I encountered an error analyzing the cryptocurrency data. Please try again in a moment.',
      toolsUsed: 0,
      dataPoints: 0,
      responseTime: Date.now() - startTime
    };

    return NextResponse.json(fallbackResponse, { status: 500 });
  } finally {
    // Clean up MCP client connection
    if (client) {
      try {
        await client.close();
        console.log('🔒 MCP client connection closed');
      } catch (error) {
        console.error('⚠️ Error closing MCP client:', error);
      }
    }
  }
}
