import { NextRequest, NextResponse } from 'next/server';

// Add request timeout for production
export const maxDuration = 60; // Amplify allows up to 60 seconds

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Add production error handling
    if (!process.env.GEMINI_API_KEY || !process.env.LUNARCRUSH_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'API keys not configured'
      }, { status: 500 });
    }

    const { query } = await request.json();
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Query is required'
      }, { status: 400 });
    }

    // Your existing analysis logic here...
    // (Keep all the existing code from your current route.ts)
    
  } catch (error) {
    console.error('❌ Production API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Analysis service temporarily unavailable',
      responseTime: Date.now() - startTime
    }, { status: 500 });
  }
}
