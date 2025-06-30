import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { symbol = 'BTC' } = body;
    
    console.log(`🔧 Testing simple MCP tool call for ${symbol}...`);
    
    // Try the simplest possible MCP call
    const sseUrl = `https://lunarcrush.ai/sse?key=${process.env.LUNARCRUSH_API_KEY}`;
    
    const mcpRequest = {
      method: 'tools/list'  // Start with listing available tools
    };
    
    console.log('🔧 MCP Request:', mcpRequest);
    
    try {
      const response = await fetch(sseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',  // Try JSON first, not SSE
        },
        body: JSON.stringify(mcpRequest),
        signal: AbortSignal.timeout(10000)
      });
      
      console.log('📡 MCP Response status:', response.status);
      console.log('📡 MCP Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const text = await response.text();
        console.log('📡 MCP Response text:', text);
        
        try {
          const data = JSON.parse(text);
          return NextResponse.json({
            success: true,
            message: 'MCP tools/list successful',
            data: data
          });
        } catch (parseError) {
          return NextResponse.json({
            success: true,
            message: 'MCP responded but not JSON',
            rawResponse: text
          });
        }
      } else {
        const errorText = await response.text();
        return NextResponse.json({
          success: false,
          error: `MCP returned ${response.status}`,
          errorText: errorText
        });
      }
      
    } catch (mcpError) {
      console.error('❌ MCP call failed:', mcpError);
      
      // Fallback to simple API call
      const fallbackResponse = await fetch(`https://lunarcrush.com/api4/public/coins/list/v2?symbol=${symbol}&limit=1`, {
        headers: {
          'Authorization': `Bearer ${process.env.LUNARCRUSH_API_KEY}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        return NextResponse.json({
          success: true,
          message: 'API fallback worked',
          mcpError: mcpError instanceof Error ? mcpError.message : 'MCP failed',
          data: fallbackData.data?.[0] || null
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Both MCP and API failed',
          mcpError: mcpError instanceof Error ? mcpError.message : 'MCP failed',
          apiStatus: fallbackResponse.status
        });
      }
    }

  } catch (error) {
    console.error('❌ Simple MCP test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Simple MCP test failed',
      debug: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
