'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Stack,
  Chip,
  alpha
} from '@mui/material';
import {
  Search,
  Psychology,
  Analytics,
  TrendingUp,
  CheckCircle
} from '@mui/icons-material';

interface AnalysisProgressProps {
  isAnalyzing: boolean;
  onComplete?: () => void;
}

export function AnalysisProgress({ isAnalyzing, onComplete }: AnalysisProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [subMessage, setSubMessage] = useState('');

  const steps = [
    {
      icon: <Search />,
      title: 'Detecting Cryptocurrency',
      description: 'Identifying the cryptocurrency from your query...',
      duration: 2000,
      subMessages: [
        'Parsing natural language query...',
        'Matching cryptocurrency symbols...',
        'Validating cryptocurrency detection...'
      ]
    },
    {
      icon: <Analytics />,
      title: 'Connecting to LunarCrush MCP',
      description: 'Fetching real-time social sentiment data...',
      duration: 8000,
      subMessages: [
        'Connecting to LunarCrush MCP server...',
        'Requesting social metrics...',
        'Fetching engagement data...',
        'Analyzing social dominance...',
        'Processing creator activity...',
        'Gathering market data...',
        'Collecting mention statistics...'
      ]
    },
    {
      icon: <Psychology />,
      title: 'AI Analysis with Google Gemini',
      description: 'Processing data with advanced AI...',
      duration: 25000,
      subMessages: [
        'Sending data to Google Gemini...',
        'Analyzing market sentiment patterns...',
        'Processing social engagement metrics...',
        'Evaluating price action trends...',
        'Cross-referencing technical indicators...',
        'Assessing institutional activity...',
        'Calculating confidence levels...',
        'Generating investment recommendations...',
        'Synthesizing comprehensive analysis...',
        'Preparing natural language response...'
      ]
    },
    {
      icon: <TrendingUp />,
      title: 'Finalizing Results',
      description: 'Preparing your comprehensive analysis...',
      duration: 3000,
      subMessages: [
        'Formatting analysis results...',
        'Preparing voice synthesis...',
        'Validating data consistency...'
      ]
    }
  ];

  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentStep(0);
      setProgress(0);
      setSubMessage('');
      return;
    }

    let stepTimer: NodeJS.Timeout;
    let progressTimer: NodeJS.Timeout;
    let subMessageTimer: NodeJS.Timeout;

    const runStep = (stepIndex: number) => {
      if (stepIndex >= steps.length) {
        setProgress(100);
        if (onComplete) onComplete();
        return;
      }

      const step = steps[stepIndex];
      setCurrentStep(stepIndex);

      // Animate progress for this step
      const stepProgress = (stepIndex / steps.length) * 100;
      const nextStepProgress = ((stepIndex + 1) / steps.length) * 100;
      
      let currentProgress = stepProgress;
      progressTimer = setInterval(() => {
        currentProgress += (nextStepProgress - stepProgress) / (step.duration / 100);
        if (currentProgress >= nextStepProgress) {
          currentProgress = nextStepProgress;
          clearInterval(progressTimer);
        }
        setProgress(currentProgress);
      }, 100);

      // Cycle through sub-messages
      let subMessageIndex = 0;
      const showSubMessage = () => {
        if (subMessageIndex < step.subMessages.length) {
          setSubMessage(step.subMessages[subMessageIndex]);
          subMessageIndex++;
          subMessageTimer = setTimeout(showSubMessage, step.duration / step.subMessages.length);
        }
      };
      showSubMessage();

      // Move to next step
      stepTimer = setTimeout(() => {
        clearInterval(progressTimer);
        clearTimeout(subMessageTimer);
        runStep(stepIndex + 1);
      }, step.duration);
    };

    runStep(0);

    return () => {
      clearTimeout(stepTimer);
      clearInterval(progressTimer);
      clearTimeout(subMessageTimer);
    };
  }, [isAnalyzing]);

  if (!isAnalyzing) return null;

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 4, 
        borderRadius: 3,
        background: 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)',
        border: '1px solid #333'
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Psychology sx={{ color: '#00C896' }} />
          Analyzing Cryptocurrency Data
        </Typography>
        
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: alpha('#00C896', 0.2),
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#00C896',
              borderRadius: 4
            }
          }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {Math.round(progress)}% Complete
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            ~{Math.max(0, Math.round((100 - progress) * 0.4))}s remaining
          </Typography>
        </Box>
      </Box>

      <Stack spacing={2}>
        {steps.map((step, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderRadius: 2,
              backgroundColor: index === currentStep 
                ? alpha('#00C896', 0.1)
                : index < currentStep 
                  ? alpha('#00C896', 0.05)
                  : 'transparent',
              border: index === currentStep 
                ? '1px solid #00C896'
                : '1px solid transparent',
              transition: 'all 0.3s ease'
            }}
          >
            <Box
              sx={{
                color: index === currentStep 
                  ? '#00C896'
                  : index < currentStep 
                    ? '#00C896'
                    : 'rgba(255,255,255,0.5)',
                transition: 'color 0.3s ease'
              }}
            >
              {index < currentStep ? <CheckCircle /> : step.icon}
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: index <= currentStep ? 'white' : 'rgba(255,255,255,0.5)',
                  fontWeight: index === currentStep ? 600 : 400
                }}
              >
                {step.title}
              </Typography>
              
              {index === currentStep && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.8)',
                    fontStyle: 'italic',
                    mt: 0.5
                  }}
                >
                  {subMessage || step.description}
                </Typography>
              )}
            </Box>

            {index === currentStep && (
              <Chip
                label="Processing"
                size="small"
                sx={{
                  backgroundColor: alpha('#00C896', 0.2),
                  color: '#00C896',
                  animation: 'pulse 2s infinite'
                }}
              />
            )}
            
            {index < currentStep && (
              <Chip
                label="Complete"
                size="small"
                sx={{
                  backgroundColor: alpha('#00C896', 0.2),
                  color: '#00C896'
                }}
              />
            )}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
