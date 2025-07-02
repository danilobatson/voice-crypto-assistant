'use client';

import {
	Box,
	Container,
	Grid,
	Typography,
	Link,
	IconButton,
	Divider,
} from '@mui/material';
import { GitHub, LinkedIn, Email, OpenInNew } from '@mui/icons-material';

export function Footer() {
	const techLinks = [
		{ name: 'Next.js 14', url: 'https://nextjs.org' },
		{ name: 'Material-UI', url: 'https://mui.com' },
  ];

  const powerLinks = [
		{ name: 'Google Gemini AI', url: 'https://ai.google.dev' },
		{ name: 'LunarCrush MCP', url: 'https://lunarcrush.com' },
	];


	return (
		<Box component='footer' sx={{ bgcolor: 'grey.900', color: 'grey.300' }}>
			<Container maxWidth='lg' sx={{ py: 6 }}>
				<Grid container spacing={4}>
					{/* Project Info */}
					<Grid xs={12} md={6}>
						<Typography variant='h6' sx={{ color: 'white', mb: 2 }}>
							Voice Crypto Assistant
						</Typography>
						<Typography variant='body2' sx={{ mb: 3, maxWidth: 400 }}>
							A sophisticated voice-activated cryptocurrency analysis assistant
							that combines Google Gemini AI, LunarCrush social data, and modern
							web technologies.
						</Typography>
						<Box sx={{ display: 'flex', gap: 1 }}>
							<IconButton
								component={Link}
								href='https://github.com/danilobatson'
								target='_blank'
								sx={{ color: 'grey.400', '&:hover': { color: 'white' } }}>
								<GitHub />
							</IconButton>
							<IconButton
								component={Link}
								href='https://linkedin.com/in/danilo-batson'
								target='_blank'
								sx={{ color: 'grey.400', '&:hover': { color: 'white' } }}>
								<LinkedIn />
							</IconButton>
							<IconButton
								component={Link}
								href='mailto:djbatson19@gmail.com'
								sx={{ color: 'grey.400', '&:hover': { color: 'white' } }}>
								<Email />
							</IconButton>
						</Box>
					</Grid>

					{/* Technology Stack */}
					<Grid xs={12} sm={6} md={3}>
						<Typography variant='h6' sx={{ color: 'white', mb: 2 }}>
							Technology
						</Typography>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
							{techLinks.map((tech) => (
								<Link
									key={tech.name}
									href={tech.url}
									target='_blank'
									sx={{
										color: 'grey.400',
										textDecoration: 'none',
										display: 'flex',
										alignItems: 'center',
										gap: 0.5,
										'&:hover': { color: 'white' },
										fontSize: '0.875rem',
									}}>
									{tech.name}
									<OpenInNew sx={{ fontSize: 12 }} />
								</Link>
							))}
						</Box>
					</Grid>

					<Grid xs={12} sm={6} md={3}>
						<Typography variant='h6' sx={{ color: 'white', mb: 2 }}>
							Powered By
						</Typography>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
							{powerLinks.map((link) => (
								<Link
									key={link.name}
									href={link.url}
									target='_blank'
									sx={{
										color: 'grey.400',
										textDecoration: 'none',
										display: 'flex',
										alignItems: 'center',
										gap: 0.5,
										'&:hover': { color: 'white' },
										fontSize: '0.875rem',
									}}>
									{link.name}
									<OpenInNew sx={{ fontSize: 12 }} />
								</Link>
							))}
						</Box>
					</Grid>
				</Grid>

				{/* Bottom Bar */}
				<Divider sx={{ my: 3, bgcolor: 'grey.800' }} />
				<Box
					sx={{
						display: 'flex',
						flexDirection: { xs: 'column', md: 'row' },
						justifyContent: 'space-between',
						alignItems: 'center',
						gap: 2,
					}}>
					<Typography variant='body2' sx={{ color: 'grey.400' }}>
						© 2025 Danilo Jamaal Batson. Built with Next.js, Google Gemini AI,
						and LunarCrush MCP.
					</Typography>
					<Box sx={{ display: 'flex', gap: 3 }}>
						<Link
							href='https://github.com/danilobatson/voice-crypto-assistant'
							target='_blank'
							sx={{
								color: 'grey.400',
								textDecoration: 'none',
								'&:hover': { color: 'white' },
								fontSize: '0.875rem',
							}}>
							View Source
						</Link>
						<Link
							href='https://lunarcrush.com/developers'
							target='_blank'
							sx={{
								color: 'grey.400',
								textDecoration: 'none',
								'&:hover': { color: 'white' },
								fontSize: '0.875rem',
							}}>
							API Documentation
						</Link>
					</Box>
				</Box>
			</Container>
		</Box>
	);
}
