'use client';

import {
  Box,
  Paper,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  Stack,
  Divider,
  alpha
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  TrendingDown,
  Remove,
  AttachMoney,
  ShowChart,
  People,
  Visibility,
  Speed,
  AccountBalanceWallet
} from '@mui/icons-material';
import { formatCurrency, formatPercentage, formatCount, smartFormat } from '@/lib/formatters';

interface AnalysisResultsProps {
  data: {
    success: boolean;
    recommendation: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reasoning: string;
    social_sentiment: 'bullish' | 'bearish' | 'neutral';
    key_metrics: {
      price: string;
      galaxy_score: string;
      alt_rank: string;
      social_dominance: string;
      market_cap: string;
      volume_24h: string;
      mentions: string;
      engagements: string;
      creators: string;
    };
    ai_analysis: string;
    miscellaneous: string;
    spokenResponse: string;
    symbol: string;
    toolsUsed: number;
    dataPoints: number;
    responseTime: number;
    crypto_detection: {
      detected_crypto: string;
      symbol: string;
      confidence: number;
      reasoning: string;
    };
  };
}

export function AnalysisResults({ data }: AnalysisResultsProps) {
  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY': return { bg: '#00C896', text: 'white' };
      case 'SELL': return { bg: '#FF6B6B', text: 'white' };
      case 'HOLD': return { bg: '#FFB800', text: 'white' };
      default: return { bg: '#666', text: 'white' };
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp sx={{ color: '#00C896' }} />;
      case 'bearish': return <TrendingDown sx={{ color: '#FF6B6B' }} />;
      default: return <Remove sx={{ color: '#B3B3B3' }} />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return '#00C896';
      case 'bearish': return '#FF6B6B';
      default: return '#B3B3B3';
    }
  };

  const recColor = getRecommendationColor(data.recommendation);

  // Format all the metrics using our utility functions
  const formattedMetrics = {
    price: formatCurrency(data.key_metrics.price),
    marketCap: formatCurrency(data.key_metrics.market_cap),
    volume24h: formatCurrency(data.key_metrics.volume_24h),
    galaxyScore: data.key_metrics.galaxy_score,
    socialDominance: formatPercentage(data.key_metrics.social_dominance),
    mentions: formatCount(data.key_metrics.mentions),
    engagements: formatCount(data.key_metrics.engagements),
    creators: formatCount(data.key_metrics.creators),
    altRank: formatCount(data.key_metrics.alt_rank)
  };

  return (
    <Box sx={{ mt: 4 }}>
      {/* Header Section */}
      <Paper elevation={1} sx={{ p: 4, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Psychology sx={{ color: 'primary.main', fontSize: 32 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {data.crypto_detection.detected_crypto} ({data.symbol})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Analysis completed in {(data.responseTime / 1000).toFixed(1)}s • {data.toolsUsed} tools used • {data.dataPoints} data points
            </Typography>
          </Box>
        </Box>

        {/* Key Decision Metrics */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card 
              elevation={0} 
              sx={{ 
                bgcolor: alpha(recColor.bg, 0.1), 
                border: `2px solid ${recColor.bg}`,
                textAlign: 'center',
                p: 2
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Recommendation
              </Typography>
              <Chip
                label={data.recommendation}
                sx={{
                  bgcolor: recColor.bg,
                  color: recColor.text,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  px: 2,
                  py: 1
                }}
              />
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card 
              elevation={0} 
              sx={{ 
                bgcolor: alpha('#4285F4', 0.1),
                border: '2px solid #4285F4',
                textAlign: 'center',
                p: 2
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Confidence Level
              </Typography>
              <Typography variant="h3" sx={{ color: '#4285F4', fontWeight: 700 }}>
                {data.confidence}%
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card 
              elevation={0} 
              sx={{ 
                bgcolor: alpha(getSentimentColor(data.social_sentiment), 0.1),
                border: `2px solid ${getSentimentColor(data.social_sentiment)}`,
                textAlign: 'center',
                p: 2
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Social Sentiment
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                {getSentimentIcon(data.social_sentiment)}
                <Typography variant="h5" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                  {data.social_sentiment}
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Key Metrics Section with Formatted Numbers */}
      <Paper elevation={1} sx={{ p: 4, borderRadius: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <ShowChart sx={{ color: 'primary.main' }} />
          Key Market & Social Metrics
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ bgcolor: 'background.default', p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <AttachMoney sx={{ color: '#00C896' }} />
                <Typography variant="body2" color="text.secondary">Current Price</Typography>
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formattedMetrics.price}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ bgcolor: 'background.default', p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <AccountBalanceWallet sx={{ color: '#4285F4' }} />
                <Typography variant="body2" color="text.secondary">Market Cap</Typography>
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formattedMetrics.marketCap}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ bgcolor: 'background.default', p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <ShowChart sx={{ color: '#FFB800' }} />
                <Typography variant="body2" color="text.secondary">24h Volume</Typography>
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formattedMetrics.volume24h}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ bgcolor: 'background.default', p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Speed sx={{ color: '#FF6B6B' }} />
                <Typography variant="body2" color="text.secondary">Galaxy Score</Typography>
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formattedMetrics.galaxyScore}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ bgcolor: 'background.default', p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Visibility sx={{ color: '#9C27B0' }} />
                <Typography variant="body2" color="text.secondary">Social Dominance</Typography>
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formattedMetrics.socialDominance}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ bgcolor: 'background.default', p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <People sx={{ color: '#00BCD4' }} />
                <Typography variant="body2" color="text.secondary">Mentions (24h)</Typography>
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formattedMetrics.mentions}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ bgcolor: 'background.default', p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <TrendingUp sx={{ color: '#4CAF50' }} />
                <Typography variant="body2" color="text.secondary">Engagements</Typography>
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formattedMetrics.engagements}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ bgcolor: 'background.default', p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <People sx={{ color: '#FF9800' }} />
                <Typography variant="body2" color="text.secondary">Active Creators</Typography>
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formattedMetrics.creators}
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Analysis Sections */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 4, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#00C896', fontWeight: 600 }}>
              🧠 AI Analysis Summary
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
              {data.ai_analysis}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 4, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#4285F4', fontWeight: 600 }}>
              📊 Detailed Reasoning
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
              {data.reasoning}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#FFB800', fontWeight: 600 }}>
              🔍 Additional Insights
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
              {data.miscellaneous}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Detection Info */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2, 
          mt: 3,
          bgcolor: alpha('#00C896', 0.05),
          border: '1px solid',
          borderColor: alpha('#00C896', 0.2)
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          🎯 Cryptocurrency Detection
        </Typography>
        <Typography variant="body2">
          <strong>{data.crypto_detection.detected_crypto}</strong> detected with {data.crypto_detection.confidence}% confidence. 
          {data.crypto_detection.reasoning}
        </Typography>
      </Paper>
    </Box>
  );
}
