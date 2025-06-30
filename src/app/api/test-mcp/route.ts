import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔍 Testing basic LunarCrush MCP connection...');
    
    const hasApiKey = !!process.env.LUNARCRUSH_API_KEY;
    console.log('🔍 API Key available:', hasApiKey);
    
    if (!hasApiKey) {
      return NextResponse.json({
        success: false,
        error: 'LunarCrush API key not configured',
        debug: { hasApiKey: false }
      });
    }

    // Test 1: Basic SSE endpoint connectivity
    console.log('🔍 Testing SSE endpoint...');
    const sseUrl = `https://lunarcrush.ai/sse?key=${process.env.LUNARCRUSH_API_KEY}`;
    
    try {
      const sseResponse = await fetch(sseUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      console.log('📡 SSE Response status:', sseResponse.status);
      console.log('📡 SSE Response headers:', Object.fromEntries(sseResponse.headers.entries()));
      
      if (sseResponse.ok) {
        return NextResponse.json({
          success: true,
          message: 'SSE endpoint accessible',
          debug: {
            sseStatus: sseResponse.status,
            sseHeaders: Object.fromEntries(sseResponse.headers.entries())
          }
        });
      } else {
        return NextResponse.json({
          success: false,
          error: `SSE endpoint returned ${sseResponse.status}`,
          debug: {
            sseStatus: sseResponse.status,
            sseStatusText: sseResponse.statusText
          }
        });
      }
      
    } catch (sseError) {
      console.error('❌ SSE connection failed:', sseError);
      
      // Test 2: Fallback to regular API
      console.log('🔍 Testing regular API fallback...');
      try {
        const apiResponse = await fetch('https://lunarcrush.com/api4/public/coins/list/v2?limit=1', {
          headers: {
            'Authorization': `Bearer ${process.env.LUNARCRUSH_API_KEY}`,
            'Content-Type': 'application/json',
          }
        });
        
        console.log('📊 API Response status:', apiResponse.status);
        
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          return NextResponse.json({
            success: true,
            message: 'Regular API accessible (SSE failed)',
            debug: {
              sseError: sseError instanceof Error ? sseError.message : 'SSE connection failed',
              apiStatus: apiResponse.status,
              apiDataSample: apiData.data?.[0] || null
            }
          });
        } else {
          return NextResponse.json({
            success: false,
            error: 'Both SSE and API failed',
            debug: {
              sseError: sseError instanceof Error ? sseError.message : 'SSE failed',
              apiStatus: apiResponse.status,
              apiStatusText: apiResponse.statusText
            }
          });
        }
        
      } catch (apiError) {
        return NextResponse.json({
          success: false,
          error: 'Complete connection failure',
          debug: {
            sseError: sseError instanceof Error ? sseError.message : 'SSE failed',
            apiError: apiError instanceof Error ? apiError.message : 'API failed'
          }
        });
      }
    }

  } catch (error) {
    console.error('❌ Complete MCP test failure:', error);
    
    return NextResponse.json({
      success: false,
      error: 'MCP test failed completely',
      debug: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}
