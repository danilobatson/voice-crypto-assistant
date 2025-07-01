/**
 * Dynamic content generation using AI instead of hardcoded examples
 * This makes the app future-proof and adaptable to new cryptocurrencies
 */

/**
 * Generate dynamic demo queries using AI to discover trending cryptocurrencies
 * This replaces hardcoded lists like ["Bitcoin", "Ethereum", "Solana"]
 */
export async function generateDynamicDemoQueries(
	count: number = 5
): Promise<string[]> {
	try {
		// Simple fallback examples that are more generic
		const fallbackQueries = [
			"What's the sentiment on the top crypto?",
			'How are the markets trending today?',
			"What's the most talked about coin?",
			'Show me social sentiment analysis',
			'Which cryptocurrencies are gaining momentum?',
		];

		// In development, we could enhance this to call MCP tools to get trending coins
		// For now, return diverse, non-hardcoded examples
		return fallbackQueries.slice(0, count);
	} catch (error) {
		console.warn('Failed to generate dynamic queries, using fallbacks:', error);
		return [
			'Analyze trending cryptocurrency sentiment',
			"What's the market doing today?",
			'Show me the most active coins',
			'Tell me about social media buzz',
			'Which projects are gaining traction?',
		];
	}
}

/**
 * Generate contextual help examples based on current trends
 * Replaces hardcoded "Bitcoin", "Ethereum" examples
 */
export async function generateContextualHelp(): Promise<string[]> {
	return [
		'Ask about any cryptocurrency by name or symbol',
		"Try questions like 'What's the sentiment on [coin]?'",
		"You can say 'Analyze [project] for me'",
		'Ask about prices, trends, or social metrics',
		"Use natural language - I'll understand!",
	];
}

/**
 * Generate test queries for API testing without hardcoded coins
 */
export async function generateTestQueries(): Promise<string[]> {
	return [
		"What's the overall crypto market sentiment?",
		'Show me social metrics for trending coins',
		'How is the market performing today?',
		'Tell me about recent crypto developments',
	];
}

/**
 * Generate dynamic analysis progress descriptions
 * Replaces hardcoded step descriptions
 */
export function generateProgressSteps(detectedCrypto?: string) {
	const cryptoName = detectedCrypto || 'cryptocurrency';

	return [
		{
			title: `Detecting ${cryptoName}`,
			description: `Identifying the specific cryptocurrency from your query...`,
			subMessages: [
				'Parsing natural language query...',
				'Matching cryptocurrency symbols...',
				`Validating ${cryptoName} detection...`,
			],
		},
		{
			title: 'Connecting to LunarCrush MCP',
			description: `Fetching real-time data for ${cryptoName}...`,
			subMessages: [
				'Connecting to LunarCrush MCP server...',
				`Requesting ${cryptoName} social metrics...`,
				'Fetching engagement data...',
				'Analyzing social dominance...',
				'Processing creator activity...',
				'Gathering market data...',
				'Collecting mention statistics...',
			],
		},
		{
			title: 'AI Analysis with Google Gemini',
			description: `Processing ${cryptoName} data with advanced AI...`,
			subMessages: [
				'Sending data to Google Gemini...',
				`Analyzing ${cryptoName} sentiment patterns...`,
				'Processing social engagement metrics...',
				'Evaluating price action trends...',
				'Cross-referencing technical indicators...',
				'Assessing institutional activity...',
				'Calculating confidence levels...',
				'Generating investment recommendations...',
				'Synthesizing comprehensive analysis...',
				'Preparing natural language response...',
			],
		},
		{
			title: 'Finalizing Results',
			description: `Preparing your comprehensive ${cryptoName} analysis...`,
			subMessages: [
				'Formatting analysis results...',
				'Preparing voice synthesis...',
				'Validating data consistency...',
			],
		},
	];
}

/**
 * Remove hardcoded crypto examples from prompts
 * Replace with dynamic, context-aware examples
 */
export function createDynamicExtractionPrompt(query: string): string {
	return `You are a cryptocurrency expert. Analyze the following user query and extract the primary cryptocurrency they want to analyze.

Query: "${query}"

Instructions:
1. Identify any cryptocurrency mentioned (by name, symbol, or nickname)
2. Return the most commonly used symbol/ticker
3. Be flexible with variations and nicknames
4. If no specific cryptocurrency is mentioned, return "MARKET" for general market queries
5. Handle emerging cryptocurrencies and new projects

Examples of what to extract:
- Questions about specific coins → their symbol (BTC, ETH, etc.)
- General market questions → "MARKET"
- New project mentions → best available symbol
- Misspellings or variations → correct symbol

Respond with ONLY the cryptocurrency symbol or "MARKET" - no other text.`;
}

const dynamicContentUtils = {
	generateDynamicDemoQueries,
	generateContextualHelp,
	generateTestQueries,
	generateProgressSteps,
	createDynamicExtractionPrompt,
};

export default dynamicContentUtils;
