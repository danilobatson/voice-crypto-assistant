'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  Text,
  Group,
  Stack,
  Badge,
  Alert,
  Loader,
  Container,
  Title,
  Paper,
  List,
  ThemeIcon
} from '@mantine/core';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useVoiceOutput } from '@/hooks/useVoiceOutput';
import { 
  IconMicrophone, 
  IconMicrophoneOff, 
  IconVolume, 
  IconVolumeOff, 
  IconBrain,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus
} from '@tabler/icons-react';

export function VoiceAssistant() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<any>(null);

  const {
    transcript,
    isListening,
    isMicrophoneAvailable,
    startListening,
    stopListening,
    resetTranscript,
    error: voiceError
  } = useVoiceRecognition();

  const {
    isSpeaking,
    speak,
    stop: stopSpeaking,
    error: speechError
  } = useVoiceOutput();

  const handleVoiceInput = async () => {
    if (isListening) {
      stopListening();
      
      if (transcript.trim()) {
        await processQuery(transcript);
      }
    } else {
      resetTranscript();
      startListening();
    }
  };

  const processQuery = async (query: string) => {
    setIsProcessing(true);
    
    try {
      // Mock analysis for now - replace with your actual API call
      const mockAnalysis = {
        summary: `Analysis complete for query: "${query}"`,
        insights: [
          'Strong social sentiment detected',
          'Trading volume above average',
          'Positive trend indicators'
        ],
        recommendations: [
          'Monitor for continued momentum',
          'Consider position sizing'
        ],
        sentiment: 'bullish' as const,
        confidence: 85,
        spokenResponse: `Based on current social sentiment data, I'm seeing strong bullish signals for your query about ${query}. The confidence level is high at 85%, with trading volume above average and positive trend indicators.`
      };

      setAnalysisData(mockAnalysis);
      setLastResponse(mockAnalysis.spokenResponse);

      // Speak the response
      await speak(mockAnalysis.spokenResponse);

    } catch (error) {
      console.error('Error processing query:', error);
      const errorMessage = 'I apologize, but I encountered an error processing your request. Please try again.';
      setLastResponse(errorMessage);
      await speak(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'green';
      case 'bearish': return 'red';
      default: return 'blue';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return IconTrendingUp;
      case 'bearish': return IconTrendingDown;
      default: return IconMinus;
    }
  };

  return (
    <Container size="md" py="xl">
      <Card shadow="lg" padding="xl" radius="md">
        <Stack gap="xl">
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <Title order={2} mb="xs">Voice Crypto Assistant</Title>
            <Text c="dimmed" size="lg">
              Ask me about cryptocurrency sentiment, trends, or market analysis
            </Text>
          </div>

          {/* Voice Input Section */}
          <div style={{ textAlign: 'center' }}>
            <Button
              onClick={handleVoiceInput}
              disabled={!isMicrophoneAvailable || isProcessing}
              size="xl"
              radius="xl"
              h={80}
              w={250}
              color={isListening ? 'red' : 'blue'}
              variant="filled"
              leftSection={
                isListening ? (
                  <IconMicrophoneOff size={24} />
                ) : (
                  <IconMicrophone size={24} />
                )
              }
              className={isListening ? 'voice-listening' : ''}
            >
              {isListening ? 'Stop Listening' : 'Start Voice Input'}
            </Button>

            {transcript && (
              <Paper p="md" mt="md" bg="gray.0">
                <Text size="sm" c="dark">
                  <strong>You said:</strong> "{transcript}"
                </Text>
              </Paper>
            )}
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <Group justify="center" gap="sm">
              <Loader size="sm" className="voice-processing" />
              <Text size="sm">Analyzing with AI...</Text>
            </Group>
          )}

          {/* Voice Output Section */}
          {(isSpeaking || lastResponse) && (
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Text fw={600}>AI Response:</Text>
                {isSpeaking && (
                  <Button 
                    onClick={stopSpeaking} 
                    variant="outline" 
                    size="xs"
                    leftSection={<IconVolumeOff size={16} />}
                  >
                    Stop
                  </Button>
                )}
              </Group>
              
              <Paper p="md" bg="blue.0" radius="md">
                <Text size="sm">{lastResponse}</Text>
                {isSpeaking && (
                  <Group mt="xs" gap="xs">
                    <IconVolume size={16} color="blue" className="voice-speaking" />
                    <Text size="xs" c="blue">Speaking...</Text>
                  </Group>
                )}
              </Paper>
            </Stack>
          )}

          {/* Analysis Data */}
          {analysisData && (
            <Stack gap="md">
              <Text fw={600}>Analysis Summary:</Text>
              
              <Group>
                <Badge 
                  color={getSentimentColor(analysisData.sentiment)}
                  size="lg"
                  leftSection={
                    <ThemeIcon 
                      size="xs" 
                      color={getSentimentColor(analysisData.sentiment)}
                      variant="transparent"
                    >
                      {(() => {
                        const Icon = getSentimentIcon(analysisData.sentiment);
                        return <Icon size={12} />;
                      })()}
                    </ThemeIcon>
                  }
                >
                  {analysisData.sentiment.toUpperCase()}
                </Badge>
                
                <Badge variant="outline" size="lg">
                  {analysisData.confidence}% confident
                </Badge>
              </Group>

              <div>
                <Text size="sm" fw={500} mb="xs">Key Insights:</Text>
                <List size="sm" spacing="xs">
                  {analysisData.insights.map((insight: string, index: number) => (
                    <List.Item key={index}>{insight}</List.Item>
                  ))}
                </List>
              </div>
            </Stack>
          )}

          {/* Error Display */}
          {(voiceError || speechError) && (
            <Alert color="red" variant="light">
              <Text size="sm">
                {voiceError || speechError}
              </Text>
            </Alert>
          )}

          {/* Usage Instructions */}
          <Paper p="md" bg="gray.0" radius="md">
            <Text size="sm" ta="center" c="dimmed">
              Try saying: "What's the sentiment on Bitcoin?" or "How is Ethereum trending?"
            </Text>
          </Paper>
        </Stack>
      </Card>
    </Container>
  );
}
