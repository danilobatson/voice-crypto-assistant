import { NextRequest, NextResponse } from 'next/server';

// Add request timeout for production
export const maxDuration = 60; // Amplify allows up to 60 seconds

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Enhanced debugging for AWS Amplify environment variables
    console.log('🔍 FULL Environment Debug:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Platform:', process.platform);
    console.log('AWS Environment:', process.env.AWS_REGION || 'Not AWS');
    console.log('AWS Lambda:', process.env.AWS_LAMBDA_FUNCTION_NAME || 'Not Lambda');
    console.log('Amplify App:', process.env._AMPLIFY_APP_ID || 'Not Amplify');
    
    // Check AWS-specific environment patterns
    console.log('AWS Environment Variables:');
    Object.keys(process.env).filter(key => 
      key.startsWith('AWS') || key.startsWith('_AMPLIFY') || key.startsWith('AMPLIFY')
    ).forEach(key => {
      console.log(`${key}:`, !!process.env[key]);
    });
    
    // Log ALL environment variables to see what's available (remove in production)
    console.log('ALL ENV VARS COUNT:', Object.keys(process.env).length);
    console.log('ALL ENV VARS:', Object.keys(process.env).sort());
    
    // Check for various possible environment variable names including AWS variations
    const possibleGeminiKeys = [
      'GEMINI_API_KEY',
      'NEXT_PUBLIC_GEMINI_API_KEY',
      'REACT_APP_GEMINI_API_KEY',
      'VITE_GEMINI_API_KEY',
      // AWS Amplify might add prefixes or modify names
      'AMPLIFY_GEMINI_API_KEY',
      '_AMPLIFY_GEMINI_API_KEY',
      'AWS_GEMINI_API_KEY'
    ];
    
    const possibleLunarKeys = [
      'LUNARCRUSH_API_KEY',
      'NEXT_PUBLIC_LUNARCRUSH_API_KEY',
      'REACT_APP_LUNARCRUSH_API_KEY',
      'VITE_LUNARCRUSH_API_KEY',
      // AWS Amplify might add prefixes or modify names
      'AMPLIFY_LUNARCRUSH_API_KEY',
      '_AMPLIFY_LUNARCRUSH_API_KEY',
      'AWS_LUNARCRUSH_API_KEY'
    ];
    
    console.log('Checking possible Gemini keys:');
    possibleGeminiKeys.forEach(key => {
      console.log(`${key}:`, !!process.env[key], process.env[key]?.substring(0, 10) + '...');
    });
    
    console.log('Checking possible LunarCrush keys:');
    possibleLunarKeys.forEach(key => {
      console.log(`${key}:`, !!process.env[key], process.env[key]?.substring(0, 10) + '...');
    });
    
    // Try to find any available API key
    const geminiKey = possibleGeminiKeys.find(key => process.env[key]) ? process.env[possibleGeminiKeys.find(key => process.env[key])!] : null;
    const lunarKey = possibleLunarKeys.find(key => process.env[key]) ? process.env[possibleLunarKeys.find(key => process.env[key])!] : null;
    
    console.log('Final resolved keys:');
    console.log('Gemini key found:', !!geminiKey);
    console.log('LunarCrush key found:', !!lunarKey);
    
    // Add production error handling with detailed debug info
    if (!geminiKey || !lunarKey) {
      return NextResponse.json({
        success: false,
        error: 'API keys not configured',
        debug: {
          nodeEnv: process.env.NODE_ENV,
          platform: process.platform,
          awsRegion: process.env.AWS_REGION || 'Not AWS',
          geminiChecked: possibleGeminiKeys.map(key => ({ key, exists: !!process.env[key] })),
          lunarChecked: possibleLunarKeys.map(key => ({ key, exists: !!process.env[key] })),
          allEnvKeys: Object.keys(process.env).sort(),
          envCount: Object.keys(process.env).length
        }
      }, { status: 500 });
    }

    const { query } = await request.json();
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Query is required'
      }, { status: 400 });
    }

    console.log('📊 Starting analysis for query:', query);

    // Initialize MCP client
    const { initMcpClient } = await import('../../../lib/mcp-client');
    const mcpClient = await initMcpClient();
    
    // Extract cryptocurrency mentions from the query
    const cryptoMentions = query.match(/\b(bitcoin|btc|ethereum|eth|solana|sol|cardano|ada|dogecoin|doge|shiba|shib|chainlink|link|polygon|matic|avalanche|avax|polkadot|dot|uniswap|uni)\b/gi) || [];
    const primaryCrypto = cryptoMentions[0] || 'bitcoin';
    
    console.log('🔍 Detected crypto:', primaryCrypto);

    // Fetch market data using MCP
    let marketData = null;
    try {
      const response = await mcpClient.callTool('get_market_data', {
        symbol: primaryCrypto.toUpperCase(),
        interval: '1d'
      });
      
      if (response?.content?.[0]?.text) {
        marketData = JSON.parse(response.content[0].text);
        console.log('📈 Market data fetched successfully');
      }
    } catch (mcpError) {
      console.warn('⚠️ MCP Error:', mcpError);
      // Continue without market data
    }

    // Analyze with Gemini
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are a professional cryptocurrency analyst. Analyze the following query and provide insights.

Query: "${query}"
Primary Cryptocurrency: ${primaryCrypto}

${marketData ? `Current Market Data:
- Price: $${marketData.price}
- 24h Change: ${marketData.percent_change_24h}%
- Volume: $${marketData.volume_24h}
- Market Cap: $${marketData.market_cap}` : 'Market data temporarily unavailable'}

Provide a comprehensive analysis including:
1. Technical analysis of the current market situation
2. Key factors influencing price movement
3. Risk assessment and market sentiment
4. Actionable insights for investors
5. Relevant news or market events

Format your response as a JSON object with the following structure:
{
  "analysis": "detailed analysis text",
  "sentiment": "bullish/bearish/neutral",
  "riskLevel": "low/medium/high",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "priceTarget": "price prediction with timeframe",
  "recommendation": "investment recommendation"
}`;

    const result = await model.generateContent(prompt);
    const analysisText = result.response.text();
    
    console.log('🤖 Gemini analysis completed');

    // Parse Gemini response
    let analysisData;
    try {
      // Extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError: unknown) {
      console.warn('⚠️ Failed to parse Gemini JSON:', parseError, 'using fallback structure');
      analysisData = {
        analysis: analysisText,
        sentiment: 'neutral',
        riskLevel: 'medium',
        keyFactors: ['Market volatility', 'Regulatory environment', 'Adoption trends'],
        priceTarget: 'Analysis required',
        recommendation: 'Conduct further research'
      };
    }

    // Enhance with market data
    if (marketData) {
      analysisData.marketData = {
        price: marketData.price,
        change24h: marketData.percent_change_24h,
        volume: marketData.volume_24h,
        marketCap: marketData.market_cap
      };
    }

    const responseTime = Date.now() - startTime;
    console.log(`✅ Analysis completed in ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      data: analysisData,
      metadata: {
        query,
        cryptocurrency: primaryCrypto,
        analysisTime: new Date().toISOString(),
        responseTime,
        hasMarketData: !!marketData
      }
    });
    
  } catch (error) {
    console.error('❌ Production API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Analysis service temporarily unavailable',
      responseTime: Date.now() - startTime
    }, { status: 500 });
  }
}
