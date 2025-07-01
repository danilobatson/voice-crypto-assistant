// Mock data generator for testing the UI - Updated to match real LunarCrush MCP response

export interface MockAnalysisData {
  symbol: string;
  confidence: number;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  reasoning: string;
  marketMetrics: {
    price: string;
    priceChange1h: string;
    priceChange24h: string;
    priceChange7d: string;
    priceChange30d: string;
    galaxyScore: number;
    altRank: number;
    socialDominance: string;
    marketCap: string;
    volume24h: string;
    mentions: string;
    engagements: string;
    creators: string;
    sentiment: number; // 0-100 scale
    marketDominance: string;
    circulatingSupply: string;
  };
  spokenResponse: string;
  rawApiResponse: {
    lunarcrush: {
      topic: any;
      social_sentiment: any;
      market_data: any;
      time_series: any;
    };
    gemini: {
      analysis: any;
      reasoning: any;
      confidence_factors: any;
    };
  };
}

const cryptoData = {
  BTC: {
    name: 'Bitcoin',
    price: '$107,426.90',
    priceChange1h: '0.21%',
    priceChange24h: '-0.95%',
    priceChange7d: '2.0%',
    priceChange30d: '2.8%',
    marketCap: '$2.14T',
    volume: '$41.7B',
    galaxyScore: 56,
    altRank: 169,
    socialDominance: '24.10%',
    mentions: '178.9K',
    engagements: '99.0M',
    creators: '69.4K',
    sentiment: 79,
    marketDominance: '64.50%',
    circulatingSupply: '19.89M'
  },
  ETH: {
    name: 'Ethereum',
    price: '$2,647.82',
    priceChange1h: '0.15%',
    priceChange24h: '1.23%',
    priceChange7d: '-1.8%',
    priceChange30d: '4.2%',
    marketCap: '$318.1B',
    volume: '$12.8B',
    galaxyScore: 68,
    altRank: 2,
    socialDominance: '18.7%',
    mentions: '28.9K',
    engagements: '1.4M',
    creators: '6.1K',
    sentiment: 72,
    marketDominance: '13.2%',
    circulatingSupply: '120.4M'
  },
  SOL: {
    name: 'Solana',
    price: '$197.82',
    priceChange1h: '0.08%',
    priceChange24h: '2.47%',
    priceChange7d: '5.2%',
    priceChange30d: '12.1%',
    marketCap: '$95.2B',
    volume: '$2.1B',
    galaxyScore: 84,
    altRank: 5,
    socialDominance: '8.3%',
    mentions: '19.4K',
    engagements: '892K',
    creators: '3.8K',
    sentiment: 81,
    marketDominance: '4.1%',
    circulatingSupply: '481.2M'
  },
  DOGE: {
    name: 'Dogecoin',
    price: '$0.1053',
    priceChange1h: '-0.12%',
    priceChange24h: '-1.82%',
    priceChange7d: '-3.1%',
    priceChange30d: '8.4%',
    marketCap: '$15.4B',
    volume: '$839M',
    galaxyScore: 61,
    altRank: 12,
    socialDominance: '5.2%',
    mentions: '21.9K',
    engagements: '1.2M',
    creators: '4.3K',
    sentiment: 65,
    marketDominance: '0.7%',
    circulatingSupply: '147.1B'
  },
  ADA: {
    name: 'Cardano',
    price: '$0.4127',
    priceChange1h: '0.05%',
    priceChange24h: '0.84%',
    priceChange7d: '-2.3%',
    priceChange30d: '1.9%',
    marketCap: '$14.8B',
    volume: '$421M',
    galaxyScore: 43,
    altRank: 18,
    socialDominance: '2.1%',
    mentions: '8.7K',
    engagements: '324K',
    creators: '1.9K',
    sentiment: 58,
    marketDominance: '0.6%',
    circulatingSupply: '35.9B'
  }
};

const sentimentReasons = {
  bullish: [
    'Strong social media momentum with increasing positive mentions and growing community engagement across multiple platforms.',
    'Recent institutional developments and strategic accumulation patterns suggesting long-term confidence from major players.',
    'Breaking key resistance levels with strong social backing and community support driving positive sentiment waves.',
    'Positive news coverage and influencer endorsements creating upward momentum in social sentiment metrics.',
    'Technical indicators aligning with social data showing bullish convergence across multiple timeframes.'
  ],
  bearish: [
    'Declining social sentiment with increased negative mentions and community concerns about market direction.',
    'Regulatory uncertainties and market correction fears affecting investor confidence and social engagement.',
    'Technical breakdown accompanied by weakening social metrics and reduced engagement from key contributors.',
    'Profit-taking activities and whale selling pressure creating downward sentiment in social discussions.',
    'Competitive threats and market share concerns reflected in declining social dominance and negative sentiment.'
  ],
  neutral: [
    'Mixed social signals with balanced positive and negative sentiment indicators showing market indecision.',
    'Consolidation phase with steady but unremarkable social engagement levels awaiting catalyst events.',
    'Waiting for key developments with community maintaining cautious optimism while monitoring trends.',
    'Sideways price action reflected in neutral social sentiment and balanced discussion patterns.',
    'Market indecision with equal bullish and bearish social indicators creating uncertainty in sentiment analysis.'
  ]
};

export function generateMockAnalysis(query: string): MockAnalysisData {
  // Extract crypto symbol from query
  const cryptoMatch = query.match(/\b(bitcoin|btc|ethereum|eth|solana|sol|cardano|ada|dogecoin|doge)\b/i);
  const symbol = cryptoMatch ? cryptoMatch[1].toUpperCase() : 'BTC';
  
  // Normalize symbol names
  const normalizedSymbol = symbol === 'BITCOIN' ? 'BTC' : 
                          symbol === 'ETHEREUM' ? 'ETH' : 
                          symbol === 'SOLANA' ? 'SOL' : 
                          symbol === 'CARDANO' ? 'ADA' : 
                          symbol === 'DOGECOIN' ? 'DOGE' : symbol;

  const data = cryptoData[normalizedSymbol as keyof typeof cryptoData] || cryptoData.BTC;
  
  // Generate random but realistic sentiment
  const sentiments = ['bullish', 'bearish', 'neutral'] as const;
  const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
  
  // Generate recommendation based on sentiment with some randomness
  let recommendation: 'BUY' | 'SELL' | 'HOLD';
  if (sentiment === 'bullish') {
    recommendation = Math.random() > 0.3 ? 'BUY' : 'HOLD';
  } else if (sentiment === 'bearish') {
    recommendation = Math.random() > 0.3 ? 'SELL' : 'HOLD';
  } else {
    recommendation = 'HOLD';
  }
  
  const confidence = Math.floor(Math.random() * 25) + 70; // 70-95%
  
  const reasoningTemplates = sentimentReasons[sentiment];
  const reasoning = reasoningTemplates[Math.floor(Math.random() * reasoningTemplates.length)];
  
  const spokenResponse = `Based on my analysis of ${data.name}, I'm showing ${confidence}% confidence with a ${recommendation} recommendation. ${reasoning} Current social dominance is at ${data.socialDominance} with ${data.mentions} mentions in the last 24 hours. The Galaxy Score of ${data.galaxyScore} indicates ${
    data.galaxyScore > 70 ? 'strong' : data.galaxyScore > 50 ? 'moderate' : 'weak'
  } overall performance metrics. Price is ${data.priceChange24h.startsWith('-') ? 'down' : 'up'} ${data.priceChange24h} in the last 24 hours.`;

  // Generate realistic API response mock matching LunarCrush structure
  const rawApiResponse = {
    lunarcrush: {
      topic: {
        symbol: normalizedSymbol,
        name: data.name,
        price: parseFloat(data.price.replace(/[$,]/g, '')),
        percent_change_1h: parseFloat(data.priceChange1h.replace('%', '')),
        percent_change_24h: parseFloat(data.priceChange24h.replace('%', '')),
        percent_change_7d: parseFloat(data.priceChange7d.replace('%', '')),
        percent_change_30d: parseFloat(data.priceChange30d.replace('%', '')),
        market_cap: parseFloat(data.marketCap.replace(/[$,TB]/g, '')) * (data.marketCap.includes('T') ? 1000000000000 : 1000000000),
        volume_24h: parseFloat(data.volume.replace(/[$,BM]/g, '')) * (data.volume.includes('B') ? 1000000000 : 1000000),
        galaxy_score: data.galaxyScore,
        alt_rank: data.altRank,
        social_dominance: parseFloat(data.socialDominance.replace('%', '')),
        interactions_24h: parseInt(data.engagements.replace(/[,MK]/g, '')) * (data.engagements.includes('M') ? 1000000 : 1000),
        social_volume: parseInt(data.mentions.replace(/[,MK]/g, '')) * (data.mentions.includes('K') ? 1000 : 1000000),
        contributors: parseInt(data.creators.replace(/[,MK]/g, '')) * (data.creators.includes('K') ? 1000 : 1),
        sentiment: data.sentiment,
        market_dominance: parseFloat(data.marketDominance.replace('%', '')),
        circulating_supply: parseFloat(data.circulatingSupply.replace(/[,MBT]/g, '')) * (data.circulatingSupply.includes('B') ? 1000000000 : data.circulatingSupply.includes('M') ? 1000000 : 1),
        timestamp: new Date().toISOString()
      },
      social_sentiment: {
        sentiment_score: data.sentiment / 100,
        mention_volume: parseInt(data.mentions.replace(/[,MK]/g, '')) * (data.mentions.includes('K') ? 1000 : 1000000),
        engagement_rate: Math.random() * 0.05 + 0.02,
        creator_diversity: Math.random() * 0.8 + 0.2,
        viral_posts: Math.floor(Math.random() * 20) + 5,
        trending_keywords: ['bullish', 'moon', 'hodl', 'investment', 'btc', 'crypto'].slice(0, Math.floor(Math.random() * 4) + 2),
        network_breakdown: {
          youtube: Math.floor(Math.random() * 1000000) + 500000,
          x: Math.floor(Math.random() * 50000000) + 10000000,
          reddit: Math.floor(Math.random() * 100000) + 50000,
          tiktok: Math.floor(Math.random() * 5000000) + 1000000,
          news: Math.floor(Math.random() * 200000) + 100000
        }
      },
      market_data: {
        price_24h_change: parseFloat(data.priceChange24h.replace('%', '')),
        price_1h_change: parseFloat(data.priceChange1h.replace('%', '')),
        price_7d_change: parseFloat(data.priceChange7d.replace('%', '')),
        volume_24h_change: (Math.random() - 0.5) * 20,
        market_cap_rank: data.altRank,
        social_rank: Math.floor(Math.random() * 50) + 1,
        correlation_btc: normalizedSymbol === 'BTC' ? 1.0 : Math.random() * 0.4 + 0.6,
        year_high: parseFloat(data.price.replace(/[$,]/g, '')) * (1 + Math.random() * 0.3),
        year_low: parseFloat(data.price.replace(/[$,]/g, '')) * (0.5 + Math.random() * 0.3)
      },
      time_series: {
        last_updated: new Date().toISOString(),
        data_points: 168, // 1 week hourly
        price_trend: 'consolidating',
        volume_trend: 'increasing',
        sentiment_trend: sentiment
      }
    },
    gemini: {
      analysis: {
        recommendation: recommendation,
        confidence_score: confidence / 100,
        risk_level: recommendation === 'SELL' ? 'high' : recommendation === 'BUY' ? 'medium' : 'low',
        time_horizon: '1-7 days',
        key_factors: [
          'Social sentiment momentum and engagement patterns',
          'Community creator diversity and contribution quality',
          'Technical indicator alignment with social signals',
          'Market correlation patterns and volume analysis',
          'News sentiment and influencer impact assessment'
        ]
      },
      reasoning: {
        primary_signals: [
          `Social sentiment is ${sentiment} with ${data.sentiment}% positivity score`,
          `Galaxy Score of ${data.galaxyScore} indicates ${data.galaxyScore > 70 ? 'strong' : data.galaxyScore > 50 ? 'moderate' : 'weak'} overall metrics`,
          `Current social dominance at ${data.socialDominance} with ${data.mentions} mentions`,
          `Price ${data.priceChange24h.startsWith('-') ? 'declining' : 'increasing'} ${data.priceChange24h} over 24h`,
          `${data.engagements} total engagements showing ${Math.random() > 0.5 ? 'strong' : 'moderate'} community activity`
        ],
        risk_factors: [
          'Market volatility and external economic conditions',
          'Regulatory environment changes and policy updates',
          'Broader cryptocurrency market sentiment shifts',
          'Technical support and resistance level breaks',
          'Large holder movement and whale activity patterns'
        ],
        opportunities: [
          'Strong social community engagement and growth',
          'Positive sentiment momentum and trend continuation',
          'Technical breakout potential with social confirmation',
          'Institutional interest indicators and adoption signals',
          'Cross-platform social media traction and viral potential'
        ]
      },
      confidence_factors: {
        social_data_quality: 0.87,
        market_data_reliability: 0.93,
        pattern_recognition: 0.82,
        sentiment_accuracy: 0.79,
        price_correlation: 0.74,
        overall_confidence: confidence / 100
      }
    }
  };

  return {
    symbol: normalizedSymbol,
    confidence,
    recommendation,
    sentiment,
    reasoning: `${data.name} presents a ${sentiment} outlook based on current social sentiment analysis. ${reasoning} With a Galaxy Score of ${data.galaxyScore} and social dominance of ${data.socialDominance}, the data suggests ${
      recommendation === 'BUY' ? 'potential upside opportunity with strong social backing' :
      recommendation === 'SELL' ? 'risk mitigation may be prudent given current social trends' :
      'maintaining current positions while monitoring social sentiment developments'
    }. Price action shows ${data.priceChange24h} change over 24 hours with ${data.engagements} social engagements. Always consider your risk tolerance and conduct additional research before making investment decisions.`,
    marketMetrics: {
      price: data.price,
      priceChange1h: data.priceChange1h,
      priceChange24h: data.priceChange24h,
      priceChange7d: data.priceChange7d,
      priceChange30d: data.priceChange30d,
      galaxyScore: data.galaxyScore,
      altRank: data.altRank,
      socialDominance: data.socialDominance,
      marketCap: data.marketCap,
      volume24h: data.volume,
      mentions: data.mentions,
      engagements: data.engagements,
      creators: data.creators,
      sentiment: data.sentiment,
      marketDominance: data.marketDominance,
      circulatingSupply: data.circulatingSupply
    },
    spokenResponse,
    rawApiResponse
  };
}

// Pre-generated analysis for instant display
export const mockAnalysisExamples = [
  generateMockAnalysis('What is the sentiment on Bitcoin?'),
  generateMockAnalysis('Should I buy Ethereum?'),
  generateMockAnalysis('How is Solana trending?'),
  generateMockAnalysis('Tell me about Dogecoin sentiment'),
  generateMockAnalysis('What about Cardano?')
];
