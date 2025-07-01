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
  SimpleGrid,
  Progress,
  Tooltip,
  ActionIcon,
  Modal
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
  IconArrowDown,
  IconHelp,
  IconPlayerPlayFilled,
  IconSparkles,
  IconRocket
} from '@tabler/icons-react';
import { generateMockAnalysis, mockAnalysisExamples, type MockAnalysisData } from '@/lib/mockData';
import { DebugPanel } from '@/components/DebugPanel';

export function VoiceAssistant() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<MockAnalysisData | null>(null);
  const [lastProcessedQuery, setLastProcessedQuery] = useState<string>('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

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

  // Show onboarding for first-time users
  useEffect(() => {
    const hasVisited = localStorage.getItem('voice-crypto-visited');
    if (!hasVisited) {
      setShowOnboarding(true);
      localStorage.setItem('voice-crypto-visited', 'true');
    }

    // Load sample data after onboarding or immediately for returning users
    const timer = setTimeout(() => {
      if (!hasVisited) return; // Wait for onboarding to complete
      const sampleAnalysis = mockAnalysisExamples[0];
      setAnalysisData(sampleAnalysis);
      setLastProcessedQuery('What is the sentiment on Bitcoin?');
      setLastResponse(sampleAnalysis.spokenResponse);
    }, hasVisited ? 1000 : 5000);

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
    setProcessingStep(0);

    try {
      // Step 1: Voice Processing
      setProcessingStep(25);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: LunarCrush Data
      setProcessingStep(50);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: AI Analysis
      setProcessingStep(75);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Complete
      setProcessingStep(100);
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
      setProcessingStep(0);
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
      background: 'radial-gradient(ellipse at top, #1e3a8a 0%, #1e293b 50%, #0f172a 100%)',
      minHeight: '100vh',
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <Box style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)',
        zIndex: 0
      }} />

      {/* Onboarding Modal */}
      <Modal
        opened={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        title="Welcome to Voice Crypto Assistant"
        size="lg"
        centered
        styles={{
          content: { background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' },
          header: { background: 'transparent', color: 'white' },
          title: { fontSize: '1.5rem', fontWeight: 700 }
        }}
      >
        <Stack gap="lg" c="white">
          <Text size="lg" lh="1.6">
            🎤 <strong>Speak your crypto questions naturally</strong> - Just click the microphone and ask about any cryptocurrency
          </Text>
          <Text size="lg" lh="1.6">
            🧠 <strong>AI-powered analysis</strong> - Get real-time sentiment analysis powered by Google Gemini AI and LunarCrush social data
          </Text>
          <Text size="lg" lh="1.6">
            🔊 <strong>Voice responses</strong> - Listen to detailed analysis spoken back to you with professional voice synthesis
          </Text>
          <Box bg="blue.9" p="md" radius="md">
            <Text size="sm" fw={600} mb="xs">Try these example questions:</Text>
            <Stack gap="xs">
              <Text size="sm">"What's the sentiment on Bitcoin?"</Text>
              <Text size="sm">"Should I buy Ethereum?"</Text>
              <Text size="sm">"How is Solana trending?"</Text>
            </Stack>
          </Box>
          <Button
            onClick={() => setShowOnboarding(false)}
            size="lg"
            leftSection={<IconRocket size={20} />}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
              border: 'none'
            }}
          >
            Get Started
          </Button>
        </Stack>
      </Modal>

      <Container size="xl" py="xl" style={{ position: 'relative', zIndex: 1 }}>
        <Stack gap="xl">
          {/* Hero Section */}
          <div style={{ textAlign: 'center' }}>
            <Group justify="center" mb="lg">
              <ThemeIcon size={60} radius="xl" style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
                border: '2px solid rgba(255,255,255,0.1)'
              }}>
                <IconMicrophone size={30} />
              </ThemeIcon>
            </Group>

            <Title
              order={1}
              size="3.5rem"
              c="white"
              mb="md"
              style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #34d399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
              }}
            >
              Voice Crypto Assistant
            </Title>

            <Text c="gray.3" size="xl" maw={700} mx="auto" lh="1.6" mb="lg">
              Ask questions about any cryptocurrency using your voice. Get AI-powered analysis with real-time social sentiment data.
            </Text>

            <Group justify="center" gap="md">
              <Badge size="lg" variant="light" color="blue" leftSection={<IconSparkles size={16} />}>
                AI Powered
              </Badge>
              <Badge size="lg" variant="light" color="green" leftSection={<IconBrain size={16} />}>
                Real-time Data
              </Badge>
              <Badge size="lg" variant="light" color="orange" leftSection={<IconMicrophone size={16} />}>
                Voice Interface
              </Badge>
            </Group>
          </div>

          {/* Voice Input Section */}
          <Card
            bg="rgba(255, 255, 255, 0.05)"
            radius="xl"
            p="xl"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <Stack align="center" gap="lg">
              <Group>
                <Tooltip label="How to use this assistant">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="lg"
                    onClick={() => setShowOnboarding(true)}
                  >
                    <IconHelp size={20} />
                  </ActionIcon>
                </Tooltip>

                <Button
                  onClick={handleVoiceInput}
                  disabled={!isMicrophoneAvailable || isProcessing}
                  size="xl"
                  radius="xl"
                  h={100}
                  w={300}
                  color={isListening ? 'red' : 'blue'}
                  variant="filled"
                  leftSection={
                    isListening ? (
                      <IconMicrophoneOff size={28} />
                    ) : (
                      <IconMicrophone size={28} />
                    )
                  }
                  className={isListening ? 'voice-listening' : ''}
                  style={{
                    background: isListening
                      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                      : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    boxShadow: isListening
                      ? '0 0 40px rgba(239, 68, 68, 0.6)'
                      : '0 0 30px rgba(59, 130, 246, 0.4)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    fontSize: '1.1rem',
                    fontWeight: 600
                  }}
                >
                  {isListening ? 'Stop Listening' : 'Ask About Any Crypto'}
                </Button>

                <Tooltip label="Try a sample analysis">
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    size="lg"
                    onClick={handleLoadSample}
                  >
                    <IconPlayerPlayFilled size={20} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              {!analysisData && (
                <Stack align="center" gap="xs">
                  <Text size="md" c="gray.4" ta="center">
                    Click the microphone and try:
                  </Text>
                  <Group gap="md">
                    <Button
                      variant="subtle"
                      size="sm"
                      color="gray"
                      onClick={() => processQuery("What's the sentiment on Bitcoin?")}
                    >
                      "Bitcoin sentiment?"
                    </Button>
                    <Button
                      variant="subtle"
                      size="sm"
                      color="gray"
                      onClick={() => processQuery("Should I buy Ethereum?")}
                    >
                      "Buy Ethereum?"
                    </Button>
                    <Button
                      variant="subtle"
                      size="sm"
                      color="gray"
                      onClick={() => processQuery("How is Solana trending?")}
                    >
                      "Solana trends?"
                    </Button>
                  </Group>
                </Stack>
              )}
            </Stack>
          </Card>

          {/* Current Transcript Display */}
          <Transition mounted={isListening && !!transcript} transition="slide-up" duration={300}>
            {(styles) => (
              <Card
                bg="rgba(59, 130, 246, 0.15)"
                radius="xl"
                p="lg"
                style={{
                  ...styles,
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2)'
                }}
              >
                <Group gap="sm" mb="md">
                  <ThemeIcon color="blue" variant="light" size="md" radius="xl">
                    <IconEar size={18} />
                  </ThemeIcon>
                  <Text size="lg" fw={600} c="blue.3">
                    Listening...
                  </Text>
                  <Badge color="blue" variant="light" size="md">LIVE</Badge>
                </Group>
                <Text size="xl" c="white" fw={500} ta="center" style={{ fontStyle: 'italic' }}>
                  "{transcript}"
                </Text>
              </Card>
            )}
          </Transition>

          {/* Processing Status */}
          {isProcessing && (
            <Card
              bg="rgba(249, 115, 22, 0.15)"
              radius="xl"
              p="lg"
              style={{
                border: '1px solid rgba(249, 115, 22, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Stack align="center" gap="md">
                <Group gap="sm">
                  <Loader size="md" color="orange" />
                  <Text size="lg" c="white" fw={500}>
                    {processingStep < 25 ? 'Processing voice input...' :
                     processingStep < 50 ? 'Fetching LunarCrush data...' :
                     processingStep < 75 ? 'Analyzing with Google Gemini AI...' :
                     'Generating response...'}
                  </Text>
                </Group>
                <Progress
                  value={processingStep}
                  size="lg"
                  radius="xl"
                  style={{ width: '100%', maxWidth: '400px' }}
                  color="orange"
                />
              </Stack>
            </Card>
          )}

          {/* Analysis Results */}
          {analysisData && (
            <Grid>
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Card
                  bg="rgba(255, 255, 255, 0.05)"
                  radius="xl"
                  p="xl"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <Stack gap="xl">
                    {/* Header with Symbol and Recommendation */}
                    <Group justify="space-between" align="center">
                      <Group gap="lg">
                        <ThemeIcon size={50} radius="xl" style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)'
                        }}>
                          <Text size="lg" fw={700} c="white">{analysisData.symbol}</Text>
                        </ThemeIcon>
                        <div>
                          <Title order={2} c="white" size="2rem">{analysisData.symbol}</Title>
                          <Text size="sm" c="gray.4">
                            {new Date().toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Text>
                        </div>
                      </Group>
                      <Group gap="md">
                        <Badge
                          size="xl"
                          fw={700}
                          p="md"
                          style={{
                            background: getRecommendationColor(analysisData.recommendation) === 'green'
                              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                              : getRecommendationColor(analysisData.recommendation) === 'red'
                              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                              : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: 'white',
                            fontSize: '1rem'
                          }}
                        >
                          {analysisData.recommendation}
                        </Badge>
                        <div style={{ textAlign: 'right' }}>
                          <Text size="lg" fw={600} c="white">{analysisData.confidence}%</Text>
                          <Text size="xs" c="gray.4">Confidence</Text>
                        </div>
                      </Group>
                    </Group>

                    {/* Analysis Reasoning */}
                    <Box>
                      <Group mb="md">
                        <IconBrain size={24} color="#60a5fa" />
                        <Text size="xl" fw={600} c="white">Analysis Reasoning</Text>
                      </Group>
                      <Text size="lg" c="gray.2" lh="1.7" style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        {analysisData.reasoning}
                      </Text>
                    </Box>

                    {/* Social Sentiment */}
                    <Group gap="lg">
                      <Text size="lg" fw={600} c="white">Social Sentiment:</Text>
                      <Badge
                        size="xl"
                        fw={700}
                        p="md"
                        tt="uppercase"
                        style={{
                          background: getSentimentColor(analysisData.sentiment) === 'green'
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : getSentimentColor(analysisData.sentiment) === 'red'
                            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white',
                          fontSize: '0.9rem'
                        }}
                      >
                        {analysisData.sentiment}
                      </Badge>
                    </Group>

                    {/* Voice Query Display */}
                    {lastProcessedQuery && (
                      <Paper
                        bg="rgba(16, 185, 129, 0.15)"
                        p="lg"
                        radius="xl"
                        style={{
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        <Group gap="sm" mb="md">
                          <ThemeIcon color="green" variant="light" size="md" radius="xl">
                            <IconMessageCircle size={18} />
                          </ThemeIcon>
                          <Text size="md" fw={600} c="green.3">
                            Your Query:
                          </Text>
                          <Badge color="green" variant="light" size="sm" leftSection={<IconCheck size={12} />}>
                            PROCESSED
                          </Badge>
                        </Group>
                        <Text size="lg" c="green.1" fw={500}>
                          "{lastProcessedQuery}"
                        </Text>
                      </Paper>
                    )}
                  </Stack>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <Card
                  bg="rgba(255, 255, 255, 0.05)"
                  radius="xl"
                  p="xl"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <Stack gap="lg">
                    <Group>
                      <IconTrendingUp size={24} color="#10b981" />
                      <Title order={3} c="white" size="1.5rem">Market Metrics</Title>
                    </Group>

                    <Stack gap="lg">
                      {/* Price with 24h change */}
                      <Box style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <Text size="sm" c="gray.4" mb="xs">Price</Text>
                        <Group gap="sm" align="baseline">
                          <Text size="2rem" fw={700} c="white">{analysisData.marketMetrics.price}</Text>
                          <Group gap={4}>
                            {(() => {
                              const Icon = getPriceChangeIcon(analysisData.marketMetrics.priceChange24h);
                              return <Icon size={16} color={getPriceChangeColor(analysisData.marketMetrics.priceChange24h)} />;
                            })()}
                            <Text
                              size="md"
                              fw={600}
                              c={getPriceChangeColor(analysisData.marketMetrics.priceChange24h)}
                            >
                              {analysisData.marketMetrics.priceChange24h}
                            </Text>
                          </Group>
                        </Group>
                        <Text size="xs" c="gray.5">24h change</Text>
                      </Box>

                      {/* Price Changes Grid */}
                      <Box>
                        <Text size="md" c="gray.3" mb="md" fw={500}>Price Changes</Text>
                        <SimpleGrid cols={2} spacing="md">
                          {[
                            { label: '1h', value: analysisData.marketMetrics.priceChange1h },
                            { label: '24h', value: analysisData.marketMetrics.priceChange24h },
                            { label: '7d', value: analysisData.marketMetrics.priceChange7d },
                            { label: '30d', value: analysisData.marketMetrics.priceChange30d }
                          ].map(({ label, value }) => (
                            <Box key={label} style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              padding: '0.75rem',
                              borderRadius: '8px',
                              textAlign: 'center'
                            }}>
                              <Text size="xs" c="gray.5" mb={4}>{label}</Text>
                              <Text
                                size="sm"
                                fw={600}
                                c={getPriceChangeColor(value)}
                              >
                                {value}
                              </Text>
                            </Box>
                          ))}
                        </SimpleGrid>
                      </Box>

                      {/* Other Metrics */}
                      <Stack gap="md">
                        {[
                          { label: 'Galaxy Score', value: analysisData.marketMetrics.galaxyScore },
                          { label: 'Alt Rank', value: analysisData.marketMetrics.altRank },
                          { label: 'Social Dominance', value: analysisData.marketMetrics.socialDominance },
                          { label: 'Market Dominance', value: analysisData.marketMetrics.marketDominance },
                          { label: 'Market Cap', value: analysisData.marketMetrics.marketCap },
                          { label: 'Circulating Supply', value: analysisData.marketMetrics.circulatingSupply },
                          { label: 'Volume 24h', value: analysisData.marketMetrics.volume24h },
                          { label: 'Mentions', value: analysisData.marketMetrics.mentions },
                          { label: 'Engagements', value: analysisData.marketMetrics.engagements },
                          { label: 'Creators', value: analysisData.marketMetrics.creators },
                          { label: 'Sentiment Score', value: `${analysisData.marketMetrics.sentiment}%` }
                        ].map(({ label, value }) => (
                          <Group key={label} justify="space-between" style={{
                            padding: '0.5rem 0',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                          }}>
                            <Text size="sm" c="gray.4">{label}</Text>
                            <Text size="sm" fw={600} c="white">{value}</Text>
                          </Group>
                        ))}
                      </Stack>
                    </Stack>

                    <Divider color="rgba(255, 255, 255, 0.1)" />

                    <Box>
                      <Text size="sm" fw={600} c="white" mb="md">Data Sources</Text>
                      <Stack gap="sm">
                        {[
                          { name: 'LunarCrush MCP', color: 'green.5' },
                          { name: 'Google Gemini AI', color: 'blue.5' },
                          { name: 'Real-time Analysis', color: 'orange.5' }
                        ].map(({ name, color }) => (
                          <Group key={name} gap="xs">
                            <Box w={10} h={10} bg={color} style={{ borderRadius: '50%' }} />
                            <Text size="xs" c="gray.4">{name}</Text>
                          </Group>
                        ))}
                      </Stack>
                    </Box>

                    <Paper
                      bg="rgba(251, 191, 36, 0.15)"
                      p="md"
                      radius="md"
                      style={{ border: '1px solid rgba(251, 191, 36, 0.3)' }}
                    >
                      <Group gap="xs" mb="xs">
                        <IconInfoCircle size={16} color="#fbbf24" />
                        <Text size="xs" fw={600} c="yellow.4">Disclaimer</Text>
                      </Group>
                      <Text size="xs" c="yellow.3" lh="1.4">
                        This analysis is for informational purposes only and should not be considered financial advice. Always do your own research before making investment decisions.
                      </Text>
                    </Paper>

                    <Button
                      onClick={handleClearQuery}
                      variant="subtle"
                      color="gray"
                      size="md"
                      leftSection={<IconX size={16} />}
                      fullWidth
                      radius="xl"
                    >
                      Clear Analysis
                    </Button>
                  </Stack>
                </Card>
              </Grid.Col>
            </Grid>
          )}

          {/* Error Display */}
          {(voiceError || speechError) && (
            <Alert
              color="red"
              variant="light"
              radius="xl"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
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
