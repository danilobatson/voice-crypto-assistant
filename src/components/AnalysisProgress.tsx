'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepIcon,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Mic,
  Psychology,
  Storage,
  TrendingUp,
} from '@mui/icons-material';

interface ProgressStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  status: 'pending' | 'active' | 'completed' | 'error';
}

interface AnalysisProgressProps {
  isAnalyzing: boolean;
  currentStep?: string;
  onComplete?: () => void;
}

export function AnalysisProgress({ isAnalyzing, currentStep, onComplete }: AnalysisProgressProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [steps, setSteps] = useState<ProgressStep[]>([
    {
      id: 'voice',
      label: 'Processing Voice',
      description: 'Converting speech to text',
      icon: Mic,
      status: 'pending'
    },
    {
      id: 'detection',
      label: 'Crypto Detection',
      description: 'Identifying cryptocurrency in query',
      icon: Psychology,
      status: 'pending'
    },
    {
      id: 'mcp',
      label: 'Fetching Data',
      description: 'Gathering real-time social sentiment',
      icon: Storage,
      status: 'pending'
    },
    {
      id: 'analysis',
      label: 'AI Analysis',
      description: 'Generating investment recommendation',
      icon: TrendingUp,
      status: 'pending'
    }
  ]);

  useEffect(() => {
    if (!isAnalyzing) {
      setActiveStep(0);
      setSteps(steps => steps.map(step => ({ ...step, status: 'pending' })));
      return;
    }

    const progressSequence = async () => {
      for (let i = 0; i < steps.length; i++) {
        setActiveStep(i);
        setSteps(prevSteps => prevSteps.map((step, index) => ({
          ...step,
          status: index === i ? 'active' : index < i ? 'completed' : 'pending'
        })));

        // Simulate realistic timing for each step
        const delays = [1000, 1500, 8000, 3000]; // Voice, Detection, MCP, Analysis
        await new Promise(resolve => setTimeout(resolve, delays[i]));
      }

      setSteps(steps => steps.map(step => ({ ...step, status: 'completed' })));
      onComplete?.();
    };

    progressSequence();
  }, [isAnalyzing, onComplete]);

  if (!isAnalyzing) return null;

  const CustomStepIcon = (props: any) => {
    const { active, completed, icon } = props;
    const step = steps[icon - 1];
    const IconComponent = step?.icon || Mic;

    if (completed) {
      return <CheckCircle sx={{ color: 'success.main', fontSize: 24 }} />;
    }

    if (active) {
      return <CircularProgress size={24} thickness={4} />;
    }

    return <IconComponent sx={{ color: 'text.disabled', fontSize: 24 }} />;
  };

  return (
    <Card elevation={2} sx={{ mb: 3 }} className="fade-in">
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
          Analyzing Your Request...
        </Typography>
        
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.id}>
              <StepLabel 
                StepIconComponent={CustomStepIcon}
                sx={{
                  '& .MuiStepLabel-label': {
                    fontSize: '1rem',
                    fontWeight: step.status === 'active' ? 600 : 400,
                    color: step.status === 'completed' ? 'success.main' : 
                           step.status === 'active' ? 'primary.main' : 'text.secondary'
                  }
                }}
              >
                <Box>
                  <Typography variant="body1">{step.label}</Typography>
                  <Typography 
                    variant="body2" 
                    color={step.status === 'active' ? 'text.primary' : 'text.secondary'}
                  >
                    {step.description}
                  </Typography>
                </Box>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {/* Overall Progress Bar */}
        <Box sx={{ mt: 4 }}>
          <LinearProgress 
            variant="determinate" 
            value={(steps.filter(s => s.status === 'completed').length / steps.length) * 100}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
            {steps.filter(s => s.status === 'completed').length} of {steps.length} steps completed
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
