import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

// Create server-side MCP client using official SDK
export async function createMCPClient(apiKey: string): Promise<Client> {
  // Create SSE transport for LunarCrush MCP server
  const transport = new SSEClientTransport(
    new URL(`https://lunarcrush.ai/sse?key=${apiKey}`)
  );

  // Create MCP client
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

  // Connect to the server
  await client.connect(transport);
  return client;
}

// Create Gemini orchestration functions
export function createOrchestrationPrompt(symbol: string, availableTools: any): string {
  return `
You are a cryptocurrency analyst. I need you to analyze ${symbol.toUpperCase()} using the available LunarCrush MCP tools. Use a MAX of four tools.

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

Be specific with parameters. For example, if you need to find ${symbol} in a list first, plan that step.
`;
}

export async function executeToolCalls(client: Client, toolCalls: any[]): Promise<any> {
  const results = [];
  
  for (const toolCall of toolCalls) {
    try {
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
