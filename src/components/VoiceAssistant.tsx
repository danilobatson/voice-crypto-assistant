'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Text, 
  Stack, 
  Group, 
  Badge, 
  Loader,
  Alert,
  Divider
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconMicrophone, IconMicrophoneOff, IconVolume, IconBrain } from '@tabler/icons-react';

interface AnalysisData {
  symbol: string;
  confidence: number;
  recommendation: string;
  sentiment: string;
  reasoning: string;
  spokenResponse: string;
}

export function VoiceAssistant() {
  // Hydration safety: only render interactive content after mount
  const [isMounted, setIsMounted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [lastResponse, setLastResponse] = useState('');

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleVoiceInput = async () => {
    if (isListening) {
      setIsListening(false);
      
      if (transcript.trim()) {
        await processQuery(transcript);
      }
    } else {
      setTranscript('');
      setIsListening(true);
      
      // Simulate voice recognition for now
      setTimeout(() => {
        setTranscript('What is the sentiment on Bitcoin?');
        setIsListening(false);
      }, 2000);
    }
  };

  const processQuery = async (query: string) => {
    setIsProcessing(true);
    
    try {
      console.log("🚀 About to call /api/analyze with query:", query);
      
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      
      console.log("📡 API Response status:", response.status, response.ok);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const apiResult = await response.json();
      console.log("🔍 Raw API Response:", apiResult);
      
      // Convert API response to expected format
      const analysis: AnalysisData = {
        symbol: apiResult.symbol || "BTC",
        confidence: apiResult.confidence || 75,
        recommendation: apiResult.recommendation || "HOLD",
        sentiment: apiResult.sentiment || "neutral",
        reasoning: apiResult.reasoning || apiResult.analysis || "Analysis completed",
        spokenResponse: apiResult.spokenResponse || apiResult.analysis || "Analysis completed"
      };

      setAnalysisData(analysis);
      setLastResponse(analysis.spokenResponse);
      
      // Show success notification only if mounted
      if (isMounted) {
        notifications.show({
          title: 'Analysis Complete',
          message: `${analysis.symbol} analysis ready`,
          color: 'green',
        });
      }

    } catch (error) {
      console.error('Error processing query:', error);
      
      const errorMessage = 'I apologize, but I encountered an error processing your request. Please try again.';
      setLastResponse(errorMessage);
      
      // Show error notification only if mounted
      if (isMounted) {
        notifications.show({
          title: 'Error',
          message: 'Failed to analyze cryptocurrency data',
          color: 'red',
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'bullish': return 'green';
      case 'bearish': return 'red';
      default: return 'blue';
    }
  };

  // Show loading state during hydration
  if (!isMounted) {
    return (
      <Card shadow="md" padding="lg" radius="md" withBorder>
        <Stack gap="md" align="center">
          <Text size="xl" fw={600}>Voice Crypto Assistant</Text>
          <Loader size="sm" />
          <Text size="sm" c="dimmed">Loading interface...</Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Card shadow="md" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        {/* Header */}
        <Text size="xl" fw={600} ta="center">
          Voice Crypto Assistant
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          Ask me about cryptocurrency sentiment, trends, or market analysis
        </Text>

        <Divider />

        {/* Voice Input Section */}
        <Stack gap="sm" align="center">
          <Button
            onClick={handleVoiceInput}
            disabled={isProcessing}
            size="lg"
            color={isListening ? 'red' : 'blue'}
            leftSection={isListening ? <IconMicrophoneOff size={20} /> : <IconMicrophone size={20} />}
          >
            {isListening ? 'Stop Listening' : 'Start Voice Input'}
          </Button>

          {transcript && (
            <Alert variant="light" color="blue">
              <Text size="sm">
                <strong>You said:</strong> "{transcript}"
              </Text>
            </Alert>
          )}
        </Stack>

        {/* Processing Status */}
        {isProcessing && (
          <Group justify="center" gap="sm">
            <Loader size="sm" />
            <Text size="sm">Analyzing with AI...</Text>
            <IconBrain size={16} />
          </Group>
        )}

        {/* Analysis Results */}
        {analysisData && (
          <Stack gap="sm">
            <Divider label="Analysis Results" labelPosition="center" />
            
            <Group justify="apart">
              <Group gap="xs">
                <Badge variant="light">{analysisData.symbol}</Badge>
                <Badge color={getSentimentColor(analysisData.sentiment)}>
                  {analysisData.sentiment}
                </Badge>
              </Group>
              <Badge variant="outline">
                {analysisData.confidence}% confident
              </Badge>
            </Group>

            <Text size="sm" fw={500}>Recommendation: {analysisData.recommendation}</Text>

            <Card withBorder padding="sm" radius="sm">
              <Text size="sm">{analysisData.reasoning}</Text>
            </Card>
          </Stack>
        )}

        {/* Voice Output */}
        {lastResponse && (
          <Stack gap="sm">
            <Divider label="AI Response" labelPosition="center" />
            <Group justify="apart">
              <Text size="sm" fw={500}>Response:</Text>
              <IconVolume size={16} />
            </Group>
            <Card withBorder padding="sm" radius="sm" bg="blue.0">
              <Text size="sm">{lastResponse}</Text>
            </Card>
          </Stack>
        )}

        {/* Instructions */}
        <Text size="xs" c="dimmed" ta="center">
          Try saying: "What's the sentiment on Bitcoin?" or "How is Ethereum trending?"
        </Text>
      </Stack>
    </Card>
  );
}
