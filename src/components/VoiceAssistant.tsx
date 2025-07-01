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
  ThemeIcon,
  Box,
  Transition
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
  IconMinus,
  IconEar,
  IconMessageCircle,
  IconCheck,
  IconX
} from '@tabler/icons-react';

export function VoiceAssistant() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [lastProcessedQuery, setLastProcessedQuery] = useState<string>('');

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
        setLastProcessedQuery(transcript.trim());
        await processQuery(transcript);
      }
    } else {
      resetTranscript();
      setLastProcessedQuery('');
      startListening();
    }
  };

  const processQuery = async (query: string) => {
    setIsProcessing(true);
    
    try {
      // Extract crypto symbol from query (simple regex)
      const cryptoMatch = query.match(/\b(bitcoin|btc|ethereum|eth|solana|sol|cardano|ada|polkadot|dot|dogecoin|doge)\b/i);
      const symbol = cryptoMatch ? cryptoMatch[1] : 'bitcoin';

      // Mock analysis for now - replace with your actual API call
      const mockAnalysis = {
        summary: `Analysis complete for "${query}"`,
        insights: [
          `Strong social sentiment detected for ${symbol.toUpperCase()}`,
          'Trading volume above average in last 24h',
          'Positive trend indicators from social media mentions'
        ],
        recommendations: [
          'Monitor for continued momentum',
          'Consider position sizing based on social signals'
        ],
        sentiment: Math.random() > 0.5 ? 'bullish' : Math.random() > 0.3 ? 'bearish' : 'neutral',
        confidence: Math.floor(Math.random() * 30) + 70,
        spokenResponse: `Based on current social sentiment data for ${symbol}, I'm seeing ${Math.random() > 0.5 ? 'strong bullish' : 'mixed'} signals. The confidence level is ${Math.floor(Math.random() * 30) + 70}%, with trading volume above average and ${Math.random() > 0.5 ? 'positive' : 'neutral'} trend indicators from social media analysis.`
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

  const handleClearQuery = () => {
    resetTranscript();
    setLastProcessedQuery('');
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
          </div>

          {/* Current Transcript Display */}
          <Transition mounted={isListening && !!transcript} transition="slide-up" duration={200}>
            {(styles) => (
              <Paper 
                p="lg" 
                bg="blue.0" 
                radius="md" 
                style={{ 
                  ...styles,
                  border: '2px solid var(--mantine-color-blue-2)'
                }}
              >
                <Group gap="sm" mb="xs">
                  <ThemeIcon color="blue" variant="light" size="sm">
                    <IconEar size={16} />
                  </ThemeIcon>
                  <Text size="sm" fw={600} c="blue.8">
                    Listening... I heard:
                  </Text>
                  <Badge color="blue" variant="light" size="xs">LIVE</Badge>
                </Group>
                <Text size="md" c="blue.9" fw={500} style={{ fontStyle: 'italic' }}>
                  "{transcript}"
                </Text>
              </Paper>
            )}
          </Transition>

          {/* Recorded Query Display */}
          <Transition mounted={!!lastProcessedQuery && !isListening} transition="slide-up" duration={300}>
            {(styles) => (
              <Paper 
                p="lg" 
                bg="green.0" 
                radius="md" 
                style={{ 
                  ...styles,
                  border: '2px solid var(--mantine-color-green-2)'
                }}
              >
                <Group justify="space-between" align="flex-start">
                  <Box style={{ flex: 1 }}>
                    <Group gap="sm" mb="xs">
                      <ThemeIcon color="green" variant="light" size="sm">
                        <IconMessageCircle size={16} />
                      </ThemeIcon>
                      <Text size="sm" fw={600} c="green.8">
                        Your Query Recorded:
                      </Text>
                      <Badge color="green" variant="light" size="xs" leftSection={<IconCheck size={10} />}>
                        CAPTURED
                      </Badge>
                    </Group>
                    <Text size="lg" c="green.9" fw={600}>
                      "{lastProcessedQuery}"
                    </Text>
                  </Box>
                  <Button
                    onClick={handleClearQuery}
                    variant="subtle"
                    color="gray"
                    size="xs"
                    leftSection={<IconX size={12} />}
                  >
                    Clear
                  </Button>
                </Group>
              </Paper>
            )}
          </Transition>

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
              
              <Paper p="md" bg="orange.0" radius="md">
                <Text size="sm">{lastResponse}</Text>
                {isSpeaking && (
                  <Group mt="xs" gap="xs">
                    <IconVolume size={16} color="orange" className="voice-speaking" />
                    <Text size="xs" c="orange">Speaking...</Text>
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
