import { NextRequest, NextResponse } from 'next/server';

// Add request timeout for production
export const maxDuration = 60; // Amplify allows up to 60 seconds

export async function POST(request: NextRequest) {
	const startTime = Date.now();

	try {
		// Simplified environment check - we know they work now
		console.log('🔍 Environment Check:');
		console.log('NODE_ENV:', process.env.NODE_ENV);
		console.log('GEMINI_API_KEY:', !!process.env.GEMINI_API_KEY);
		console.log('LUNARCRUSH_API_KEY:', !!process.env.LUNARCRUSH_API_KEY);

		const geminiKey = process.env.GEMINI_API_KEY;
		const lunarKey = process.env.LUNARCRUSH_API_KEY;

		if (!geminiKey || !lunarKey) {
			console.error('❌ API keys not found');
			return NextResponse.json(
				{
					success: false,
					error: 'API keys not configured',
				},
				{ status: 500 }
			);
		}

		const { query } = await request.json();

		if (!query || query.trim().length === 0) {
			return NextResponse.json(
				{
					success: false,
					error: 'Query is required',
				},
				{ status: 400 }
			);
		}

		console.log('📊 Starting analysis for query:', query);

		// Initialize MCP client with error handling
		let mcpClient;
		try {
			console.log('🔧 Initializing MCP client...');
			const { initMcpClient } = await import('../../../lib/mcp-client');
			mcpClient = await initMcpClient();
			console.log('✅ MCP client initialized successfully');
		} catch (mcpError) {
			console.error('❌ MCP Client initialization failed:', mcpError);
			mcpClient = null;
		}

		// Extract cryptocurrency mentions from the query
		const cryptoMentions =
			query.match(
				/\b(bitcoin|btc|ethereum|eth|solana|sol|cardano|ada|dogecoin|doge|shiba|shib|chainlink|link|polygon|matic|avalanche|avax|polkadot|dot|uniswap|uni)\b/gi
			) || [];
		const primaryCrypto = cryptoMentions[0] || 'bitcoin';

		console.log('🔍 Detected crypto:', primaryCrypto);

		// Fetch market data using MCP
		let marketData = null;
		if (mcpClient) {
			try {
				console.log('📈 Fetching market data via MCP...');
				const response = await mcpClient.callTool('get_market_data', {
					symbol: primaryCrypto.toUpperCase(),
					interval: '1d',
				});

				if (response?.content?.[0]?.text) {
					marketData = JSON.parse(response.content[0].text);
					console.log('✅ Market data fetched successfully');
				}
			} catch (mcpError) {
				console.warn('⚠️ MCP Error:', mcpError);
				// Continue without market data
			}
		} else {
			console.warn('⚠️ MCP client not available, skipping market data');
		}

		// Analyze with Gemini
		console.log('🤖 Initializing Gemini AI...');
		try {
			const { GoogleGenerativeAI } = await import('@google/generative-ai');
			const genAI = new GoogleGenerativeAI(geminiKey);
			const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

			const prompt = `
You are a professional cryptocurrency analyst. Analyze the following query and provide insights.

Query: "${query}"
Primary Cryptocurrency: ${primaryCrypto}

${
	marketData
		? `Current Market Data:
- Price: $${marketData.price}
- 24h Change: ${marketData.percent_change_24h}%
- Volume: $${marketData.volume_24h}
- Market Cap: $${marketData.market_cap}`
		: 'Market data temporarily unavailable'
}

Provide a comprehensive analysis including:
1. Technical analysis of the current market situation
2. Key factors influencing price movement
3. Risk assessment and market sentiment
4. Actionable insights for investors
5. Relevant news or market events

Format your response as a JSON object with the following structure (this is critical - you MUST respond with valid JSON only):
{
  "analysis": "detailed analysis text",
  "sentiment": "bullish/bearish/neutral", 
  "riskLevel": "low/medium/high",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "priceTarget": "price prediction with timeframe",
  "recommendation": "investment recommendation",
  "marketData": {
    "price": ${marketData?.price || 0},
    "change24h": ${marketData?.percent_change_24h || 0},
    "volume": ${marketData?.volume_24h || 0},
    "marketCap": ${marketData?.market_cap || 0},
    "available": ${!!marketData}
  },
  "confidence": 75,
  "reasoning": "Brief explanation of the recommendation",
  "social_sentiment": "bullish/bearish/neutral",
  "key_metrics": {
    "price": ${marketData?.price || 0},
    "galaxy_score": "N/A",
    "alt_rank": "N/A", 
    "social_dominance": "N/A",
    "market_cap": ${marketData?.market_cap || 0},
    "volume_24h": ${marketData?.volume_24h || 0}
  }
}

CRITICAL: Respond with ONLY the JSON object. Do not include any text before or after the JSON. The response must be valid, parseable JSON.`;

			console.log('🚀 Sending request to Gemini...');
			const result = await model.generateContent(prompt);
			const analysisText = result.response.text();

			console.log('✅ Gemini analysis completed');

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
				console.warn(
					'⚠️ Failed to parse Gemini JSON:',
					parseError,
					'using fallback structure'
				);
				analysisData = {
					analysis: analysisText,
					sentiment: 'neutral',
					riskLevel: 'medium',
					keyFactors: [
						'Market volatility',
						'Regulatory environment',
						'Adoption trends',
					],
					priceTarget: 'Analysis required',
					recommendation: 'Conduct further research',
					marketData: {
						price: marketData?.price || 0,
						change24h: marketData?.percent_change_24h || 0,
						volume: marketData?.volume_24h || 0,
						marketCap: marketData?.market_cap || 0,
						available: !!marketData
					},
					confidence: 50,
					reasoning: 'Analysis completed with limited data',
					social_sentiment: 'neutral',
					key_metrics: {
						price: marketData?.price || 0,
						galaxy_score: 'N/A',
						alt_rank: 'N/A',
						social_dominance: 'N/A',
						market_cap: marketData?.market_cap || 0,
						volume_24h: marketData?.volume_24h || 0
					}
				};
			}

			// Market data is now included in the Gemini response structure
			// No need to enhance it separately

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
					hasMarketData: !!marketData,
				},
			});
		} catch (geminiError) {
			console.error('❌ Gemini API Error:', geminiError);
			throw new Error(
				`Gemini API failed: ${
					geminiError instanceof Error
						? geminiError.message
						: String(geminiError)
				}`
			);
		}
	} catch (error) {
		console.error('❌ Production API Error:', error);
		console.error('Error details:', {
			name: error instanceof Error ? error.name : 'Unknown',
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		// Return more specific error information for debugging
		return NextResponse.json(
			{
				success: false,
				error: 'Analysis service temporarily unavailable',
				debug:
					process.env.NODE_ENV === 'production'
						? undefined
						: {
								errorType: error instanceof Error ? error.name : 'Unknown',
								errorMessage:
									error instanceof Error ? error.message : String(error),
								responseTime: Date.now() - startTime,
						  },
				responseTime: Date.now() - startTime,
			},
			{ status: 500 }
		);
	}
}
