'use client';

import { useState, useEffect } from 'react';
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
  ThemeIcon,
  Box,
  Transition,
  Grid,
  Divider,
  SimpleGrid
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
  IconX,
  IconInfoCircle,
  IconRefresh,
  IconArrowUp,
  IconArrowDown
} from '@tabler/icons-react';
import { generateMockAnalysis, mockAnalysisExamples, type MockAnalysisData } from '@/lib/mockData';
import { DebugPanel } from '@/components/DebugPanel';

export function VoiceAssistant() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<MockAnalysisData | null>(null);
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

  // Load sample data on component mount
  useEffect(() => {
    // Show a sample analysis after 2 seconds
    const timer = setTimeout(() => {
      const sampleAnalysis = mockAnalysisExamples[0];
      setAnalysisData(sampleAnalysis);
      setLastProcessedQuery('What is the sentiment on Bitcoin?');
      setLastResponse(sampleAnalysis.spokenResponse);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock analysis
      const mockAnalysis = generateMockAnalysis(query);

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
    setAnalysisData(null);
  };

  const handleLoadSample = () => {
    const randomSample = mockAnalysisExamples[Math.floor(Math.random() * mockAnalysisExamples.length)];
    setAnalysisData(randomSample);
    setLastProcessedQuery(randomSample.symbol === 'BTC' ? 'What is the sentiment on Bitcoin?' : 
                        randomSample.symbol === 'ETH' ? 'Should I buy Ethereum?' :
                        randomSample.symbol === 'SOL' ? 'How is Solana trending?' :
                        randomSample.symbol === 'DOGE' ? 'Tell me about Dogecoin sentiment' :
                        'What about Cardano?');
    setLastResponse(randomSample.spokenResponse);
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY': return 'green';
      case 'SELL': return 'red';
      default: return 'yellow';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'green';
      case 'bearish': return 'red';
      default: return 'blue';
    }
  };

  const getPriceChangeColor = (change: string) => {
    if (change.startsWith('-')) return 'red';
    if (change.startsWith('+') || parseFloat(change) > 0) return 'green';
    return 'gray';
  };

  const getPriceChangeIcon = (change: string) => {
    if (change.startsWith('-')) return IconArrowDown;
    if (change.startsWith('+') || parseFloat(change) > 0) return IconArrowUp;
    return IconMinus;
  };

  return (
    <Box style={{ 
      background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <Container size="xl" py="xl">
        <Stack gap="xl">
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <Title 
              order={1} 
              c="white"
              mb="xs"
              style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #34d399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Voice Crypto Assistant
            </Title>
            <Text c="gray.4" size="lg">
              Real-time crypto analysis powered by voice commands
            </Text>
            
            {/* Sample Data Notice */}
            <Paper bg="blue.9" p="sm" radius="md" mt="md" maw={600} mx="auto">
              <Group justify="center" gap="sm">
                <Text size="sm" c="blue.3">
                  📊 Using mock data for UI demonstration
                </Text>
                <Button
                  onClick={handleLoadSample}
                  variant="subtle"
                  color="blue"
                  size="xs"
                  leftSection={<IconRefresh size={14} />}
                >
                  Load Sample
                </Button>
              </Group>
            </Paper>
          </div>

          {/* Voice Input Section */}
          <Card bg="gray.8" radius="md" p="xl" style={{ border: '1px solid #374151' }}>
            <div style={{ textAlign: 'center' }}>
              <Button
                onClick={handleVoiceInput}
                disabled={!isMicrophoneAvailable || isProcessing}
                size="xl"
                radius="xl"
                h={80}
                w={280}
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
                style={{
                  boxShadow: isListening ? '0 0 30px rgba(239, 68, 68, 0.5)' : '0 0 20px rgba(59, 130, 246, 0.3)'
                }}
              >
                {isListening ? 'Stop Listening' : 'Ask About Any Crypto'}
              </Button>

              <Text size="sm" c="gray.5" mt="md">
                Try: "What's the sentiment on Bitcoin?" or "Should I buy Ethereum?"
              </Text>
            </div>
          </Card>

          {/* Current Transcript Display */}
          <Transition mounted={isListening && !!transcript} transition="slide-up" duration={200}>
            {(styles) => (
              <Card 
                bg="blue.9" 
                radius="md" 
                p="lg" 
                style={{ 
                  ...styles,
                  border: '2px solid #3b82f6'
                }}
              >
                <Group gap="sm" mb="xs">
                  <ThemeIcon color="blue" variant="light" size="sm">
                    <IconEar size={16} />
                  </ThemeIcon>
                  <Text size="sm" fw={600} c="blue.3">
                    Listening...
                  </Text>
                  <Badge color="blue" variant="light" size="xs">LIVE</Badge>
                </Group>
                <Text size="lg" c="white" fw={500} style={{ fontStyle: 'italic' }}>
                  "{transcript}"
                </Text>
              </Card>
            )}
          </Transition>

          {/* Processing Status */}
          {isProcessing && (
            <Card bg="gray.8" radius="md" p="lg" style={{ border: '1px solid #374151' }}>
              <Group justify="center" gap="sm">
                <Loader size="sm" color="orange" />
                <Text size="sm" c="white">Analyzing with LunarCrush MCP & Google Gemini AI...</Text>
              </Group>
            </Card>
          )}

          {/* Analysis Results */}
          {analysisData && (
            <Grid>
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Card bg="gray.8" radius="md" p="xl" style={{ border: '1px solid #374151' }}>
                  <Stack gap="lg">
                    {/* Header with Symbol and Recommendation */}
                    <Group justify="space-between" align="center">
                      <Group gap="md">
                        <Title order={2} c="white">{analysisData.symbol}</Title>
                        <Text size="sm" c="gray.4">
                          {new Date().toLocaleDateString('en-US', { 
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Text>
                      </Group>
                      <Group gap="sm">
                        <Badge 
                          color={getRecommendationColor(analysisData.recommendation)}
                          size="xl"
                          fw={700}
                        >
                          {analysisData.recommendation}
                        </Badge>
                        <Text size="sm" c="gray.4">{analysisData.confidence}% Confidence</Text>
                      </Group>
                    </Group>

                    {/* Analysis Reasoning */}
                    <Box>
                      <Text size="lg" fw={600} c="white" mb="md">Analysis Reasoning</Text>
                      <Text size="md" c="gray.3" lh="1.6">
                        {analysisData.reasoning}
                      </Text>
                    </Box>

                    {/* Social Sentiment */}
                    <Group gap="md">
                      <Text size="sm" fw={500} c="white">Social Sentiment:</Text>
                      <Badge 
                        color={getSentimentColor(analysisData.sentiment)}
                        variant="filled"
                        size="md"
                        tt="uppercase"
                        fw={700}
                      >
                        {analysisData.sentiment}
                      </Badge>
                    </Group>

                    {/* Voice Query Display */}
                    {lastProcessedQuery && (
                      <Paper bg="green.9" p="md" radius="md" style={{ border: '1px solid #16a34a' }}>
                        <Group justify="space-between" align="flex-start">
                          <Box style={{ flex: 1 }}>
                            <Group gap="sm" mb="xs">
                              <ThemeIcon color="green" variant="light" size="sm">
                                <IconMessageCircle size={16} />
                              </ThemeIcon>
                              <Text size="sm" fw={600} c="green.3">
                                Your Query:
                              </Text>
                              <Badge color="green" variant="light" size="xs" leftSection={<IconCheck size={10} />}>
                                PROCESSED
                              </Badge>
                            </Group>
                            <Text size="md" c="green.1" fw={500}>
                              "{lastProcessedQuery}"
                            </Text>
                          </Box>
                        </Group>
                      </Paper>
                    )}
                  </Stack>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <Card bg="gray.8" radius="md" p="xl" style={{ border: '1px solid #374151' }}>
                  <Stack gap="lg">
                    <Title order={3} c="white" size="h4">Market Metrics</Title>
                    
                    <Stack gap="md">
                      {/* Price with main 24h change indicator */}
                      <Box>
                        <Text size="sm" c="gray.4" mb="xs">Price</Text>
                        <Group gap="xs" align="baseline">
                          <Text size="xl" fw={700} c="white">{analysisData.marketMetrics.price}</Text>
                          <Group gap={4}>
                            {(() => {
                              const Icon = getPriceChangeIcon(analysisData.marketMetrics.priceChange24h);
                              return <Icon size={14} color={getPriceChangeColor(analysisData.marketMetrics.priceChange24h)} />;
                            })()}
                            <Text 
                              size="sm" 
                              fw={600} 
                              c={getPriceChangeColor(analysisData.marketMetrics.priceChange24h)}
                            >
                              {analysisData.marketMetrics.priceChange24h}
                            </Text>
                          </Group>
                        </Group>
                        <Text size="xs" c="gray.5">24h change</Text>
                      </Box>

                      {/* Price Changes Grid - All timeframes including 24h */}
                      <Box>
                        <Text size="sm" c="gray.4" mb="xs">Price Changes</Text>
                        <SimpleGrid cols={2} spacing="xs">
                          <Group gap="xs">
                            <Text size="xs" c="gray.5">1h:</Text>
                            <Text 
                              size="xs" 
                              fw={600} 
                              c={getPriceChangeColor(analysisData.marketMetrics.priceChange1h)}
                            >
                              {analysisData.marketMetrics.priceChange1h}
                            </Text>
                          </Group>
                          <Group gap="xs">
                            <Text size="xs" c="gray.5">24h:</Text>
                            <Text 
                              size="xs" 
                              fw={600} 
                              c={getPriceChangeColor(analysisData.marketMetrics.priceChange24h)}
                            >
                              {analysisData.marketMetrics.priceChange24h}
                            </Text>
                          </Group>
                          <Group gap="xs">
                            <Text size="xs" c="gray.5">7d:</Text>
                            <Text 
                              size="xs" 
                              fw={600} 
                              c={getPriceChangeColor(analysisData.marketMetrics.priceChange7d)}
                            >
                              {analysisData.marketMetrics.priceChange7d}
                            </Text>
                          </Group>
                          <Group gap="xs">
                            <Text size="xs" c="gray.5">30d:</Text>
                            <Text 
                              size="xs" 
                              fw={600} 
                              c={getPriceChangeColor(analysisData.marketMetrics.priceChange30d)}
                            >
                              {analysisData.marketMetrics.priceChange30d}
                            </Text>
                          </Group>
                        </SimpleGrid>
                      </Box>
                      
                      <Group justify="space-between">
                        <Text size="sm" c="gray.4">Galaxy Score</Text>
                        <Text size="sm" fw={600} c="white">{analysisData.marketMetrics.galaxyScore}</Text>
                      </Group>
                      
                      <Group justify="space-between">
                        <Text size="sm" c="gray.4">Alt Rank</Text>
                        <Text size="sm" fw={600} c="white">{analysisData.marketMetrics.altRank}</Text>
                      </Group>
                      
                      <Group justify="space-between">
                        <Text size="sm" c="gray.4">Social Dominance</Text>
                        <Text size="sm" fw={600} c="white">{analysisData.marketMetrics.socialDominance}</Text>
                      </Group>

                      <Group justify="space-between">
                        <Text size="sm" c="gray.4">Market Dominance</Text>
                        <Text size="sm" fw={600} c="white">{analysisData.marketMetrics.marketDominance}</Text>
                      </Group>
                      
                      <Group justify="space-between">
                        <Text size="sm" c="gray.4">Market Cap</Text>
                        <Text size="sm" fw={600} c="white">{analysisData.marketMetrics.marketCap}</Text>
                      </Group>

                      <Group justify="space-between">
                        <Text size="sm" c="gray.4">Circulating Supply</Text>
                        <Text size="sm" fw={600} c="white">{analysisData.marketMetrics.circulatingSupply}</Text>
                      </Group>
                      
                      <Group justify="space-between">
                        <Text size="sm" c="gray.4">Volume 24h</Text>
                        <Text size="sm" fw={600} c="white">{analysisData.marketMetrics.volume24h}</Text>
                      </Group>
                      
                      <Group justify="space-between">
                        <Text size="sm" c="gray.4">Mentions</Text>
                        <Text size="sm" fw={600} c="white">{analysisData.marketMetrics.mentions}</Text>
                      </Group>
                      
                      <Group justify="space-between">
                        <Text size="sm" c="gray.4">Engagements</Text>
                        <Text size="sm" fw={600} c="white">{analysisData.marketMetrics.engagements}</Text>
                      </Group>
                      
                      <Group justify="space-between">
                        <Text size="sm" c="gray.4">Creators</Text>
                        <Text size="sm" fw={600} c="white">{analysisData.marketMetrics.creators}</Text>
                      </Group>

                      <Group justify="space-between">
                        <Text size="sm" c="gray.4">Sentiment Score</Text>
                        <Text size="sm" fw={600} c="white">{analysisData.marketMetrics.sentiment}%</Text>
                      </Group>
                    </Stack>

                    <Divider color="gray.6" />

                    <Box>
                      <Text size="sm" fw={600} c="white" mb="xs">Data Sources</Text>
                      <Stack gap="xs">
                        <Group gap="xs">
                          <Box w={8} h={8} bg="green.5" style={{ borderRadius: '50%' }} />
                          <Text size="xs" c="gray.4">LunarCrush MCP</Text>
                        </Group>
                        <Group gap="xs">
                          <Box w={8} h={8} bg="blue.5" style={{ borderRadius: '50%' }} />
                          <Text size="xs" c="gray.4">Google Gemini AI</Text>
                        </Group>
                        <Group gap="xs">
                          <Box w={8} h={8} bg="orange.5" style={{ borderRadius: '50%' }} />
                          <Text size="xs" c="gray.4">Real-time Analysis</Text>
                        </Group>
                      </Stack>
                    </Box>

                    <Paper bg="yellow.9" p="md" radius="md">
                      <Group gap="xs" mb="xs">
                        <IconInfoCircle size={16} color="#fbbf24" />
                        <Text size="xs" fw={600} c="yellow.4">Disclaimer</Text>
                      </Group>
                      <Text size="xs" c="yellow.3">
                        This analysis is for informational purposes only and should not be considered financial advice. Always do your own research before making investment decisions.
                      </Text>
                    </Paper>

                    <Button
                      onClick={handleClearQuery}
                      variant="subtle"
                      color="gray"
                      size="sm"
                      leftSection={<IconX size={16} />}
                      fullWidth
                    >
                      Clear Analysis
                    </Button>
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>
          )}

          {/* Voice Output Display */}
          {(isSpeaking || lastResponse) && !analysisData && (
            <Card bg="orange.9" radius="md" p="lg" style={{ border: '2px solid #ea580c' }}>
              <Group justify="space-between" align="center" mb="md">
                <Text fw={600} c="white">AI Response:</Text>
                {isSpeaking && (
                  <Button 
                    onClick={stopSpeaking} 
                    variant="outline" 
                    size="xs"
                    color="orange"
                    leftSection={<IconVolumeOff size={16} />}
                  >
                    Stop
                  </Button>
                )}
              </Group>
              
              <Text size="sm" c="orange.1">{lastResponse}</Text>
              {isSpeaking && (
                <Group mt="xs" gap="xs">
                  <IconVolume size={16} color="orange" className="voice-speaking" />
                  <Text size="xs" c="orange.3">Speaking...</Text>
                </Group>
              )}
            </Card>
          )}

          {/* Error Display */}
          {(voiceError || speechError) && (
            <Alert color="red" variant="light">
              <Text size="sm">
                {voiceError || speechError}
              </Text>
            </Alert>
          )}
        </Stack>
      </Container>

      {/* Debug Panel */}
      {analysisData && (
        <DebugPanel 
          data={analysisData} 
          query={lastProcessedQuery || 'Sample query'} 
        />
      )}
    </Box>
  );
}
