'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import {
  TrendingUp,
} from '@mui/icons-material';

export function HeroSection() {
  const [currentDemo, setCurrentDemo] = useState(0);
  
  const demoQueries = [
    "What's the sentiment on Bitcoin?",
    "Should I buy Ethereum?", 
    "How is Solana trending?",
    "Analyze Cardano for me"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDemo((prev) => (prev + 1) % demoQueries.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box 
      sx={{ 
        background: '#0B0B0B',
        color: 'white',
        py: { xs: 8, md: 12 },
        position: 'relative',
        overflow: 'hidden',
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Subtle particle effect background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 50% 50%, rgba(0, 200, 150, 0.03) 0%, transparent 50%),
                      radial-gradient(circle at 20% 80%, rgba(0, 200, 150, 0.02) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(0, 200, 150, 0.02) 0%, transparent 50%)`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='7' r='1'/%3E%3Ccircle cx='47' cy='7' r='1'/%3E%3Ccircle cx='7' cy='27' r='1'/%3E%3Ccircle cx='27' cy='27' r='1'/%3E%3Ccircle cx='47' cy='27' r='1'/%3E%3Ccircle cx='7' cy='47' r='1'/%3E%3Ccircle cx='27' cy='47' r='1'/%3E%3Ccircle cx='47' cy='47' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }
        }}
      />
      
      <Container maxWidth="lg" sx={{ position: 'relative', textAlign: 'center' }}>
        {/* Main headline - Robinhood style */}
        <Typography 
          variant="h1" 
          component="h1" 
          sx={{ 
            mb: 3,
            fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            maxWidth: '900px',
            mx: 'auto'
          }}
        >
          Welcome to a new world of{' '}
          <Box component="span" sx={{ color: '#00C896' }}>
            crypto analysis
          </Box>
        </Typography>
        
        {/* Subtitle */}
        <Typography 
          variant="h5" 
          sx={{ 
            mb: 6, 
            color: '#B3B3B3',
            fontWeight: 400,
            maxWidth: '600px',
            mx: 'auto',
            fontSize: { xs: '1.1rem', md: '1.3rem' }
          }}
        >
          Voice-powered AI analysis with real-time social sentiment data. 
          Get instant BUY/SELL/HOLD recommendations.
        </Typography>
        
        {/* Demo query with subtle animation */}
        <Box 
          sx={{ 
            mb: 6,
            p: 3,
            borderRadius: 2,
            border: '1px solid #2A2A2A',
            backgroundColor: 'rgba(26, 26, 26, 0.5)',
            backdropFilter: 'blur(10px)',
            maxWidth: 500,
            mx: 'auto'
          }}
        >
          <Typography variant="body2" sx={{ color: '#B3B3B3', mb: 1 }}>
            Try saying:
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#FFFFFF',
              fontWeight: 500,
              minHeight: 32,
              transition: 'all 0.5s ease-in-out'
            }}
          >
            "{demoQueries[currentDemo]}"
          </Typography>
        </Box>
        
        {/* CTA Buttons - Robinhood style */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          justifyContent="center"
          sx={{ mb: 6 }}
        >
          <Button
            variant="contained"
            size="large"
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: 3,
              background: '#00C896',
              color: '#000000',
              '&:hover': {
                background: '#00B085',
                transform: 'translateY(-2px)',
              },
            }}
            href="#voice-assistant"
          >
            Start Voice Analysis
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: 3,
              borderColor: '#2A2A2A',
              color: '#FFFFFF',
              '&:hover': {
                borderColor: '#00C896',
                backgroundColor: 'rgba(0, 200, 150, 0.08)',
                color: '#00C896',
              },
            }}
          >
            View Demo
          </Button>
        </Stack>
        
        {/* Subtle feature highlights */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            flexWrap: 'wrap', 
            gap: 4,
            opacity: 0.7
          }}
        >
          {['Voice Recognition', 'AI Analysis', 'Real-time Data'].map((feature, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp sx={{ fontSize: 16, color: '#00C896' }} />
              <Typography variant="body2" sx={{ color: '#B3B3B3', fontSize: '0.875rem' }}>
                {feature}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
