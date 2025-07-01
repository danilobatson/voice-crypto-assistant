/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { parseAIResponse } from '@/lib/json-utils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function createMCPClient(apiKey: string): Promise<Client> {
	console.log('🔄 Initializing MCP client with official SDK...');

	// Create SSE transport for LunarCrush MCP server
	const transport = new SSEClientTransport(
		new URL(`https://lunarcrush.ai/sse?key=${apiKey}`)
	);

	// Create MCP client
	const client = new Client(
		{
			name: 'lunarcrush-mcp-trading',
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

		// Step 2: Let Gemini orchestrate which tools to use
		console.log('🤖 Step 2: Gemini tool orchestration...');
		
		const analysisModel = genAI.getGenerativeModel({
			model: 'gemini-2.0-flash-lite',
		});
		
		// Get available tools from MCP
		const { tools } = await client.listTools();
		console.log(
			'🛠️ Available MCP tools:',
			tools?.map((t) => t.name) || []
		);

		if (!tools || tools.length === 0) {
			throw new Error('No MCP tools available from LunarCrush server');
		}

		// Let Gemini choose which tools to use
		const orchestrationPrompt = `
You are a cryptocurrency analyst. I need you to analyze ${cryptoDetection.name} (${cryptoDetection.symbol}) using the available LunarCrush MCP tools. Use a MAX of four tools.

AVAILABLE MCP TOOLS:
${JSON.stringify(tools, null, 2)}

TASK: Create a plan to gather comprehensive data for ${cryptoDetection.symbol} trading analysis.

Based on the available tools, decide which tools to call and with what parameters to get:
1. Current price and market data
2. Social sentiment metrics  
3. Historical performance data
4. Ranking and positioning data
5. Get one week price historical time series data for charting purposes

Prioritize getting data for the price chart. The price chart is important. If you don't get data back try different solutions (e.g. try the name of the coin FIRST then try the symbol).

Respond with a JSON array of tool calls in this exact format:
[
{
  "tool": "tool_name", 
  "args": {"param": "value"},
  "reason": "Short reason why this tool call is needed"
}
]

Be specific with parameters. For example, if you need to find ${cryptoDetection.symbol} in a list first, plan that step.
`;

		const orchestrationResult = await analysisModel.generateContent(orchestrationPrompt);
		const orchestrationText = orchestrationResult.response.text();

		// Extract and parse tool calls
		let toolCalls = [];
		try {
			const jsonMatch = orchestrationText?.match(/\[[\s\S]*\]/);
			if (!jsonMatch) {
				console.log('⚠️ No JSON array found in orchestration response');
				throw new Error('No tool calls found in orchestration response');
			}
			toolCalls = JSON.parse(jsonMatch[0]);
		} catch (e) {
			console.error('Failed to parse tool orchestration:', orchestrationText);
			throw new Error('Failed to parse tool orchestration response');
		}

		console.log('🎯 Planned tool calls:', toolCalls);

		// Step 3: Execute the planned tool calls
		console.log('🔧 Step 3: Executing planned tool calls...');
		
		const toolResults = [];
		
		// Execute tool calls with proper error handling
		for (const toolCall of toolCalls) {
			try {
				console.log(`�️ Executing: ${toolCall.tool} - ${toolCall.reason}`);
				const result = await client.callTool({
					name: toolCall.tool,
					arguments: toolCall.args,
				});

				toolResults.push({
					tool: toolCall.tool,
					args: toolCall.args,
					reason: toolCall.reason,
					success: true,
					data: result.content,
				});

				console.log(`✅ Tool ${toolCall.tool} executed successfully`);
			} catch (toolError) {
				console.error(`❌ Tool ${toolCall.tool} failed:`, toolError);
				toolResults.push({
					tool: toolCall.tool,
					args: toolCall.args,
					reason: toolCall.reason,
					success: false,
					error: toolError instanceof Error ? toolError.message : 'Unknown error',
				});
			}
		}

		// Step 4: Analyze with Gemini using all gathered data
		console.log('🧠 Step 4: AI analysis with Gemini...');

		const gatheredData = {
			symbol: cryptoDetection.symbol.toUpperCase(),
			toolResults: toolResults,
		};

		const analysisPrompt = `
You are an expert cryptocurrency analyst. Analyze the following data for ${cryptoDetection.symbol.toUpperCase()} gathered from LunarCrush MCP tools and provide a comprehensive trading recommendation.

GATHERED DATA FROM MCP TOOLS:
${JSON.stringify(gatheredData, null, 2)}

ANALYSIS REQUIREMENTS:
Based on the above data from the MCP tools, provide a detailed trading analysis. Look for:

1. CURRENT MARKET DATA:
 - Real current price (not demo data)
 - Market cap and volume
 - Recent performance metrics

2. SOCIAL SENTIMENT:
 - Social mentions and engagement
 - Galaxy Score and health indicators
 - Community sentiment trends

3. POSITIONING DATA:
 - AltRank and market positioning
 - Relative performance vs other cryptocurrencies

4. CHART DATA:
 - Price trends over the last week
 - Could be used to create a chart
 - Could be under close instead of price

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
