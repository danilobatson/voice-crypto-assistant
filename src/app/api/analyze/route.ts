import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

// Ensure we use Node.js runtime for proper streaming support
export const runtime = 'nodejs';
// Add request timeout for production
export const maxDuration = 60; // Amplify allows up to 60 seconds

interface ToolCall {
	tool: string;
	args: Record<string, unknown>;
	reason: string;
	expected_data?: string;
	link_format?: string;
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
	let client: Client | null = null;

	try {
		const { query } = await request.json();

		if (!query) {
			return new Response('{"error": "Query is required"}\n', {
				status: 400,
				headers: {
					'Content-Type': 'text/plain; charset=utf-8',
					'Cache-Control': 'no-cache, no-store, must-revalidate',
					'X-Content-Type-Options': 'nosniff',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
			});
		}

		// Initialize HTTP chunked streaming response
		const stream = new ReadableStream({
			start(controller) {
				const encoder = new TextEncoder();

				const send = (data: any) => {
					const chunk = encoder.encode(`${JSON.stringify(data)}\n`);
					controller.enqueue(chunk);
					// Force flush to ensure immediate delivery in production
					if (typeof (controller as any).flush === 'function') {
						(controller as any).flush();
					}
				};

				const sendError = (error: string) => {
					send({
						type: 'error',
						message: 'Analysis failed',
						speak:
							'Sorry, I encountered an issue analyzing that. Please try again.',
						error,
						timestamp: Date.now(),
					});
					controller.close();
				};

				const processAnalysis = async () => {
					try {
						// Step 1: Get API keys first
						const lunarKey = process.env.LUNARCRUSH_API_KEY;
						const geminiKey =
							process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

						if (!lunarKey || !geminiKey) {
							sendError('API keys not configured');
							return;
						}

						send({
							type: 'progress',
							message: 'Initializing crypto analysis...',
							step: 1,
							totalSteps: 7,
							timestamp: Date.now(),
						});

						// Step 2: Let Gemini extract and determine the cryptocurrency from the query
						const cryptoInfo = await extractCryptoFromQuery(query, geminiKey);
						const symbol = cryptoInfo.symbol;
						const fullName = cryptoInfo.fullName;

						console.log(
							`Starting streaming analysis for ${symbol} (${fullName})`
						);

						send({
							type: 'progress',
							message: `Analyzing ${fullName} (${symbol})...`,
							step: 2,
							totalSteps: 7,
							symbol,
							fullName,
							timestamp: Date.now(),
						});

						// Step 3: Create and connect MCP client
						client = await createMCPClient(lunarKey);
						const genAI = new GoogleGenerativeAI(geminiKey);
						const model = genAI.getGenerativeModel({
							model: 'gemini-2.0-flash-lite',
						});

						console.log('MCP client initialized successfully');

						send({
							type: 'progress',
							message: 'Connected to LunarCrush data sources...',
							step: 3,
							totalSteps: 7,
							timestamp: Date.now(),
						});

						// Step 4: Get available tools
						console.log(`Fetching available MCP tools...`);
						const { tools } = await client.listTools();
						console.log(
							`Available MCP tools: ${tools.map((t: any) => t.name).join(', ')}`
						);

						send({
							type: 'progress',
							message: `Found ${tools.length} analysis tools available...`,
							step: 4,
							totalSteps: 7,
							toolsAvailable: tools.length,
							timestamp: Date.now(),
						});

						// Step 5: Let Gemini choose which tools to use with enhanced instructions
						const orchestrationPrompt = createEnhancedOrchestrationPrompt(
							symbol,
							fullName,
							tools
						);
						console.log(
							`Letting Gemini choose tools for ${symbol} analysis...`
						);

						const orchestrationResult = await model.generateContent(
							orchestrationPrompt
						);
						const orchestrationText = orchestrationResult.response.text();

						send({
							type: 'progress',
							message: 'Planning comprehensive market analysis...',
							step: 5,
							totalSteps: 7,
							timestamp: Date.now(),
						});

						// Step 6: Execute the tool calls
						console.log(`Starting tool execution phase...`);
						const gatheredData = await executeToolCalls(
							client,
							orchestrationText,
							symbol
						);

						// Enhanced logging for monitoring
						console.log(`Tool execution summary:`);
						console.log(
							`   Total tools attempted: ${
								gatheredData.toolResults?.length || 0
							}`
						);
						const successfulTools =
							gatheredData.toolResults?.filter((r: any) => !r.error) || [];
						const failedTools =
							gatheredData.toolResults?.filter((r: any) => r.error) || [];
						console.log(`   Successful tools: ${successfulTools.length}`);
						console.log(`   Failed tools: ${failedTools.length}`);

						if (successfulTools.length > 0) {
							console.log(
								`   Working tools: ${successfulTools
									.map((t: any) => t.tool)
									.join(', ')}`
							);
							successfulTools.forEach((tool: any) => {
								const responseLength = tool.raw_response?.length || 0;
								console.log(
									`      ${tool.tool}: ${responseLength} chars of data`
								);
							});
						}

						if (failedTools.length > 0) {
							console.log(
								`   Failed tools: ${failedTools
									.map((t: any) => `${t.tool} (${t.error})`)
									.join(', ')}`
							);
						}

						send({
							type: 'progress',
							message: `Market data gathered from ${successfulTools.length} sources...`,
							step: 6,
							totalSteps: 7,
							toolsUsed: successfulTools.length,
							toolsFailed: failedTools.length,
							timestamp: Date.now(),
						});

						// Step 7: Let Gemini analyze the gathered data with enhanced prompts
						const analysisPrompt = createEnhancedAnalysisPrompt(
							symbol,
							gatheredData
						);
						console.log('Generating comprehensive analysis...');
						console.log(
							`Analysis prompt length: ${analysisPrompt.length} characters`
						);
						console.log(
							`Data being analyzed: ${
								JSON.stringify(gatheredData).length
							} characters`
						);

						const analysisResult = await model.generateContent(analysisPrompt);
						const analysisText = analysisResult.response.text();
						console.log(
							`Gemini analysis response length: ${analysisText.length} characters`
						);

						// Step 8: Parse and return the analysis
						const analysisData = parseAnalysisResponse(
							analysisText,
							symbol,
							gatheredData
						);

						// Enhanced logging for final results
						console.log(`Final analysis summary:`);
						console.log(`   Symbol: ${analysisData.symbol}`);
						console.log(`   Recommendation: ${analysisData.recommendation}`);
						console.log(`   Confidence: ${analysisData.confidence}%`);
						console.log(`   Sentiment: ${analysisData.social_sentiment}`);
						console.log(
							`   Key metrics count: ${
								Object.keys(analysisData.key_metrics).length
							}`
						);
						console.log(
							`   Chart data points: ${analysisData.chart_data.length}`
						);
						console.log(
							`   Analysis pros: ${analysisData.ai_analysis.pros.length}`
						);
						console.log(
							`   Analysis cons: ${analysisData.ai_analysis.cons.length}`
						);

						const completenessScore =
							calculateAnalysisCompleteness(analysisData);
						console.log(`   Analysis completeness: ${completenessScore}%`);

						send({
							type: 'complete',
							data: analysisData,
							metadata: {
								query,
								cryptocurrency: symbol,
								fullName,
								analysisTime: new Date().toISOString(),
								hasMarketData: !!gatheredData.toolResults?.length,
								toolsUsed: successfulTools.length,
								toolsFailed: failedTools.length,
								dataCompleteness: completenessScore,
								totalProcessingTime: Date.now(),
							},
							message: 'Analysis complete!',
							speak:
								"That's my comprehensive analysis! Let me know if you need more details.",
							timestamp: Date.now(),
						});

						controller.close();
					} catch (error) {
						console.error('Streaming analysis error:', error);
						sendError(
							error instanceof Error ? error.message : 'Analysis failed'
						);
					} finally {
						// Clean up MCP client connection
						if (client) {
							try {
								await client.close();
								console.log('MCP client connection closed');
							} catch (cleanupError) {
								console.warn(
									'Warning: MCP client cleanup failed:',
									cleanupError
								);
							}
						}
					}
				};

				// Start the analysis process
				processAnalysis();
			},
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				'Connection': 'keep-alive',
				'Transfer-Encoding': 'chunked',
				'X-Content-Type-Options': 'nosniff',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			},
		});
	} catch (error) {
		console.error('Streaming endpoint error:', error);
		return new Response(
			`{"type": "error", "message": "Analysis failed", "error": "${
				error instanceof Error ? error.message : 'Unknown error'
			}", "timestamp": ${Date.now()}}\n`,
			{
				status: 500,
				headers: {
					'Content-Type': 'text/plain; charset=utf-8',
					'Cache-Control': 'no-cache, no-store, must-revalidate',
					'Connection': 'keep-alive',
					'X-Content-Type-Options': 'nosniff',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
			}
		);
	}
}

// Create MCP client using the exact same method as the working repo
async function createMCPClient(apiKey: string): Promise<Client> {
	console.log('Initializing MCP client with official SDK...');

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
	console.log('MCP client connected successfully');

	return client;
}

function createEnhancedOrchestrationPrompt(
	symbol: string,
	fullName: string,
	availableTools: any[]
): string {
	return `
You are a cryptocurrency analyst with access to powerful LunarCrush MCP tools. Your task is to analyze ${fullName} (${symbol}) using the most appropriate tools available.

AVAILABLE MCP TOOLS:
${JSON.stringify(availableTools, null, 2)}

ANALYSIS TARGET: ${fullName} (${symbol})

ENHANCED INSTRUCTIONS:
1. **Study the tool schemas carefully** - Each tool has specific input requirements and data types
2. **Choose 3-5 complementary tools** that will provide comprehensive analysis coverage
3. **Use proper parameters** - Follow the exact schema requirements for each tool
4. **Try flexible topic matching** - Use "${symbol}", "${fullName}", or keyword variations as needed
5. **Prioritize working tools** - Choose tools most likely to have data for this specific cryptocurrency

TOOL SELECTION STRATEGY:
Choose tools that cover these essential areas:
- **Market Data & Performance**: Price, volume, market cap, rankings, historical performance
- **Social Intelligence**: Mentions, sentiment, engagement, community activity, social dominance
- **Market Analysis**: Competitive positioning, market trends, correlation analysis
- **Risk & Technical Metrics**: Volatility, technical indicators, market health scores

PARAMETER OPTIMIZATION GUIDELINES:
- **topic/symbol parameters**: Try "${symbol}" first, then "${fullName}", then keyword variants
- **Date parameters**: Use recent dates like "2025-06-24" to "2025-07-01" for current data
- **Required vs Optional**: Include ALL required parameters, add optionals only if clearly beneficial
- **Data types**: Match schema exactly - strings in quotes, numbers without quotes, arrays as arrays
- **Enum values**: Use exact enum options from schema (check carefully for valid options)

OUTPUT FORMAT:
Respond with a JSON array of tool calls:

[
  {
    "tool": "exact_tool_name_from_schema",
    "args": {
      "topic": "${symbol}",
      "required_param": "exact_value_matching_schema"
    },
    "reason": "Why this tool is essential for comprehensive ${fullName} analysis",
    "expected_data": "What specific key data this will provide (price, sentiment, metrics, etc.)",
    "link_format": "Expected REST endpoint format for this tool"
  }
]

CRITICAL SUCCESS REQUIREMENTS:
- **Match schemas exactly** - Wrong parameter names/types cause immediate failures
- **Focus on high-value tools** - Choose tools most likely to return meaningful data for ${symbol}
- **Quality over quantity** - 3-5 well-chosen tools beats many random/duplicate ones
- **Real parameter values** - Use actual dates, proper symbol formats, valid enum options
- **No redundancy** - Avoid multiple tools that return essentially the same data type

TOOL SELECTION PRIORITIES:
1. **Primary Market Data** - Choose 1-2 tools for core price/volume/ranking data
2. **Social Intelligence** - Choose 1-2 tools for sentiment/community/engagement metrics
3. **Analytical Tools** - Choose 1-2 tools for deeper analysis/comparisons/insights
4. **Avoid** - Skip tools with complex/unusual parameter requirements unless essential

Select the optimal tool set for comprehensive ${fullName} (${symbol}) analysis now.`;
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
			console.log('No JSON array found, using fallback');
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
				console.log(`Executing: ${toolCall.tool}`);
				console.log(`   Reason: ${toolCall.reason}`);
				console.log(
					`   Expected Data: ${toolCall.expected_data || 'Not specified'}`
				);
				console.log(
					`   Link Format: ${toolCall.link_format || 'Not specified'}`
				);
				console.log(`   Arguments: ${JSON.stringify(toolCall.args)}`);

				const result = await client.callTool({
					name: toolCall.tool,
					arguments: toolCall.args,
				});

				console.log(`   ${toolCall.tool} completed successfully`);

				// Extract the raw text response from MCP with proper type checking
				const rawResponse =
					Array.isArray(result.content) &&
					result.content.length > 0 &&
					result.content[0]?.text
						? result.content[0].text
						: 'No response';
				console.log(`   Raw response type: ${typeof rawResponse}`);
				console.log(
					`   Raw response preview: ${rawResponse.substring(0, 200)}...`
				);

				return {
					tool: toolCall.tool,
					args: toolCall.args,
					reason: toolCall.reason,
					expected_data: toolCall.expected_data,
					link_format: toolCall.link_format,
					raw_response: rawResponse, // Keep the raw text for Gemini to parse
					result,
				};
			} catch (error) {
				console.error(`Tool ${toolCall.tool} failed:`, error);
				console.error(`   Was trying to: ${toolCall.reason}`);
				console.error(`   With arguments: ${JSON.stringify(toolCall.args)}`);
				return {
					tool: toolCall.tool,
					args: toolCall.args,
					reason: toolCall.reason,
					expected_data: toolCall.expected_data,
					link_format: toolCall.link_format,
					raw_response: null,
					error: error instanceof Error ? error.message : 'Unknown error',
				};
			}
		});

		gatheredData.toolResults = await Promise.all(toolPromises);
		return gatheredData;
	} catch (error) {
		console.error('Error executing tool choices:', error);
		return {
			symbol: symbol.toUpperCase(),
			toolResults: [],
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

function createEnhancedAnalysisPrompt(
	symbol: string,
	gatheredData: any
): string {
	return `
You are an expert cryptocurrency analyst with deep market knowledge. You have gathered comprehensive data from LunarCrush MCP tools for ${symbol.toUpperCase()}, but the tools returned raw text/markdown responses instead of structured JSON. Your job is to intelligently parse this raw data and provide a professional trading recommendation.

RAW DATA FROM MCP TOOLS:
${JSON.stringify(gatheredData, null, 2)}

ENHANCED PARSING INSTRUCTIONS:
1. **Parse the raw_response fields thoroughly** - These contain the actual valuable data in text/markdown format
2. **Extract all numeric values** - Look for prices, volumes, scores, percentages, rankings, etc.
3. **Identify sentiment indicators** - Words like "bullish", "bearish", "positive", "negative", "growing", "declining"
4. **Handle various text formats** - Data may be in markdown tables, plain text, or structured formats
5. **Focus on successful tools** - Prioritize data from tools that didn't error out
6. **Cross-reference data sources** - Look for consistency across multiple tool responses

COMPREHENSIVE ANALYSIS FRAMEWORK:
Parse the raw responses to extract and synthesize:

1. **MARKET FUNDAMENTALS & PERFORMANCE**
   - Current price action, daily/weekly performance trends
   - Volume patterns, liquidity analysis, and market participation
   - Market capitalization, ranking, and relative market positioning
   - Historical performance vs Bitcoin, Ethereum, and top altcoins

2. **SOCIAL INTELLIGENCE & COMMUNITY HEALTH**
   - Social sentiment trends, community engagement levels
   - Social mentions velocity, quality, and reach metrics
   - Influencer activity, developer activity, community growth patterns
   - Social dominance score and market buzz analysis

3. **TECHNICAL & MARKET POSITIONING**
   - Market ranking position and competitive landscape analysis
   - Price trend analysis, momentum indicators, volatility metrics
   - Support/resistance levels, technical pattern recognition
   - Market cycle positioning and correlation with broader crypto markets

4. **RISK ASSESSMENT & INVESTMENT PERSPECTIVE**
   - Volatility analysis, downside risk evaluation
   - Regulatory considerations and fundamental project risks
   - Market cycle timing and macroeconomic factors
   - Portfolio allocation recommendations and risk management

CRITICAL DATA EXTRACTION REQUIREMENTS:
- **Parse numeric values precisely** - Extract actual prices, volumes, percentages from text
- **Identify trending patterns** - Look for growth/decline indicators in the data
- **Extract sentiment signals** - Find qualitative assessments within the text responses
- **Map data to metrics** - Convert text descriptions to quantifiable key_metrics
- **If chart/time series data exists**, convert it to proper JSON format
- **Acknowledge data limitations** - If insufficient data, state it clearly rather than guessing

ENHANCED OUTPUT REQUIREMENTS:
- **Educational insights** that explain what the parsed data means for traders/investors
- **Specific reasoning** based on actual extracted data points, not generic crypto advice
- **Realistic confidence levels** based on data quality and completeness
- **Actionable recommendations** with clear risk considerations

Respond with a JSON object in this exact format:
{
  "recommendation": "BUY|SELL|HOLD",
  "confidence": 0-100,
  "reasoning": "Clear explanation based on the ACTUAL parsed data from tool responses - cite specific metrics",
  "social_sentiment": "bullish|bearish|neutral",
  "key_metrics": {
    "price": "extracted_price_or_0",
    "galaxy_score": "extracted_score_or_N/A",
    "alt_rank": "extracted_rank_or_N/A",
    "social_dominance": "extracted_dominance_or_N/A",
    "market_cap": "extracted_cap_or_0",
    "volume_24h": "extracted_volume_or_0",
    "mentions": "extracted_mentions_or_N/A",
    "engagements": "extracted_engagements_or_N/A",
    "creators": "extracted_creators_or_N/A",
    "sentiment_score": "extracted_sentiment_or_N/A",
    "price_change_24h": "extracted_change_or_0"
  },
  "ai_analysis": {
    "summary": "1-2 sentence overview based on ACTUAL parsed data with specific metrics cited",
    "pros": ["Positive factor 1 from parsed data", "Positive factor 2 from parsed data", "Positive factor 3 if available"],
    "cons": ["Risk factor 1 from parsed data", "Risk factor 2 from parsed data", "Risk factor 3 if available"],
    "key_factors": ["Critical factor 1 from data", "Critical factor 2 from data", "Critical factor 3 if available"]
  },
  "chart_data": [{"date": "YYYY-MM-DD", "price": actual_parsed_price}],
  "marketData": {
    "price": actual_parsed_price_or_0,
    "change24h": actual_parsed_change_or_0,
    "volume": actual_parsed_volume_or_0,
    "marketCap": actual_parsed_cap_or_0,
    "available": true_if_real_data_was_parsed_false_otherwise
  }
}

CRITICAL SUCCESS REQUIREMENTS:
- **Parse and extract real values** from the text responses - don't use placeholder values
- **If chart/time series data is in text**, convert it to the required JSON format
- **Focus on educational insights** that explain what the parsed data means for trading decisions
- **Ensure all numeric values are actual numbers**, not strings (except when marked as strings)
- **Maintain JSON format integrity** - no trailing commas or syntax errors
- **Cite specific data** - Reference actual numbers/metrics found in the tool responses
- **Be realistic about confidence** - Lower confidence if data is limited or conflicting

Remember: The MCP tools returned TEXT/MARKDOWN, not JSON. Your job is to be an intelligent parser and extract valuable insights from these text responses while providing professional trading analysis.`;
}

function parseAnalysisResponse(
	responseText: string,
	symbol: string,
	gatheredData: any
): TradingAnalysis {
	try {
		console.log('Gemini raw response:', responseText);

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
		console.error('Error parsing Gemini response:', error);

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

// Calculate analysis completeness score for monitoring
function calculateAnalysisCompleteness(analysis: TradingAnalysis): number {
	const checks = [
		!!analysis.symbol,
		!!analysis.recommendation,
		typeof analysis.confidence === 'number' && analysis.confidence > 0,
		!!analysis.reasoning && analysis.reasoning.length > 20,
		!!analysis.social_sentiment,
		!!analysis.key_metrics && Object.keys(analysis.key_metrics).length > 0,
		!!analysis.ai_analysis &&
			!!analysis.ai_analysis.summary &&
			analysis.ai_analysis.summary.length > 10,
		!!analysis.ai_analysis &&
			Array.isArray(analysis.ai_analysis.pros) &&
			analysis.ai_analysis.pros.length > 0,
		!!analysis.ai_analysis &&
			Array.isArray(analysis.ai_analysis.cons) &&
			analysis.ai_analysis.cons.length > 0,
		!!analysis.ai_analysis &&
			Array.isArray(analysis.ai_analysis.key_factors) &&
			analysis.ai_analysis.key_factors.length > 0,
		!!analysis.chart_data && Array.isArray(analysis.chart_data),
		!!analysis.timestamp,
		analysis.success === true,
	];

	return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

// Intelligent crypto extraction using Gemini AI
async function extractCryptoFromQuery(
	query: string,
	geminiKey: string
): Promise<{ symbol: string; fullName: string }> {
	try {
		const genAI = new GoogleGenerativeAI(geminiKey);
		const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

		const extractionPrompt = `
You are a cryptocurrency expert. Analyze the following user query and extract the primary cryptocurrency they want to analyze.

User Query: "${query}"

INSTRUCTIONS:
1. Identify any cryptocurrency mentioned (by name, symbol, or nickname)
2. If multiple cryptocurrencies are mentioned, prioritize the main one being discussed
3. If no specific cryptocurrency is mentioned, suggest Bitcoin as default
4. Handle common variations and be precise with popular cryptocurrencies

IMPORTANT: Your response MUST be in this EXACT format - two lines only:
SYMBOL: [TICKER_SYMBOL]
NAME: [FULL_CRYPTOCURRENCY_NAME]

Examples:
- "What's the sentiment for Bitcoin?" → SYMBOL: BTC\nNAME: Bitcoin
- "How is ETH performing?" → SYMBOL: ETH\nNAME: Ethereum
- "Tell me about Solana price" → SYMBOL: SOL\nNAME: Solana
- "Analyze DOGE social metrics" → SYMBOL: DOGE\nNAME: Dogecoin
- "BTC price analysis" → SYMBOL: BTC\nNAME: Bitcoin
- "What's happening with crypto markets?" → SYMBOL: BTC\nNAME: Bitcoin

Respond with exactly two lines in the format above - no other text.`;

		const result = await model.generateContent(extractionPrompt);
		const responseText = result.response.text().trim();

		console.log(`Gemini extraction response: ${responseText}`);

		// Parse the structured response
		const lines = responseText.split('\n');
		let symbol = 'BTC';
		let fullName = 'Bitcoin';

		for (const line of lines) {
			if (line.startsWith('SYMBOL:')) {
				symbol = line.replace('SYMBOL:', '').trim().toUpperCase();
			} else if (line.startsWith('NAME:')) {
				fullName = line.replace('NAME:', '').trim();
			}
		}

		// Validate we got a reasonable symbol (2-10 uppercase letters)
		if (!/^[A-Z]{2,10}$/.test(symbol)) {
			console.warn(`Invalid symbol "${symbol}", defaulting to BTC`);
			symbol = 'BTC';
			fullName = 'Bitcoin';
		}

		console.log(`Extracted: ${symbol} (${fullName})`);
		return { symbol, fullName };
	} catch (error) {
		console.error('Error extracting crypto from query:', error);
		return {
			symbol: 'BTC',
			fullName: 'Bitcoin',
		}; // Safe fallback
	}
}
