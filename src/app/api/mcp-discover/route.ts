import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.LUNARCRUSH_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'LUNARCRUSH_API_KEY not found'
      }, { status: 500 });
    }

    console.log('🔍 Discovering MCP tools from LunarCrush...');

    // Step 1: Initialize SSE connection to get session
    const sseUrl = `https://lunarcrush.ai/sse?key=${apiKey}`;
    const sseResponse = await fetch(sseUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

    if (!sseResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `SSE connection failed: ${sseResponse.status}`
      }, { status: 500 });
    }

    // Get session ID from headers
    const sessionId = sseResponse.headers.get('mcp-session-id');
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'No MCP session ID received'
      }, { status: 500 });
    }

    console.log('✅ Session established:', sessionId);

    // Step 2: Send initialization request to discover tools
    const messagesUrl = `https://lunarcrush.ai/mcp`;
    
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {}
        },
        clientInfo: {
          name: 'voice-crypto-assistant',
          version: '1.0.0'
        }
      }
    };

    console.log('📡 Sending initialization request...');

    const initResponse = await fetch(messagesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Mcp-Session-Id': sessionId,
      },
      body: JSON.stringify(initRequest)
    });

    if (!initResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Initialization failed: ${initResponse.status}`,
        sessionId
      }, { status: 500 });
    }

    const initResult = await initResponse.json();
    console.log('✅ Initialization result:', initResult);

    // Step 3: Request list of available tools
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };

    console.log('🛠️ Requesting available tools...');

    const toolsResponse = await fetch(messagesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Mcp-Session-Id': sessionId,
      },
      body: JSON.stringify(toolsRequest)
    });

    if (!toolsResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Tools request failed: ${toolsResponse.status}`,
        sessionId,
        initResult
      }, { status: 500 });
    }

    const toolsResult = await toolsResponse.json();
    console.log('🛠️ Available tools:', toolsResult);

    return NextResponse.json({
      success: true,
      sessionId,
      initialization: initResult,
      availableTools: toolsResult,
      summary: {
        protocolVersion: initResult?.result?.protocolVersion,
        serverInfo: initResult?.result?.serverInfo,
        toolCount: toolsResult?.result?.tools?.length || 0,
        tools: toolsResult?.result?.tools?.map((tool: any) => ({
          name: tool.name,
          description: tool.description
        })) || []
      }
    });

  } catch (error) {
    console.error('❌ MCP discovery failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'MCP discovery failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
