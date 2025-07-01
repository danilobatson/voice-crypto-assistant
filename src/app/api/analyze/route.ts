import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

// Add request timeout for production
export const maxDuration = 60; // Amplify allows up to 60 seconds

interface ToolCall {
	tool: string;
	args: Record<string, unknown>;
	reason: string;
}

interface TradingAnalysis {
	symbol: string;
	recommendation: 'BUY' | 'SELL' | 'HOLD';
	confidence: number;
	reasoning: string;
	social_sentiment: 'bullish' | 'bearish' | 'neutral';
	key_metrics: Record<string, unknown>;
	ai_analysis: {
		summary: string;
		pros: string[];
		cons: string[];
		key_factors: string[];
	};
	timestamp: string;
	chart_data: Array<{ date: string; price: number }>;
	success: boolean;
}

export async function POST(request: NextRequest) {
	if (request.method !== 'POST') {
		return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
	}

	let client: Client | null = null;

	try {
		const { query } = await request.json();

		if (!query) {
			return NextResponse.json({ error: 'Query is required' }, { status: 400 });
		}

		// Let Gemini extract and determine the cryptocurrency from the query
		// This is more flexible and future-proof than hardcoded regex patterns
		const symbol = await extractCryptoFromQuery(query, geminiKey);

		console.log(`🚀 Starting server-side MCP analysis for ${symbol}`);

		// Step 1: Create and connect MCP client
		const lunarKey = process.env.LUNARCRUSH_API_KEY;
		const geminiKey =
			process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

		if (!lunarKey || !geminiKey) {
			console.error('❌ API keys not found');
			return NextResponse.json(
				{
					success: false,
					error: 'API keys not configured',
				},
				{ status: 500 }
			);
		}

		client = await createMCPClient(lunarKey);
		const genAI = new GoogleGenerativeAI(geminiKey);
		const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

		console.log('🔄 MCP client initialized successfully');
		console.log(`🔄 Fetching available MCP tools...`);

		const { tools } = await client.listTools();
		console.log(
			`📋 Available MCP tools: ${tools.map((t: any) => t.name).join(', ')}`
		);

		// Step 2: Let Gemini choose which tools to use
		const orchestrationPrompt = createOrchestrationPrompt(symbol, tools);
		console.log(`🤖 Letting Gemini choose tools for ${symbol} analysis...`);

		const orchestrationResult = await model.generateContent(
			orchestrationPrompt
		);
		const orchestrationText = orchestrationResult.response.text();

		// Step 3: Execute the tool calls
		const gatheredData = await executeToolCalls(
			client,
			orchestrationText,
			symbol
		);

		// Step 4: Let Gemini analyze the gathered data
		const analysisPrompt = createAnalysisPrompt(symbol, gatheredData);
		console.log('🧠 Generating final analysis...');

		const analysisResult = await model.generateContent(analysisPrompt);
		const analysisText = analysisResult.response.text();

		// Step 5: Parse and return the analysis
		const analysisData = parseAnalysisResponse(
			analysisText,
			symbol,
			gatheredData
		);

		return NextResponse.json({
			success: true,
			data: analysisData,
			metadata: {
				query,
				cryptocurrency: symbol,
				analysisTime: new Date().toISOString(),
				hasMarketData: !!gatheredData.toolResults?.length,
			},
		});
	} catch (error) {
		console.error('❌ Server-side MCP analysis error:', error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Analysis failed',
			},
			{ status: 500 }
		);
	} finally {
		// Clean up MCP client connection
		if (client) {
			try {
				await client.close();
				console.log('🧹 MCP client connection closed');
			} catch (cleanupError) {
				console.warn('Warning: MCP client cleanup failed:', cleanupError);
			}
		}
	}
}

// Create MCP client using the exact same method as the working repo
async function createMCPClient(apiKey: string): Promise<Client> {
	console.log('🔄 Initializing MCP client with official SDK...');

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
	console.log('✅ MCP client connected successfully');

	return client;
}

function createOrchestrationPrompt(
	symbol: string,
	availableTools: any[]
): string {
	return `
You are a cryptocurrency analyst with access to powerful LunarCrush MCP tools. Your task is to analyze ${symbol.toUpperCase()} using the most appropriate tools available.

AVAILABLE MCP TOOLS:
${JSON.stringify(availableTools, null, 2)}

ANALYSIS STRATEGY:
1. **Discovery Phase**: If you're not sure about the exact symbol, use tools to search/discover the correct cryptocurrency
2. **Data Gathering**: Collect comprehensive market, social, and sentiment data
3. **Historical Context**: Get price history and trends for chart visualization
4. **Social Intelligence**: Gather community sentiment, mentions, and engagement metrics

IMPORTANT GUIDELINES:
- Use a MAXIMUM of 4 tools for efficiency
- If ${symbol} needs to be found/verified, prioritize discovery tools first
- Focus on tools that provide the most comprehensive data for trading analysis
- Consider both price/market data AND social sentiment data
- If available, get time-series data for charting (weekly or daily data)

TOOL SELECTION CRITERIA:
- Market Data: Current price, volume, market cap, performance metrics
- Social Data: Mentions, sentiment, community engagement, social trends
- Ranking Data: Market position, relative performance, competitive analysis
- Historical Data: Price charts, trend analysis, pattern recognition

Respond with a JSON array of tool calls in this exact format:
[
{
  "tool": "exact_tool_name_from_available_tools",
  "args": {"parameter_name": "parameter_value"},
  "reason": "Clear explanation of why this tool is needed for the analysis"
}
]

Be strategic - choose tools that complement each other and provide a complete picture for trading analysis.`;
}

async function executeToolCalls(
	client: Client,
	orchestrationText: string,
	symbol: string
): Promise<any> {
	try {
		// Extract JSON array from response
		const jsonMatch = orchestrationText.match(/\[[\s\S]*\]/);
		if (!jsonMatch) {
			console.log('⚠️ No JSON array found, using fallback');
			return {
				symbol: symbol.toUpperCase(),
				toolResults: [],
				error: 'No tool calls found in response',
			};
		}

		const toolCalls: ToolCall[] = JSON.parse(jsonMatch[0]);
		const gatheredData: any = {
			symbol: symbol.toUpperCase(),
			toolResults: [],
		};

		// Execute tool calls concurrently
		const toolPromises = toolCalls.map(async (toolCall: ToolCall) => {
			try {
				console.log(`🛠️ Executing: ${toolCall.tool} - ${toolCall.reason}`);
				const result = await client.callTool({
					name: toolCall.tool,
					arguments: toolCall.args,
				});

				return {
					tool: toolCall.tool,
					args: toolCall.args,
					reason: toolCall.reason,
					result,
				};
			} catch (error) {
				console.error(`❌ Tool ${toolCall.tool} failed:`, error);
				return {
					tool: toolCall.tool,
					args: toolCall.args,
					reason: toolCall.reason,
					error: error instanceof Error ? error.message : 'Unknown error',
				};
			}
		});

		gatheredData.toolResults = await Promise.all(toolPromises);
		return gatheredData;
	} catch (error) {
		console.error('❌ Error executing tool choices:', error);
		return {
			symbol: symbol.toUpperCase(),
			toolResults: [],
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

function createAnalysisPrompt(symbol: string, gatheredData: any): string {
	return `
You are an expert cryptocurrency analyst. Analyze the following data for ${symbol.toUpperCase()} gathered from LunarCrush MCP tools and provide a comprehensive trading recommendation.

GATHERED DATA FROM MCP TOOLS:
${JSON.stringify(gatheredData, null, 2)}

ANALYSIS FRAMEWORK:
Analyze the gathered data to understand:

1. **MARKET FUNDAMENTALS**
   - Current price action and market positioning
   - Volume patterns and liquidity analysis
   - Market capitalization and relative market strength
   - Performance metrics vs major cryptocurrencies

2. **SOCIAL INTELLIGENCE** 
   - Community sentiment and engagement trends
   - Social mentions velocity and quality
   - Influencer activity and community growth
   - Social dominance and market buzz analysis

3. **TECHNICAL POSITIONING**
   - Market ranking and competitive position
   - Price trend analysis and momentum indicators
   - Historical performance patterns
   - Support/resistance levels from price data

4. **RISK ASSESSMENT**
   - Volatility analysis and risk factors
   - Market cycle positioning
   - Regulatory and fundamental risks
   - Portfolio allocation considerations

CRITICAL REQUIREMENTS:
- Base your analysis EXCLUSIVELY on the actual data gathered from MCP tools
- If specific data is missing, acknowledge it rather than making assumptions
- Provide actionable insights with clear reasoning
- Include confidence levels based on data quality and completeness
- Make recommendations suitable for both beginners and experienced traders

Respond with a JSON object in this exact format:
{
  "recommendation": "BUY|SELL|HOLD",
  "confidence": 0-100,
  "reasoning": "Clear explanation of the recommendation based on gathered data",
  "social_sentiment": "bullish|bearish|neutral",
  "key_metrics": {
    "price": "actual price from MCP data or 0",
    "galaxy_score": "score from data or N/A",
    "alt_rank": "rank from data or N/A", 
    "social_dominance": "dominance from data or N/A",
    "market_cap": "cap from data or 0",
    "volume_24h": "volume from data or 0",
    "mentions": "mentions from data or N/A",
    "engagements": "engagements from data or N/A",
    "creators": "creators from data or N/A"
  },
  "ai_analysis": {
    "summary": "1-2 sentence overview highlighting key insights from the gathered data",
    "pros": ["Positive factor 1 based on data", "Positive factor 2 based on data"],
    "cons": ["Risk factor 1 based on data", "Risk factor 2 based on data"],
    "key_factors": ["Critical factor 1 to monitor", "Critical factor 2 to monitor"]
  },
  "chart_data": [{"date": "YYYY-MM-DD", "price": actual_price_value}],
  "marketData": {
    "price": actual_price_from_data_or_0,
    "change24h": actual_change_from_data_or_0,
    "volume": actual_volume_from_data_or_0,
    "marketCap": actual_market_cap_from_data_or_0,
    "available": true_if_real_data_available_false_otherwise
  }
}

IMPORTANT: 
- Extract real values from the gathered data - do not use placeholder values
- If chart data is available, format it properly for visualization
- Focus on educational insights that explain market behavior
- Ensure all numeric values are actual numbers, not strings
- Maintain JSON format integrity - no trailing commas or syntax errors`;
}

function parseAnalysisResponse(
	responseText: string,
	symbol: string,
	gatheredData: any
): TradingAnalysis {
	try {
		console.log('🤖 Gemini raw response:', responseText);

		// Extract JSON from response
		const jsonMatch = responseText.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new Error('No JSON found in Gemini response');
		}

		let jsonText = jsonMatch[0];

		// Handle truncated JSON by trying to fix common issues
		if (!jsonText.endsWith('}')) {
			const lastCompleteField = jsonText.lastIndexOf('"}');
			if (lastCompleteField > 0) {
				jsonText = jsonText.substring(0, lastCompleteField + 2) + '}';
			}
		}

		const analysis = JSON.parse(jsonText);

		// Validate and format response
		return {
			symbol: symbol.toUpperCase(),
			recommendation: analysis.recommendation || 'HOLD',
			confidence: analysis.confidence || 50,
			reasoning: analysis.reasoning || 'Analysis completed',
			social_sentiment: analysis.social_sentiment || 'neutral',
			key_metrics: analysis.key_metrics || {},
			ai_analysis: analysis.ai_analysis || {
				summary: 'Analysis completed',
				pros: [],
				cons: [],
				key_factors: [],
			},
			timestamp: new Date().toISOString(),
			chart_data: transformChartData(analysis.chart_data || []),
			success: true,
		};
	} catch (error) {
		console.error('❌ Error parsing Gemini response:', error);

		// Fallback response
		return {
			symbol: symbol.toUpperCase(),
			recommendation: 'HOLD',
			confidence: 50,
			reasoning: 'Analysis completed with limited data',
			social_sentiment: 'neutral',
			key_metrics: gatheredData || {},
			ai_analysis: {
				summary: 'Unable to complete full AI analysis. Please try again.',
				pros: [],
				cons: ['Analysis parsing failed'],
				key_factors: [],
			},
			timestamp: new Date().toISOString(),
			chart_data: [],
			success: true,
		};
	}
}

function transformChartData(
	chartData: Array<{
		time?: string;
		date?: string;
		close?: number;
		price?: number;
	}>
): Array<{ date: string; price: number }> {
	if (!Array.isArray(chartData) || chartData.length === 0) {
		return [];
	}

	// Transform and filter valid data points
	const transformedData = chartData
		.map((item) => ({
			date: item.time || item.date || '',
			price: item.close || item.price || 0,
		}))
		.filter((item) => item.date && item.price > 0)
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	return transformedData;
}

// Intelligent crypto extraction using Gemini AI
async function extractCryptoFromQuery(query: string, geminiKey: string): Promise<string> {
	try {
		const genAI = new GoogleGenerativeAI(geminiKey);
		const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

		const extractionPrompt = `
You are a cryptocurrency expert. Analyze the following user query and extract the primary cryptocurrency they want to analyze.

User Query: "${query}"

INSTRUCTIONS:
1. Identify any cryptocurrency mentioned (by name, symbol, or nickname)
2. Return the most commonly used symbol/ticker (e.g., BTC for Bitcoin, ETH for Ethereum)
3. If multiple cryptocurrencies are mentioned, prioritize the main one being discussed
4. If no specific cryptocurrency is mentioned, suggest BTC as default
5. Handle common variations (e.g., "bitcoin" → "BTC", "ethereum" → "ETH")

Examples:
- "What's the sentiment for Bitcoin?" → BTC
- "How is ETH performing?" → ETH
- "Tell me about Solana price" → SOL
- "Analyze DOGE social metrics" → DOGE
- "What's happening with crypto markets?" → BTC (default)
- "How is Chainlink doing compared to other altcoins?" → LINK

Respond with ONLY the cryptocurrency symbol (e.g., BTC, ETH, SOL, etc.) - no other text.`;

		const result = await model.generateContent(extractionPrompt);
		const symbol = result.response.text().trim().toUpperCase();
		
		// Validate the symbol is reasonable (letters only, 2-10 characters)
		if (/^[A-Z]{2,10}$/.test(symbol)) {
			console.log(`🎯 Gemini extracted cryptocurrency: ${symbol}`);
			return symbol;
		} else {
			console.warn(`⚠️ Invalid symbol extracted: ${symbol}, defaulting to BTC`);
			return 'BTC';
		}
	} catch (error) {
		console.error('❌ Error extracting crypto from query:', error);
		return 'BTC'; // Safe fallback
	}
}
