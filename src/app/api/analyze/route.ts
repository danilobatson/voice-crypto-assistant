import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  reason: string;
}

interface ToolResult {
  tool: string;
  args: Record<string, unknown>;
  reason: string;
  result?: unknown;
  success: boolean;
  error?: string;
}

// Initialize Gemini AI with server-side API key
const getGeminiAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  return new GoogleGenerativeAI(apiKey);
};

// Create MCP client using official SDK
async function createMCPClient(apiKey: string): Promise<Client> {
  console.log('🔄 Initializing MCP client with official SDK...');
  
  const transport = new SSEClientTransport(
    new URL(`https://lunarcrush.ai/sse?key=${apiKey}`)
  );

  const client = new Client(
    {
      name: 'voice-crypto-assistant',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  await client.connect(transport);
  console.log('✅ MCP client connected successfully');
  return client;
}

// Create tool orchestration prompt for Gemini
function createOrchestrationPrompt(query: string, availableTools: unknown[]): string {
  return `
You are a cryptocurrency analyst. I need you to analyze the cryptocurrency mentioned in this user query using the available LunarCrush MCP tools.

USER QUERY: "${query}"

AVAILABLE MCP TOOLS:
${JSON.stringify(availableTools, null, 2)}

TASK: 
1. FIRST: Identify the cryptocurrency from the user query (Bitcoin, Ethereum, Solana, etc.)
2. THEN: Create a plan to gather comprehensive data for that cryptocurrency using MAX 4 tools

Based on the available tools, decide which tools to call and with what parameters to get:
1. Current price and market data
2. Social sentiment metrics  
3. Historical performance data
4. Ranking and positioning data

Respond with a JSON array of tool calls in this exact format:
[
  {
    "tool": "tool_name",
    "args": {"param": "value"},
    "reason": "Short reason why this tool call is needed"
  }
]

Be specific with parameters. Use the cryptocurrency symbol or name as needed for each tool.
`;
}

// Execute MCP tool calls
async function executeToolCalls(client: Client, toolCalls: ToolCall[]): Promise<ToolResult[]> {
  const results: ToolResult[] = [];
  
  for (const toolCall of toolCalls) {
    try {
      console.log(`🛠️ Executing: ${toolCall.tool} - ${toolCall.reason}`);
      
      const result = await client.callTool({
        name: toolCall.tool,
        arguments: toolCall.args
      });
      
      results.push({
        tool: toolCall.tool,
        args: toolCall.args,
        reason: toolCall.reason,
        result: result.content,
        success: true
      });
      
    } catch (error) {
      console.error(`❌ Tool ${toolCall.tool} failed:`, error);
      results.push({
        tool: toolCall.tool,
        args: toolCall.args,
        reason: toolCall.reason,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }
  }
  
  return results;
}

// Create structured analysis prompt for Gemini
function createStructuredAnalysisPrompt(query: string, toolResults: ToolResult[]): string {
  return `
You are an expert cryptocurrency analyst. Based on the user's query and the following real data from LunarCrush MCP tools, provide a comprehensive analysis.

USER QUERY: "${query}"

MCP TOOL RESULTS:
${JSON.stringify(toolResults, null, 2)}

INSTRUCTIONS:
1. Identify the cryptocurrency symbol from the query and data
2. Extract real metrics from the MCP tool results (not placeholder values)
3. Provide a professional investment analysis
4. Make recommendations based on the actual data

RESPOND WITH VALID JSON IN THIS EXACT FORMAT:
{
  "recommendation": "BUY|SELL|HOLD",
  "confidence": 0-100,
  "reasoning": "Brief explanation of the recommendation based on actual data",
  "social_sentiment": "bullish|bearish|neutral",
  "key_metrics": {
    "price": "actual price from MCP data",
    "galaxy_score": "score from data",
    "alt_rank": "rank from data", 
    "social_dominance": "dominance from data",
    "market_cap": "cap from data",
    "volume_24h": "volume from data",
    "mentions": "mentions from data",
    "engagements": "engagements/interactions from data",
    "creators": "creators from data"
  },
  "ai_analysis": "Max 2 paragraph overview of the analysis. Concise and beginner friendly",
  "miscellaneous": "Any other relevant insights",
  "symbol": "cryptocurrency symbol (BTC, ETH, etc)",
  "spokenResponse": "Natural conversational response optimized for voice synthesis (30-45 seconds when spoken)"
}

CRITICAL REQUIREMENTS:
- Extract actual values from the MCP tool results, not placeholders
- Base recommendation on real social sentiment and market data
- Keep ai_analysis concise but informative
- Make spokenResponse natural and conversational
- Ensure all JSON is valid and properly formatted
`;
}

export async function POST(request: NextRequest) {
  let client: Client | null = null;
  
  try {
    console.time('MCP Analysis');
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ 
        success: false, 
        error: 'No query provided' 
      }, { status: 400 });
    }

    console.log(`🚀 Starting MCP analysis for query: "${query}"`);

    // Step 1: Create MCP client
    const apiKey = process.env.LUNARCRUSH_API_KEY;
    if (!apiKey) {
      throw new Error('LUNARCRUSH_API_KEY environment variable not configured');
    }

    client = await createMCPClient(apiKey);
    const genAI = getGeminiAI();
    
    // Use the correct Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    // Step 2: Discover available tools
    console.log('🔄 Discovering MCP tools...');
    const { tools } = await client.listTools();
    console.log(`📋 Found ${tools.length} MCP tools`);

    // Step 3: Let Gemini decide which tools to use
    console.log('🧠 AI planning tool orchestration...');
    const orchestrationPrompt = createOrchestrationPrompt(query, tools);
    const orchestrationResponse = await model.generateContent(orchestrationPrompt);
    const responseText = orchestrationResponse.response.text();
    
    // Step 4: Extract tool calls from AI response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    let toolCalls: ToolCall[] = [];
    
    if (jsonMatch) {
      try {
        toolCalls = JSON.parse(jsonMatch[0]);
        console.log(`🛠️ Gemini selected ${toolCalls.length} tools`);
      } catch (parseError) {
        console.warn('⚠️ Failed to parse tool calls, using fallback');
        // Fallback tool call
        toolCalls = [
          {
            tool: "LunarCrush MCP:Topic",
            args: { topic: "bitcoin" },
            reason: "Get basic crypto data and sentiment"
          }
        ];
      }
    } else {
      console.warn('⚠️ No tool calls found, using fallback');
      toolCalls = [
        {
          tool: "LunarCrush MCP:Topic", 
          args: { topic: "bitcoin" },
          reason: "Get basic crypto data and sentiment"
        }
      ];
    }

    // Step 5: Execute the MCP tool calls
    console.log('⚡ Executing MCP tool calls...');
    const toolResults = await executeToolCalls(client, toolCalls);
    console.log(`✅ Completed ${toolResults.length} tool calls`);

    // Step 6: Generate structured analysis with Gemini
    console.log('🧠 Generating structured analysis...');
    const analysisPrompt = createStructuredAnalysisPrompt(query, toolResults);
    const analysisResponse = await model.generateContent(analysisPrompt);
    const analysisText = analysisResponse.response.text();
    
    // Step 7: Parse the JSON response
    let structuredAnalysis;
    try {
      // Extract JSON from response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        structuredAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('❌ Failed to parse structured analysis:', parseError);
      // Fallback response
      structuredAnalysis = {
        recommendation: "HOLD",
        confidence: 50,
        reasoning: "Unable to complete full analysis due to parsing error",
        social_sentiment: "neutral",
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
        ai_analysis: "Analysis completed but could not parse structured response. Please try again.",
        miscellaneous: "System encountered parsing issues",
        symbol: "BTC",
        spokenResponse: "I apologize, but I encountered an issue processing the analysis. Please try asking about a specific cryptocurrency again."
      };
    }

    console.timeEnd('MCP Analysis');
    
    // Return the structured response
    return NextResponse.json({
      success: true,
      ...structuredAnalysis,
      toolsUsed: toolCalls.length,
      dataPoints: toolResults.filter(r => r.success).length
    });

  } catch (error) {
    console.error('❌ MCP Analysis failed:', error);
    
    const fallbackResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed',
      recommendation: "HOLD",
      confidence: 0,
      reasoning: "System error occurred during analysis",
      social_sentiment: "neutral",
      key_metrics: {},
      ai_analysis: "Analysis could not be completed due to system error",
      miscellaneous: "Please try again",
      symbol: "BTC",
      spokenResponse: "I apologize, but I'm having trouble analyzing the cryptocurrency data right now. Please try again in a moment."
    };
    
    return NextResponse.json(fallbackResponse, { status: 500 });
  } finally {
    // Clean up MCP client connection
    if (client) {
      try {
        await client.close();
        console.log('🧹 MCP client connection closed');
      } catch (cleanupError) {
        console.warn('Warning: MCP client cleanup failed:', cleanupError);
      }
    }
  }
}
