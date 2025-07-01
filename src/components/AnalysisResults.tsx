'use client';

import {
	Box,
	Paper,
	Typography,
	Chip,
	Grid,
	Card,
	Stack,
	alpha,
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
	AccountBalanceWallet,
} from '@mui/icons-material';
import {
	formatCurrency,
	formatPercentage,
	formatLargeNumber,
	formatCount,
} from '@/lib/formatters';

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
		ai_analysis:
			| {
					summary: string;
					pros: string[];
					cons: string[];
					key_factors: string[];
			  }
			| string;
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
			case 'BUY':
				return { bg: '#00C896', text: 'white' };
			case 'SELL':
				return { bg: '#FF6B6B', text: 'white' };
			case 'HOLD':
				return { bg: '#FFB800', text: 'white' };
			default:
				return { bg: '#666', text: 'white' };
		}
	};

	const getSentimentIcon = (sentiment: string) => {
		switch (sentiment) {
			case 'bullish':
				return <TrendingUp sx={{ color: '#00C896' }} />;
			case 'bearish':
				return <TrendingDown sx={{ color: '#FF6B6B' }} />;
			default:
				return <Remove sx={{ color: '#B3B3B3' }} />;
		}
	};

	const getSentimentColor = (sentiment: string) => {
		switch (sentiment) {
			case 'bullish':
				return '#00C896';
			case 'bearish':
				return '#FF6B6B';
			default:
				return '#B3B3B3';
		}
	};

	const recColor = getRecommendationColor(data.recommendation);

	// Format all the metrics using our utility functions for better readability
	const formattedMetrics = {
		price: `$${data.data.key_metrics.price}`,
		marketCap: formatCurrency(data.data.key_metrics.market_cap),
		volume24h: formatCurrency(data.data.key_metrics.volume_24h),
		galaxyScore: data.data.key_metrics.galaxy_score,
		socialDominance: formatPercentage(data.data.key_metrics.social_dominance),
		mentions: formatCount(data.data.key_metrics.mentions),
		engagements: formatCount(data.data.key_metrics.engagements),
		creators: formatCount(data.data.key_metrics.creators),
		altRank: data.data.key_metrics.alt_rank,
	};

	return (
		<Box sx={{ mt: 4 }}>
			{/* Header Section */}
			<Paper elevation={1} sx={{ p: 4, borderRadius: 3, mb: 3 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
					<Psychology sx={{ color: 'primary.main', fontSize: 32 }} />
					<Box>
						<Typography variant='h4' sx={{ fontWeight: 700 }}>
							{data.data.symbol}
						</Typography>
					</Box>
				</Box>

				{/* Key Decision Metrics */}
				<Grid container spacing={3} sx={{ mt: 2 }} gap={3}>
					<Grid size={{ xs: 12, md: 4 }}>
						<Card
							elevation={0}
							sx={{
								bgcolor: alpha(recColor.bg, 0.1),
								border: `2px solid ${recColor.bg}`,
								p: 3,
								textAlign: 'center',
								height: 140,
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'center',
								borderRadius: 2,
							}}>
							<Typography
								variant='subtitle1'
								color='text.secondary'
								gutterBottom>
								Recommendation
							</Typography>
							<Chip
								label={data.data.recommendation}
								sx={{
									bgcolor: recColor.bg,
									color: recColor.text,
									fontSize: '1.1rem',
									fontWeight: 700,
									px: 2,
									py: 1,
									mx: 'auto',
								}}
							/>
						</Card>
					</Grid>

					<Grid size={{ xs: 12, md: 4 }}>
						<Card
							elevation={0}
							sx={{
								bgcolor: alpha('#4285F4', 0.1),
								border: '2px solid #4285F4',
								p: 3,
								textAlign: 'center',
								height: 140,
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'center',
								borderRadius: 2,
							}}>
							<Typography
								variant='subtitle1'
								color='text.secondary'
								gutterBottom>
								Confidence Level
							</Typography>
							<Typography
								variant='h3'
								sx={{ color: '#4285F4', fontWeight: 700 }}>
								{data.data.confidence}%
							</Typography>
						</Card>
					</Grid>

					<Grid size={{ xs: 12, md: 4 }}>
						<Card
							elevation={0}
							sx={{
								bgcolor: alpha(
									getSentimentColor(data.data.social_sentiment),
									0.1
								),
								border: `2px solid ${getSentimentColor(
									data.data.social_sentiment
								)}`,
								p: 3,
								textAlign: 'center',
								height: 140,
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'center',
								borderRadius: 2,
							}}>
							<Typography
								variant='subtitle1'
								color='text.secondary'
								gutterBottom>
								Social Sentiment
							</Typography>
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: 1,
								}}>
								{getSentimentIcon(data.data.social_sentiment)}
								<Typography
									variant='h5'
									sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
									{data.data.social_sentiment}
								</Typography>
							</Box>
						</Card>
					</Grid>
				</Grid>
			</Paper>

			{/* Key Metrics Section with Formatted Numbers */}
			<Paper
				elevation={1}
				sx={{ p: 4, borderRadius: 3, mb: 3,  }}>
				<Typography
					variant='h5'
					gutterBottom
					sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
					<ShowChart sx={{ color: 'primary.main' }} />
					Key Market & Social Metrics
				</Typography>

				<Grid container spacing={3}>
					<Grid size={{ xs: 12, sm: 6, md: 3 }}>
						<Card elevation={0} sx={{ bgcolor: 'background.default', p: 2 }}>
							<Stack
								direction='row'
								alignItems='center'
								spacing={1}
								sx={{ mb: 1 }}>
								<AttachMoney sx={{ color: '#00C896' }} />
								<Typography variant='body2' color='text.secondary'>
									Current Price
								</Typography>
							</Stack>
							<Typography variant='h6' sx={{ fontWeight: 600 }}>
								{formattedMetrics.price}
							</Typography>
						</Card>
					</Grid>

					<Grid size={{ xs: 12, sm: 6, md: 3 }}>
						<Card elevation={0} sx={{ bgcolor: 'background.default', p: 2 }}>
							<Stack
								direction='row'
								alignItems='center'
								spacing={1}
								sx={{ mb: 1 }}>
								<AccountBalanceWallet sx={{ color: '#4285F4' }} />
								<Typography variant='body2' color='text.secondary'>
									Market Cap
								</Typography>
							</Stack>
							<Typography variant='h6' sx={{ fontWeight: 600 }}>
								{formattedMetrics.marketCap}
							</Typography>
						</Card>
					</Grid>

					<Grid size={{ xs: 12, sm: 6, md: 3 }}>
						<Card elevation={0} sx={{ bgcolor: 'background.default', p: 2 }}>
							<Stack
								direction='row'
								alignItems='center'
								spacing={1}
								sx={{ mb: 1 }}>
								<ShowChart sx={{ color: '#FFB800' }} />
								<Typography variant='body2' color='text.secondary'>
									24h Volume
								</Typography>
							</Stack>
							<Typography variant='h6' sx={{ fontWeight: 600 }}>
								{formattedMetrics.volume24h}
							</Typography>
						</Card>
					</Grid>

					<Grid size={{ xs: 12, sm: 6, md: 3 }}>
						<Card elevation={0} sx={{ bgcolor: 'background.default', p: 2 }}>
							<Stack
								direction='row'
								alignItems='center'
								spacing={1}
								sx={{ mb: 1 }}>
								<Speed sx={{ color: '#FF6B6B' }} />
								<Typography variant='body2' color='text.secondary'>
									Galaxy Score
								</Typography>
							</Stack>
							<Typography variant='h6' sx={{ fontWeight: 600 }}>
								{formattedMetrics.galaxyScore}
							</Typography>
						</Card>
					</Grid>

					<Grid size={{ xs: 12, sm: 6, md: 3 }}>
						<Card elevation={0} sx={{ bgcolor: 'background.default', p: 2 }}>
							<Stack
								direction='row'
								alignItems='center'
								spacing={1}
								sx={{ mb: 1 }}>
								<Visibility sx={{ color: '#9C27B0' }} />
								<Typography variant='body2' color='text.secondary'>
									Social Dominance
								</Typography>
							</Stack>
							<Typography variant='h6' sx={{ fontWeight: 600 }}>
								{formattedMetrics.socialDominance}
							</Typography>
						</Card>
					</Grid>

					<Grid size={{ xs: 12, sm: 6, md: 3 }}>
						<Card elevation={0} sx={{ bgcolor: 'background.default', p: 2 }}>
							<Stack
								direction='row'
								alignItems='center'
								spacing={1}
								sx={{ mb: 1 }}>
								<People sx={{ color: '#00BCD4' }} />
								<Typography variant='body2' color='text.secondary'>
									Mentions (24h)
								</Typography>
							</Stack>
							<Typography variant='h6' sx={{ fontWeight: 600 }}>
								{formattedMetrics.mentions}
							</Typography>
						</Card>
					</Grid>

					<Grid size={{ xs: 12, sm: 6, md: 3 }}>
						<Card elevation={0} sx={{ bgcolor: 'background.default', p: 2 }}>
							<Stack
								direction='row'
								alignItems='center'
								spacing={1}
								sx={{ mb: 1 }}>
								<TrendingUp sx={{ color: '#4CAF50' }} />
								<Typography variant='body2' color='text.secondary'>
									Engagements
								</Typography>
							</Stack>
							<Typography variant='h6' sx={{ fontWeight: 600 }}>
								{formattedMetrics.engagements}
							</Typography>
						</Card>
					</Grid>

					<Grid size={{ xs: 12, sm: 6, md: 3 }}>
						<Card elevation={0} sx={{ bgcolor: 'background.default', p: 2 }}>
							<Stack
								direction='row'
								alignItems='center'
								spacing={1}
								sx={{ mb: 1 }}>
								<People sx={{ color: '#FF9800' }} />
								<Typography variant='body2' color='text.secondary'>
									Active Creators
								</Typography>
							</Stack>
							<Typography variant='h6' sx={{ fontWeight: 600 }}>
								{formattedMetrics.creators}
							</Typography>
						</Card>
					</Grid>
				</Grid>
			</Paper>

			{/* Analysis Sections */}
			<Grid container >
				<Grid size={{ xs: 12, md: 6 }}>
					<Paper elevation={1} sx={{ p: 4, borderRadius: 3, mb: 3 }}>
						<Typography
							variant='h6'
							gutterBottom
							sx={{ color: '#00C896', fontWeight: 600 }}>
							🧠 AI Analysis Summary
						</Typography>
						{typeof data.data.ai_analysis === 'object' ? (
							<Stack spacing={2}>
								<Typography
									variant='body1'
									sx={{ lineHeight: 1.7, fontWeight: 500 }}>
									{data.data.ai_analysis.summary}
								</Typography>

								{data.data.ai_analysis.pros.length > 0 && (
									<Box>
										<Typography
											variant='subtitle2'
											sx={{ color: '#00C896', fontWeight: 600, mb: 1 }}>
											Positive Factors:
										</Typography>
										<Box component='ul' sx={{ pl: 2, m: 0 }}>
											{data.data.ai_analysis.pros.map((pro, index) => (
												<Typography
													key={index}
													component='li'
													variant='body2'
													sx={{ mb: 0.5 }}>
													{pro}
												</Typography>
											))}
										</Box>
									</Box>
								)}

								{data.data.ai_analysis.cons.length > 0 && (
									<Box>
										<Typography
											variant='subtitle2'
											sx={{ color: '#FF6B6B', fontWeight: 600, mb: 1 }}>
											Risk Factors:
										</Typography>
										<Box component='ul' sx={{ pl: 2, m: 0 }}>
											{data.data.ai_analysis.cons.map((con, index) => (
												<Typography
													key={index}
													component='li'
													variant='body2'
													sx={{ mb: 0.5 }}>
													{con}
												</Typography>
											))}
										</Box>
									</Box>
								)}

								{data.data.ai_analysis.key_factors.length > 0 && (
									<Box>
										<Typography
											variant='subtitle2'
											sx={{ color: '#4285F4', fontWeight: 600, mb: 1 }}>
											Key Factors to Monitor:
										</Typography>
										<Box component='ul' sx={{ pl: 2, m: 0 }}>
											{data.data.ai_analysis.key_factors.map(
												(factor, index) => (
													<Typography
														key={index}
														component='li'
														variant='body2'
														sx={{ mb: 0.5 }}>
														{factor}
													</Typography>
												)
											)}
										</Box>
									</Box>
								)}
							</Stack>
						) : (
							<Typography variant='body1' sx={{ lineHeight: 1.7 }}>
								{data.data.ai_analysis}
							</Typography>
						)}
					</Paper>
				</Grid>

				<Grid size={{ xs: 12, md: 6 }}>
					<Paper elevation={1} sx={{ p: 4, borderRadius: 3, height: '100%' }}>
						<Typography
							variant='h6'
							gutterBottom
							sx={{ color: '#4285F4', fontWeight: 600 }}>
							📊 Detailed Reasoning
						</Typography>
						<Typography variant='body1' sx={{ lineHeight: 1.7 }}>
							{data.data.reasoning}
						</Typography>
					</Paper>
				</Grid>
			</Grid>

			{/* Detection Info */}
		</Box>
	);
}
