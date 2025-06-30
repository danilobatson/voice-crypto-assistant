import { NextRequest, NextResponse } from 'next/server';
import { createMCPClient, createOrchestrationPrompt, executeToolCalls } from '@/lib/mcp-client';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Use any for MCP tool types to avoid complex Zod type issues
interface ToolResult {
  success: boolean;
  tool: string;
  args: Record<string, unknown>;
  reason: string;
  result?: unknown;
  error?: string;
}

export async function POST(request: NextRequest) {
  let client = null;
  
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Extract crypto symbol from query
    const cryptoMatch = query.toLowerCase().match(/\b(bitcoin|btc|ethereum|eth|solana|sol|cardano|ada|polkadot|dot|dogecoin|doge)\b/);
    const symbol = cryptoMatch ? (cryptoMatch[1] === 'bitcoin' ? 'btc' : cryptoMatch[1] === 'ethereum' ? 'eth' : cryptoMatch[1] === 'solana' ? 'sol' : cryptoMatch[1]) : 'btc';

    // Get API keys
    const lunarcrushApiKey = process.env.LUNARCRUSH_API_KEY || process.env.NEXT_PUBLIC_LUNARCRUSH_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!lunarcrushApiKey || !geminiApiKey) {
      throw new Error('API keys not found');
    }

    // Create MCP client
    client = await createMCPClient(lunarcrushApiKey);
    
    // Get available tools - use any to avoid complex MCP type issues
    const { tools } = await client.listTools();
    
    // Convert tools to simple object for Gemini prompt
    const toolsMap: Record<string, any> = {};
    tools.forEach((tool: any) => {
      toolsMap[tool.name] = {
        name: tool.name,
        description: tool.description || '',
        inputSchema: tool.inputSchema || {}
      };
    });

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    // Step 1: Get tool orchestration plan
    const orchestrationPrompt = createOrchestrationPrompt(symbol, toolsMap);
    const orchestrationResponse = await model.generateContent(orchestrationPrompt);
    const responseText = orchestrationResponse.response.text();
    
    // Extract tool calls
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    let toolCalls = [];
    
    if (jsonMatch) {
      try {
        toolCalls = JSON.parse(jsonMatch[0]);
      } catch (e) {
        // Fallback tool call
        toolCalls = [
          {
            tool: "LunarCrush MCP:Topic",
            args: { topic: symbol },
            reason: "Get basic crypto data and sentiment"
          }
        ];
      }
    }

    // Step 2: Execute the tool calls
    const toolResults: ToolResult[] = await executeToolCalls(client, toolCalls);

    // Step 3: Generate final analysis with Gemini
    const analysisPrompt = `
You are a professional cryptocurrency analyst. Based on the following data from LunarCrush MCP tools, provide a comprehensive analysis for ${symbol.toUpperCase()}.

User Query: "${query}"

MCP Tool Results:
${JSON.stringify(toolResults, null, 2)}

Please provide a natural, conversational response that:
1. Answers the user's specific question
2. Highlights key insights from the social data
3. Mentions any notable trends or sentiment patterns
4. Keeps the response suitable for voice synthesis (30-45 seconds when spoken)
5. Uses a professional but conversational tone

Focus on the most interesting and actionable insights from the data.
`;

    const analysisResponse = await model.generateContent(analysisPrompt);
    const finalAnalysis = analysisResponse.response.text();

    return NextResponse.json({
      success: true,
      query,
      symbol: symbol.toUpperCase(),
      analysis: finalAnalysis,
      toolsUsed: toolCalls.length,
      dataPoints: toolResults.filter((r: ToolResult) => r.success).length,
      spokenResponse: finalAnalysis
    });

  } catch (error) {
    const fallbackResponse = `I apologize, but I'm having trouble analyzing the cryptocurrency data right now. Please try again in a moment, or ask about a specific cryptocurrency like Bitcoin or Ethereum.`;
    
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
      } catch (e) {
        // Silent cleanup
      }
    }
  }
}
