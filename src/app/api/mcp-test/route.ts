import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.LUNARCRUSH_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'LUNARCRUSH_API_KEY not found in environment variables'
      }, { status: 500 });
    }

    console.log('Testing MCP connection to LunarCrush...');
    console.log('API Key prefix:', apiKey.substring(0, 10) + '...');

    // Test basic connection to LunarCrush MCP endpoint
    const mcpUrl = `https://lunarcrush.ai/sse?key=${apiKey}`;
    
    console.log('Attempting connection to:', mcpUrl.replace(apiKey, 'API_KEY_HIDDEN'));

    // Make a simple GET request to test connection
    const response = await fetch(mcpUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `MCP connection failed with status: ${response.status}`,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      }, { status: 500 });
    }

    // For SSE, we should get a text/event-stream response
    const contentType = response.headers.get('content-type');
    
    return NextResponse.json({
      success: true,
      message: 'MCP connection successful',
      status: response.status,
      contentType,
      headers: Object.fromEntries(response.headers.entries()),
      note: 'SSE connection established - ready for MCP communication'
    });

  } catch (error) {
    console.error('MCP connection test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'MCP connection test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
