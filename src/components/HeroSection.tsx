'use client';

import { useState, useEffect } from 'react';
import {
	Box,
	Container,
	Typography,
	Button,
	Stack,
	Chip,
	alpha,
} from '@mui/material';
import {
	TrendingUp,
	Psychology,
	Mic,
	AutoAwesome,
	Analytics,
} from '@mui/icons-material';

interface HeroSectionProps {
	onStartVoiceInput?: () => void;
}

export function HeroSection({ onStartVoiceInput }: HeroSectionProps) {
	const [currentDemo, setCurrentDemo] = useState(0);
	const [demoQueries, setDemoQueries] = useState([
		"What's the crypto market sentiment?",
		'How are cryptocurrencies trending?',
		"Analyze today's crypto performance",
		'Tell me about market opportunities',
		'Show me social sentiment data',
	]);

	// Load dynamic demo queries on component mount
	useEffect(() => {
		const loadDynamicQueries = async () => {
			try {
				const dynamicQueries = [
					"What's the sentiment on the top crypto?",
					'How are the markets trending today?',
					"What's the most talked about coin?",
					'Show me social sentiment analysis',
					'Which cryptocurrencies are gaining momentum?',
				];
				setDemoQueries(dynamicQueries);
			} catch (error) {
				console.warn('Failed to load dynamic queries, using fallbacks:', error);
				// Keep the fallback queries already set in state
			}
		};

		loadDynamicQueries();
	}, []);

	// Cycle through demo queries
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentDemo((prev) => (prev + 1) % demoQueries.length);
		}, 3000);
		return () => clearInterval(interval);
	}, []);

	const handleStartVoice = () => {
		// First scroll to the voice assistant section
		const voiceAssistant = document.getElementById('voice-assistant');
		if (voiceAssistant) {
			voiceAssistant.scrollIntoView({ behavior: 'smooth' });

			// Then trigger voice input after a short delay for smooth UX
			setTimeout(() => {
				if (onStartVoiceInput) {
					onStartVoiceInput();
				}
			}, 500);
		}
	};

	return (
		<Box
			sx={{
				background:
					'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #2A2A2A 100%)',
				color: 'white',
				py: { xs: 8, md: 12 },
				position: 'relative',
				overflow: 'hidden',
			}}>
			{/* Animated background elements */}
			<Box
				sx={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					opacity: 0.1,
					background: `
            radial-gradient(circle at 20% 20%, #00C896 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, #FFD700 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, #FF6B6B 0%, transparent 50%)
          `,
				}}
			/>

			<Container maxWidth='lg' sx={{ position: 'relative', zIndex: 1 }}>
				<Box sx={{ textAlign: 'center' }}>
					{/* Main Branding Header */}
					<Typography
						variant='h2'
						component='h1'
						sx={{
							fontWeight: 800,
							fontSize: { xs: '2.5rem', md: '4rem' },
							mb: 2,
							background:
								'linear-gradient(135deg, #00C896 0%, #FFD700 50%, #FF6B6B 100%)',
							backgroundClip: 'text',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
							textAlign: 'center',
						}}>
						Crypto AI Voice Agent
					</Typography>

					{/* Powered by section */}
					<Stack
						direction={{ xs: 'column', sm: 'row' }}
						spacing={1}
						justifyContent='center'
						alignItems='center'
						sx={{ mb: 4 }}>
						<Typography variant='h6' sx={{ color: 'rgba(255,255,255,0.8)' }}>
							Powered by
						</Typography>
						<Stack
							direction='row'
							spacing={1}
							flexWrap='wrap'
							justifyContent='center'>
							<Chip
								icon={<Analytics />}
								label='LunarCrush MCP'
								sx={{
									bgcolor: alpha('#00C896', 0.2),
									color: '#00C896',
									borderColor: '#00C896',
									border: '1px solid',
									fontWeight: 600,
								}}
							/>
							<Chip
								icon={<Psychology />}
								label='Google Gemini'
								sx={{
									bgcolor: alpha('#4285F4', 0.2),
									color: '#4285F4',
									borderColor: '#4285F4',
									border: '1px solid',
									fontWeight: 600,
								}}
							/>
						</Stack>
					</Stack>

					{/* Subtitle */}
					<Typography
						variant='h5'
						sx={{
							color: 'rgba(255,255,255,0.9)',
							mb: 4,
							maxWidth: '600px',
							mx: 'auto',
							lineHeight: 1.4,
							fontWeight: 400,
						}}>
						Real-time cryptocurrency analysis through natural voice conversation
					</Typography>

					{/* Demo query display */}
					<Box
						sx={{
							mb: 6,
							p: 3,
							borderRadius: 2,
							background: 'rgba(255,255,255,0.05)',
							border: '1px solid rgba(255,255,255,0.1)',
							backdropFilter: 'blur(10px)',
						}}>
						<Typography
							variant='body2'
							sx={{
								color: 'rgba(255,255,255,0.6)',
								mb: 1,
								textTransform: 'uppercase',
								letterSpacing: 1,
							}}>
							Try saying:
						</Typography>
						<Typography
							variant='h6'
							sx={{
								color: '#00C896',
								fontStyle: 'italic',
								transition: 'all 0.3s ease',
								minHeight: '2rem',
							}}>
							"{demoQueries[currentDemo]}"
						</Typography>
					</Box>

					{/* CTA Button - Now directly starts voice input */}
					<Button
						variant='contained'
						size='large'
						onClick={handleStartVoice}
						startIcon={<Mic />}
						sx={{
							bgcolor: '#00C896',
							color: 'white',
							px: 4,
							py: 2,
							fontSize: '1.1rem',
							fontWeight: 600,
							borderRadius: 3,
							boxShadow: '0 8px 32px rgba(0, 200, 150, 0.3)',
							'&:hover': {
								bgcolor: '#00B085',
								transform: 'translateY(-2px)',
								boxShadow: '0 12px 40px rgba(0, 200, 150, 0.4)',
							},
							transition: 'all 0.3s ease',
						}}>
						Start Voice Analysis
					</Button>

					{/* Feature highlights */}
					<Stack
						direction={{ xs: 'column', md: 'row' }}
						spacing={4}
						justifyContent='center'
						sx={{ mt: 8 }}>
						{[
							{ icon: <TrendingUp />, text: 'Real-time Social Sentiment' },
							{ icon: <Psychology />, text: 'AI-Powered Analysis' },
							{ icon: <AutoAwesome />, text: 'Natural Voice Interface' },
						].map((feature, index) => (
							<Stack
								key={index}
								direction='row'
								spacing={1}
								alignItems='center'>
								<Box sx={{ color: '#00C896' }}>{feature.icon}</Box>
								<Typography
									variant='body2'
									sx={{ color: 'rgba(255,255,255,0.8)' }}>
									{feature.text}
								</Typography>
							</Stack>
						))}
					</Stack>
				</Box>
			</Container>
		</Box>
	);
}
