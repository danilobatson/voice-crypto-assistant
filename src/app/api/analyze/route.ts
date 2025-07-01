/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { parseAIResponse } from '@/lib/json-utils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function createMCPClient(apiKey: string): Promise<Client> {
	console.log('🔄 Initializing MCP client with official SDK...');

	// Create SSE transport for LunarCrush MCP server (API key in URL)
	const transport = new SSEClientTransport(
		new URL(`https://lunarcrush.ai/sse?key=${apiKey}`)
	);

	// Create MCP client
	const client = new Client(
		{
			name: 'lunarcrush-mcp-crypto-assistant',
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
	console.log('✅ MCP client connected successfully');

	return client;
}

export async function POST(request: NextRequest) {
	const startTime = Date.now();
	let client: Client | null = null;

	try {
		const { query } = await request.json();

		if (!query || typeof query !== 'string') {
			return NextResponse.json(
				{ success: false, error: 'Query is required' },
				{ status: 400 }
			);
		}

		console.log(`🚀 Starting analysis for query: "${query}"`);

		// Initialize MCP client
		client = await createMCPClient(process.env.LUNARCRUSH_API_KEY!);

		// Step 1: Let Gemini identify what cryptocurrency the user is asking about
		console.log('🔍 Step 1: AI-powered cryptocurrency detection...');
		const detectionModel = genAI.getGenerativeModel({
			model: 'gemini-2.0-flash-lite',
		});

		const detectionPrompt = `
Analyze this user query and identify what cryptocurrency they're asking about: "${query}"

If you can identify a specific cryptocurrency, return ONLY a JSON object with:
{
  "detected": true,
  "symbol": "BTC",
  "name": "Bitcoin",
  "confidence": 95,
  "reasoning": "User explicitly mentioned Bitcoin"
}

If no cryptocurrency is mentioned, return:
{
  "detected": false,
  "reasoning": "No specific cryptocurrency mentioned in query"
}

IMPORTANT: Return ONLY valid JSON, no other text.
`;

		const detectionResult = await detectionModel.generateContent(
			detectionPrompt
		);
		const detectionText = detectionResult.response.text();

		let cryptoDetection;
		try {
			// Try to parse the AI response as JSON directly first
			const cleanedText = detectionText
				.replace(/```json\s*|\s*```/g, '')
				.trim();
			cryptoDetection = JSON.parse(cleanedText);
		} catch (e) {
			console.error('Failed to parse detection result:', detectionText);

			// Fallback: Try to detect crypto manually from the query
			const queryLower = query.toLowerCase();
			const cryptoPatterns = {
				bitcoin: { symbol: 'BTC', name: 'Bitcoin' },
				btc: { symbol: 'BTC', name: 'Bitcoin' },
				ethereum: { symbol: 'ETH', name: 'Ethereum' },
				eth: { symbol: 'ETH', name: 'Ethereum' },
				solana: { symbol: 'SOL', name: 'Solana' },
				sol: { symbol: 'SOL', name: 'Solana' },
				cardano: { symbol: 'ADA', name: 'Cardano' },
				ada: { symbol: 'ADA', name: 'Cardano' },
				dogecoin: { symbol: 'DOGE', name: 'Dogecoin' },
				doge: { symbol: 'DOGE', name: 'Dogecoin' },
			};

			let fallbackDetection = null;
			for (const [keyword, crypto] of Object.entries(cryptoPatterns)) {
				if (queryLower.includes(keyword)) {
					fallbackDetection = {
						detected: true,
						symbol: crypto.symbol,
						name: crypto.name,
						confidence: 90,
						reasoning: `Detected ${crypto.name} from keyword "${keyword}" in query`,
					};
					break;
				}
			}

			if (fallbackDetection) {
				console.log('🔄 Using fallback detection:', fallbackDetection);
				cryptoDetection = fallbackDetection;
			} else {
				console.error('No cryptocurrency detected in query:', query);
				return NextResponse.json(
					{
						success: false,
						error:
							'Could not identify which cryptocurrency you want to analyze.',
						suggestion:
							'Please mention a specific cryptocurrency like Bitcoin, Ethereum, Solana, etc.',
					},
					{ status: 400 }
				);
			}
		}

		console.log('🎯 Crypto detection result:', cryptoDetection);

		if (!cryptoDetection.detected) {
			return NextResponse.json(
				{
					success: false,
					error: 'Please specify which cryptocurrency you want to analyze.',
					suggestion:
						'Try asking: "What\'s the sentiment on Bitcoin?" or "How is Ethereum trending?"',
				},
				{ status: 400 }
			);
		}

		// Step 2: Fetch data from LunarCrush MCP for the detected cryptocurrency
		console.log(
			`📊 Step 2: Fetching LunarCrush data for ${cryptoDetection.symbol}...`
		);

		const toolResults = [];

		try {
			// Use MCP to call LunarCrush tools dynamically
			const availableTools = await client.listTools();
			console.log(
				'🛠️ Available MCP tools:',
				availableTools.tools?.map((t) => t.name)
			);

			// Try to get comprehensive data about the cryptocurrency
			const dataFetchPromises = [];

			// Look for relevant tools that might give us crypto data
			const relevantTools =
				availableTools.tools?.filter(
					(tool) =>
						tool.name.includes('topic') ||
						tool.name.includes('crypto') ||
						tool.name.includes('coin') ||
						tool.name.includes('sentiment') ||
						tool.name.includes('social')
				) || [];

			for (const tool of relevantTools.slice(0, 3)) {
				// Limit to 3 tools for performance
				try {
					console.log(`🔧 Calling MCP tool: ${tool.name}`);
					const result = await client.callTool({
						name: tool.name,
						arguments: {
							symbol: cryptoDetection.symbol.toLowerCase(),
							topic: cryptoDetection.symbol.toLowerCase(),
							crypto: cryptoDetection.symbol.toLowerCase(),
							query: cryptoDetection.name,
						},
					});

					toolResults.push({
						tool: tool.name,
						success: true,
						data: result.content,
					});

					console.log(`✅ Tool ${tool.name} executed successfully`);
				} catch (toolError) {
					console.error(`❌ Tool ${tool.name} failed:`, toolError);
					toolResults.push({
						tool: tool.name,
						success: false,
						error:
							toolError instanceof Error ? toolError.message : 'Unknown error',
					});
				}
			}
		} catch (mcpError) {
			console.error('❌ MCP data fetching failed:', mcpError);
			toolResults.push({
				tool: 'mcp_general',
				success: false,
				error:
					mcpError instanceof Error
						? mcpError.message
						: 'MCP connection failed',
			});
		}

		// Step 3: Analyze with Gemini using all available data
		console.log('🧠 Step 3: AI analysis with Gemini...');

		const analysisModel = genAI.getGenerativeModel({
			model: 'gemini-2.0-flash-lite',
		});

		const toolDataSummary = toolResults.map((result) => ({
			tool: result.tool,
			success: result.success,
			data: result.success ? result.data : result.error,
		}));

		const analysisPrompt = `
You are a professional cryptocurrency analyst. Analyze the following query and data:

USER QUERY: "${query}"
DETECTED CRYPTOCURRENCY: ${cryptoDetection.name} (${cryptoDetection.symbol})

LUNARCRUSH MCP DATA:
${JSON.stringify(toolDataSummary, null, 2)}

CRITICAL: You MUST respond with ONLY a valid JSON object. No markdown, no code blocks, no additional text.

Return this EXACT JSON structure:
{
  "recommendation": "BUY|SELL|HOLD",
  "confidence": 0-100,
  "reasoning": "Brief explanation of the recommendation",
  "social_sentiment": "bullish|bearish|neutral",
  "key_metrics": {
    "price": "actual price from MCP data",
    "galaxy_score": "score from data",
    "alt_rank": "rank from data",
    "social_dominance": "dominance from data",
    "market_cap": "cap from data",
    "volume_24h": "volume from data",
    "mentions": "mentions from data",
    "engagements": "engagements/interactions from data",
    "creators": "creators from data"
  },
  "ai_analysis": {
    "summary": "1-2 sentence overview of the analysis",
    "pros": ["Positive factor 1", "Positive factor 2", "etc"],
    "cons": ["Risk factor 1", "Risk factor 2", "etc"],
    "key_factors": ["Important factor to monitor 1", "Important factor 2", "etc"]
  },
  "miscellaneous": "Any other relevant insights",
  "spokenResponse": "Natural response for voice synthesis (2-3 sentences)"
}

REQUIREMENTS:
- Extract ACTUAL data from the MCP results where available
- If specific data is missing, use "N/A" for that field
- Base recommendation on available social sentiment and market data
- Keep spokenResponse natural and conversational for voice output
- Response must be valid JSON only - NO markdown formatting, NO code blocks, NO extra text
- Keep spokenResponse natural and conversational for voice output
- Include specific numbers and percentages where possible

Return ONLY valid JSON, no other text.
`;

		const analysisResult = await analysisModel.generateContent(analysisPrompt);
		const analysisText = analysisResult.response.text();

		let analysis;
		try {
			// Clean the response text to remove markdown formatting
			let cleanedText = analysisText.trim();

			// Remove markdown code blocks if present
			cleanedText = cleanedText
				.replace(/```json\s*/g, '')
				.replace(/\s*```/g, '');

			// Remove any leading/trailing non-JSON text
			const jsonStart = cleanedText.indexOf('{');
			const jsonEnd = cleanedText.lastIndexOf('}');

			if (jsonStart !== -1 && jsonEnd !== -1) {
				cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
			}

			console.log(
				'🧹 Cleaned analysis text:',
				cleanedText.substring(0, 200) + '...'
			);

			// Try to parse the cleaned JSON
			analysis = JSON.parse(cleanedText);

			// Validate required fields and add defaults if missing
			if (!analysis.recommendation) analysis.recommendation = 'HOLD';
			if (!analysis.confidence) analysis.confidence = 50;
			if (!analysis.social_sentiment) analysis.social_sentiment = 'neutral';
			if (!analysis.key_metrics) analysis.key_metrics = {};
			if (!analysis.ai_analysis) {
				analysis.ai_analysis = {
					summary: `Analysis completed for ${cryptoDetection.name} with available data.`,
					pros: ['Market data available', 'AI analysis completed'],
					cons: ['Limited data availability', 'Market volatility'],
					key_factors: [
						'Monitor price movements',
						'Watch social sentiment',
						'Consider market trends',
					],
				};
			}
			if (!analysis.spokenResponse) {
				analysis.spokenResponse = `Analysis completed for ${cryptoDetection.name}. Recommendation is ${analysis.recommendation} with ${analysis.confidence}% confidence.`;
			}
		} catch (e) {
			console.error('Failed to parse analysis result:', analysisText);

			// Fallback analysis with the detected crypto info
			analysis = {
				recommendation: 'HOLD',
				confidence: 50,
				reasoning: `Analysis completed for ${cryptoDetection.name} based on available data. Consider market conditions and your risk tolerance.`,
				social_sentiment: 'neutral',
				key_metrics: {
					price: 'N/A',
					market_cap: 'N/A',
					volume_24h: 'N/A',
					galaxy_score: 'N/A',
					social_dominance: 'N/A',
					mentions: 'N/A',
					engagements: 'N/A',
					creators: 'N/A',
					alt_rank: 'N/A',
				},
				ai_analysis: {
					summary: `Analysis for ${cryptoDetection.name} completed with limited data availability.`,
					pros: [
						'Basic analysis completed',
						'Cryptocurrency detected successfully',
					],
					cons: ['Limited market data', 'API response parsing issues'],
					key_factors: [
						'Retry query for better data',
						'Monitor market conditions',
						'Consider alternative data sources',
					],
				},
				miscellaneous:
					'Please try your query again for more detailed analysis.',
				spokenResponse: `I've analyzed ${cryptoDetection.name} based on available data. The analysis suggests a hold position while monitoring market conditions.`,
			};
		}

		// Step 4: Construct final response
		const responseTime = Date.now() - startTime;

		const response = {
			success: true,
			...analysis,
			symbol: cryptoDetection.symbol,
			toolsUsed: toolResults.length,
			dataPoints: toolResults.filter((r) => r.success).length,
			responseTime,
			crypto_detection: cryptoDetection,
		};

		console.log(
			`✅ Analysis complete for ${cryptoDetection.symbol} in ${responseTime}ms`
		);
		return NextResponse.json(response);
	} catch (error) {
		console.error('❌ API Error:', error);

		const fallbackResponse = {
			success: false,
			error: error instanceof Error ? error.message : 'Analysis failed',
			spokenResponse:
				'I apologize, but I encountered an error analyzing the cryptocurrency data. Please try again in a moment.',
			toolsUsed: 0,
			dataPoints: 0,
			responseTime: Date.now() - startTime,
		};

		return NextResponse.json(fallbackResponse, { status: 500 });
	} finally {
		// Clean up MCP client connection
		if (client) {
			try {
				await client.close();
				console.log('🔒 MCP client connection closed');
			} catch (error) {
				console.error('⚠️ Error closing MCP client:', error);
			}
		}
	}
}
