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
function createOrchestrationPrompt(symbol: string, availableTools: unknown[]): string {
  return `
You are a cryptocurrency analyst. I need you to analyze ${symbol.toUpperCase()} using the available LunarCrush MCP tools. Use a MAX of 4 tools to gather comprehensive data.

AVAILABLE MCP TOOLS:
${JSON.stringify(availableTools, null, 2)}

TASK: Create a plan to gather comprehensive data for ${symbol.toUpperCase()} analysis.

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

Be specific with parameters. Focus on ${symbol.toUpperCase()} data.
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

// Create analysis prompt for Gemini
function createAnalysisPrompt(query: string, toolResults: ToolResult[]): string {
  return `
You are an expert cryptocurrency analyst. Based on the user's query and the following real data from LunarCrush MCP tools, provide a comprehensive analysis.

User Query: "${query}"

MCP Tool Results:
${JSON.stringify(toolResults, null, 2)}

Please provide a natural, conversational response that:
1. Answers the user's specific question
2. Highlights key insights from the social data
3. Mentions any notable trends or sentiment patterns
4. Uses a professional but conversational tone
5. Is optimized for voice synthesis (natural speech patterns)

Focus on the most interesting and actionable insights from the data. Keep it concise but informative.
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
    const orchestrationPrompt = createOrchestrationPrompt(
      query.includes('bitcoin') ? 'bitcoin' : 
      query.includes('ethereum') ? 'ethereum' :
      query.includes('solana') ? 'solana' : 'bitcoin',
      tools
    );

    const orchestrationResponse = await model.generateContent(orchestrationPrompt);
    const orchestrationText = orchestrationResponse.response.text();
    
    // Parse the JSON response
    const toolCalls = JSON.parse(orchestrationText.replace(/```json|```/g, '').trim()) as ToolCall[];
    console.log(`🎯 AI selected ${toolCalls.length} tools:`, toolCalls.map((t) => t.tool));

    // Step 4: Execute tool calls
    console.log('⚡ Executing MCP tools...');
    const toolResults = await executeToolCalls(client, toolCalls);
    const successfulResults = toolResults.filter(r => r.success);
    console.log(`✅ ${successfulResults.length}/${toolResults.length} tools executed successfully`);

    // Step 5: Generate AI analysis
    console.log('🧠 Generating AI analysis...');
    const analysisPrompt = createAnalysisPrompt(query, toolResults);
    const analysisResponse = await model.generateContent(analysisPrompt);
    const finalAnalysis = analysisResponse.response.text();

    console.timeEnd('MCP Analysis');

    return NextResponse.json({
      success: true,
      query,
      analysis: finalAnalysis,
      toolsUsed: toolCalls.length,
      dataPoints: successfulResults.length,
      spokenResponse: finalAnalysis,
      symbol: query.includes('bitcoin') ? 'BTC' : 
              query.includes('ethereum') ? 'ETH' :
              query.includes('solana') ? 'SOL' : 'BTC'
    });

  } catch (error) {
    console.error('❌ MCP Analysis failed:', error);
    console.timeEnd('MCP Analysis');
    
    const fallbackResponse = `I apologize, but I'm having trouble connecting to the LunarCrush data right now. This could be due to API connectivity or rate limiting. Please try again in a moment.`;
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed',
      spokenResponse: fallbackResponse
    });
  } finally {
    // Clean up MCP client
    if (client) {
      try {
        await client.close();
        console.log('🔄 MCP client closed');
      } catch {
        // Silent cleanup
      }
    }
  }
}
