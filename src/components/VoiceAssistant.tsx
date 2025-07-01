'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  FormControlLabel,
  Switch,
  Collapse,
  Paper,
  IconButton,
  Tooltip,
  Fade,
  Grow,
  Slider,
  Stack,
  ButtonGroup,
} from '@mui/material';
import {
  Mic,
  MicOff,
  VolumeUp,
  VolumeDown,
  VolumeOff,
  Psychology,
  TrendingUp,
  TrendingDown,
  Remove,
  Edit,
  History,
  Bolt,
  PlayArrow,
  Pause,
  Stop,
  Settings,
  KeyboardArrowDown,
  AutoAwesome,
  BarChart,
  Speed,
  Cancel,
} from '@mui/icons-material';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useVoiceOutput } from '@/hooks/useVoiceOutput';
import { AnalysisProgress } from '@/components/AnalysisProgress';

interface AnalysisData {
  success: boolean;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  social_sentiment: 'bullish' | 'bearish' | 'neutral';
  key_metrics: {
    price: string;
    galaxy_score: string;
    alt_rank: string;
    social_dominance: string;
    market_cap: string;
    volume_24h: string;
    mentions: string;
    engagements: string;
    creators: string;
  };
  ai_analysis: string;
  miscellaneous: string;
  symbol: string;
  spokenResponse: string;
  toolsUsed: number;
  dataPoints: number;
  responseTime: number;
}

const QUICK_QUERIES = [
  "What is the sentiment on Bitcoin?",
  "Should I buy Ethereum?",
  "How is Solana trending?",
  "Analyze Cardano for me"
];

const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5×' },
  { value: 0.75, label: '0.75×' },
  { value: 1.0, label: '1×' },
  { value: 1.25, label: '1.25×' },
  { value: 1.5, label: '1.5×' },
  { value: 2.0, label: '2×' },
];

export function VoiceAssistant() {
  // Fix hydration by ensuring consistent initial state
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuery, setEditedQuery] = useState('');
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
  const [showAudioControls, setShowAudioControls] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const lastTranscriptRef = useRef<string>('');

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
    isPaused,
    currentRate,
    currentVolume,
    speak,
    stop: stopSpeaking,
    pause: pauseAudio,
    resume: resumeAudio,
    setRate,
    setVolume,
    error: speechError
  } = useVoiceOutput();

  // Fix hydration error
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-submit after 4 seconds of silence
  useEffect(() => {
    if (transcript && transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript;

      // Clear existing timer
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }

      // Set new timer for auto-submit
      const timer = setTimeout(() => {
        if (transcript.trim() && isListening) {
          console.log('Auto-submitting after silence:', transcript);
          stopListening();
          processQuery(transcript);
        }
      }, 4000);

      setSilenceTimer(timer);
    }

    return () => {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
    };
  }, [transcript, isListening]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!mounted) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Space bar to toggle voice input
      if (event.code === 'Space' && !isEditing && event.target === document.body) {
        event.preventDefault();
        handleVoiceInput();
      }

      // Escape to cancel/stop
      if (event.code === 'Escape') {
        if (isListening) {
          stopListening();
          resetTranscript();
        } else if (isSpeaking) {
          stopSpeaking();
        } else if (isProcessing) {
          handleStopQuery();
        } else if (isEditing) {
          setIsEditing(false);
          setEditedQuery('');
        }
      }

      // Enter to submit (when editing)
      if (event.code === 'Enter' && isEditing) {
        event.preventDefault();
        handleSubmitQuery();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mounted, isListening, isSpeaking, isEditing, editedQuery, isProcessing]);

  // Load query history from localStorage
  useEffect(() => {
    if (!mounted) return;

    try {
      const saved = localStorage.getItem('voiceAssistantHistory');
      if (saved) {
        setQueryHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load query history:', error);
    }
  }, [mounted]);

  // Save query history to localStorage
  const saveQueryHistory = (newHistory: string[]) => {
    try {
      setQueryHistory(newHistory);
      localStorage.setItem('voiceAssistantHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save query history:', error);
    }
  };

  const handleVoiceInput = () => {
    if (!mounted) return;

    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        setEditedQuery(transcript);
        setIsEditing(true);
      }
    } else {
      resetTranscript();
      setIsEditing(false);
      startListening();
    }
  };

  const handleStopQuery = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsProcessing(false);
    console.log('Query stopped by user');
  };

  const processQuery = async (query: string) => {
    if (!query.trim()) return;

    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    setIsProcessing(true);
    setAnalysisData(null);
    resetTranscript();
    setIsEditing(false);

    // Add to history
    const newHistory = [query, ...queryHistory.filter(q => q !== query)].slice(0, 10);
    saveQueryHistory(newHistory);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: controller.signal
      });

      if (controller.signal.aborted) {
        console.log('Request was aborted');
        return;
      }

      const data = await response.json();

      if (data.success) {
        setAnalysisData(data);

        if (autoSpeak && data.spokenResponse) {
          await speak(data.spokenResponse, currentRate, currentVolume);
        }
      } else {
        console.error('Analysis failed:', data.error);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Query was cancelled');
      } else {
        console.error('Error processing query:', error);
      }
    } finally {
      setIsProcessing(false);
      setAbortController(null);
    }
  };

  const handleSubmitQuery = () => {
    const queryToProcess = isEditing ? editedQuery : transcript;
    if (queryToProcess.trim()) {
      processQuery(queryToProcess);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY': return 'success';
      case 'SELL': return 'error';
      case 'HOLD': return 'warning';
      default: return 'default';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp sx={{ color: '#00C896' }} />;
      case 'bearish': return <TrendingDown sx={{ color: '#FF6B6B' }} />;
      default: return <Remove sx={{ color: '#B3B3B3' }} />;
    }
  };

  const getVolumeIcon = () => {
    if (currentVolume === 0) return <VolumeOff />;
    if (currentVolume < 0.5) return <VolumeDown />;
    return <VolumeUp />;
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <Box sx={{ maxWidth: '1200px', mx: 'auto', p: { xs: 2, md: 3 } }}>
        <Card elevation={0} sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
          <Typography variant="h4">Loading Voice Assistant...</Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box id="voice-assistant" sx={{ maxWidth: '1200px', mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Main Control Panel - Much cleaner design */}
      <Card elevation={0} sx={{ mb: 4, p: { xs: 3, md: 5 } }}>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            AI Crypto Analysis
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              maxWidth: 600,
              mx: 'auto',
              fontSize: '1.1rem',
              lineHeight: 1.6
            }}
          >
            Speak naturally or type your question to get instant analysis
          </Typography>
        </Box>

        {/* Voice Input Section - Minimal and clean */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Voice Button - Cleaner design */}
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              {/* <Tooltip title={isListening ? 'Click to stop listening' : 'Click to start voice input'}> */}
                <IconButton
                  onClick={handleVoiceInput}
                  disabled={(!isMicrophoneAvailable && !isListening) || isProcessing}
                  sx={{
                    width: { xs: 80, md: 100 },
                    height: { xs: 80, md: 100 },
                    background: isListening
                      ? '#FF6B6B'
                      : '#00C896',
                    color: isListening ? 'white' : 'black',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      background: isListening
                        ? '#FF5252'
                        : '#00B085',
                    },
                    '&:disabled': {
                      bgcolor: '#404040',
                      color: '#B3B3B3',
                    },
                    transition: 'all 0.2s ease-out',
                  }}
                >
                  {isListening ?
                    <MicOff sx={{ fontSize: { xs: 32, md: 40 } }} /> :
                    <Mic sx={{ fontSize: { xs: 32, md: 40 } }} />
                  }
                </IconButton>
              {/* </Tooltip> */}

              {/* Stop Query Button */}
              {isProcessing && (
                <Tooltip title="Stop analysis">
                  <IconButton
                    onClick={handleStopQuery}
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: '#FF6B6B',
                      color: 'white',
                      '&:hover': {
                        bgcolor: '#FF5252',
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    <Cancel sx={{ fontSize: 28 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              {isProcessing
                ? 'Processing analysis... Click red button to stop'
                : isListening
                ? 'Listening... Auto-submits after 4 seconds of silence'
                : 'Click microphone or press Space to start'
              }
            </Typography>
          </Box>

          {/* Audio Controls - Compact */}
          {(isSpeaking || currentRate !== 1.0 || currentVolume !== 1.0) && (
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => setShowAudioControls(!showAudioControls)}
                startIcon={<Settings />}
                size="small"
                sx={{ mb: 2 }}
              >
                Audio Controls
              </Button>

              <Collapse in={showAudioControls}>
                <Paper elevation={1} sx={{ p: 3, maxWidth: 400, mx: 'auto', bgcolor: '#1A1A1A' }}>
                  {/* Playback Controls */}
                  {isSpeaking && (
                    <Box sx={{ mb: 3 }}>
                      <ButtonGroup variant="outlined" size="small">
                        <Button
                          onClick={pauseAudio}
                          disabled={isPaused || !isSpeaking}
                          startIcon={<Pause />}
                        >
                          Pause
                        </Button>
                        <Button
                          onClick={resumeAudio}
                          disabled={!isPaused || !isSpeaking}
                          startIcon={<PlayArrow />}
                        >
                          Resume
                        </Button>
                        <Button
                          onClick={stopSpeaking}
                          disabled={!isSpeaking}
                          startIcon={<Stop />}
                          color="error"
                        >
                          Stop
                        </Button>
                      </ButtonGroup>
                    </Box>
                  )}

                  {/* Speed Control */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom sx={{ color: 'text.secondary' }}>
                      Speed: {currentRate}×
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {SPEED_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          variant={currentRate === option.value ? 'contained' : 'outlined'}
                          onClick={() => setRate(option.value)}
                          size="small"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </Stack>
                  </Box>

                  {/* Volume Control */}
                  <Box>
                    <Typography variant="body2" gutterBottom sx={{ color: 'text.secondary' }}>
                      Volume: {Math.round(currentVolume * 100)}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <IconButton onClick={() => setVolume(0)} size="small">
                        <VolumeOff />
                      </IconButton>
                      <Slider
                        value={currentVolume}
                        onChange={(_, value) => setVolume(value as number)}
                        min={0}
                        max={1}
                        step={0.1}
                        sx={{ flex: 1 }}
                      />
                      <IconButton onClick={() => setVolume(1)} size="small">
                        <VolumeUp />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              </Collapse>
            </Box>
          )}

          {/* Transcript Display - Cleaner */}
          <Grow in={!!(transcript || isEditing)}>
            <Box>
              {(transcript || isEditing) && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: '#1A1A1A',
                    border: '1px solid #2A2A2A'
                  }}
                >
                  {isEditing ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Edit your query:
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        value={editedQuery}
                        onChange={(e) => setEditedQuery(e.target.value)}
                        placeholder="Type your cryptocurrency question..."
                        variant="outlined"
                      />
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          variant="contained"
                          onClick={handleSubmitQuery}
                          startIcon={<Psychology />}
                          sx={{ flex: 1 }}
                          disabled={!editedQuery.trim()}
                        >
                          Analyze
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setIsEditing(false);
                            setEditedQuery('');
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="body1" sx={{ color: 'text.primary' }}>
                        <Box component="span" sx={{ color: '#00C896', fontWeight: 600 }}>You said:</Box> "{transcript}"
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          variant="contained"
                          onClick={handleSubmitQuery}
                          startIcon={<AutoAwesome />}
                          sx={{ flex: 1 }}
                          disabled={!transcript.trim()}
                        >
                          Analyze
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setEditedQuery(transcript);
                            setIsEditing(true);
                          }}
                          startIcon={<Edit />}
                        >
                          Edit
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Paper>
              )}
            </Box>
          </Grow>

          {/* Quick Query Buttons */}
          <Box>
            <Typography variant="h6" sx={{ textAlign: 'center', mb: 3, color: 'text.primary' }}>
              Popular Questions
            </Typography>
            <Grid container spacing={2}>
              {QUICK_QUERIES.map((query, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => processQuery(query)}
                    disabled={isProcessing}
                    startIcon={<Bolt />}
                    sx={{
                      p: 2,
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      height: 'auto',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                      }
                    }}
                  >
                    {query}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Settings */}
          <Box sx={{ textAlign: 'center', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                  color="primary"
                />
              }
              label="Auto-speak responses"
              sx={{ color: 'text.primary' }}
            />

            {isSpeaking && (
              <Box sx={{ mt: 1 }}>
                <Chip
                  icon={isPaused ? <Pause /> : <PlayArrow />}
                  label={isPaused ? 'Paused' : 'Playing'}
                  color={isPaused ? 'warning' : 'success'}
                  size="small"
                />
              </Box>
            )}
          </Box>
        </Box>
      </Card>

      {/* Progress Indicator */}
      <AnalysisProgress isAnalyzing={isProcessing} />

      {/* Results Display - Clean layout */}
      {analysisData && (
        <Fade in={!!analysisData}>
          <Grid container spacing={3}>
            {/* Main Analysis */}
            <Grid item xs={12} lg={8}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Recommendation Card */}
                <Card elevation={0}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                      <Box>
                        <Typography variant="h4" component="h3" gutterBottom sx={{ color: 'text.primary' }}>
                          {analysisData.symbol}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Analysis Complete • {(analysisData.responseTime / 1000).toFixed(1)}s
                        </Typography>
                      </Box>
                      <Chip
                        label={analysisData.recommendation}
                        color={getRecommendationColor(analysisData.recommendation) as any}
                        sx={{
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          px: 2,
                          py: 1,
                        }}
                      />
                    </Box>

                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'rgba(0, 200, 150, 0.1)', borderRadius: 2 }}>
                          <Typography variant="h3" sx={{ color: '#00C896', fontWeight: 700 }}>
                            {analysisData.confidence}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Confidence
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 3, bgcolor: '#1A1A1A', borderRadius: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                            {getSentimentIcon(analysisData.social_sentiment)}
                            <Typography variant="h6" sx={{ textTransform: 'capitalize', fontWeight: 600, color: 'text.primary' }}>
                              {analysisData.social_sentiment}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Social Sentiment
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                        Analysis Summary
                      </Typography>
                      <Typography variant="body1" sx={{ lineHeight: 1.7, color: 'text.primary' }}>
                        {analysisData.reasoning}
                      </Typography>
                    </Box>

                    <Box sx={{ p: 3, bgcolor: '#1A1A1A', borderRadius: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                        Detailed Analysis
                      </Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7, color: 'text.primary' }}>
                        {analysisData.ai_analysis}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>

                {/* Voice Response Card */}
                <Card elevation={0}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
                        {getVolumeIcon()}
                        Audio Summary
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => speak(analysisData.spokenResponse, currentRate, currentVolume)}
                        disabled={isSpeaking}
                        startIcon={<PlayArrow />}
                        size="small"
                      >
                        Play
                      </Button>
                    </Box>
                    <Typography variant="body1" sx={{ fontStyle: 'italic', lineHeight: 1.6, color: 'text.secondary' }}>
                      "{analysisData.spokenResponse}"
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Grid>

            {/* Metrics Sidebar */}
            <Grid item xs={12} lg={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Key Metrics Card */}
                <Card elevation={0}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, color: 'text.primary' }}>
                      <BarChart color="primary" />
                      Key Metrics
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {Object.entries(analysisData.key_metrics).map(([key, value]) => (
                        <Box key={key} sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 1,
                          borderBottom: '1px solid #2A2A2A',
                          '&:last-child': { borderBottom: 'none' }
                        }}>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize', color: 'text.secondary' }}>
                            {key.replace(/_/g, ' ')}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>

                {/* Performance Stats */}
                <Card elevation={0}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, color: 'text.primary' }}>
                      <Speed color="primary" />
                      Performance
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Tools Used</Typography>
                        <Chip label={analysisData.toolsUsed} size="small" color="primary" />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Data Points</Typography>
                        <Chip label={analysisData.dataPoints} size="small" color="success" />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Response Time</Typography>
                        <Chip
                          label={`${(analysisData.responseTime / 1000).toFixed(1)}s`}
                          size="small"
                          sx={{ bgcolor: '#FFB020', color: '#000' }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Grid>
          </Grid>
        </Fade>
      )}

      {/* Error Display */}
      {(voiceError || speechError) && (
        <Card elevation={0} sx={{ mt: 3, bgcolor: 'rgba(255, 107, 107, 0.1)', border: '1px solid #FF6B6B' }}>
          <CardContent>
            <Typography variant="body2" color="error">
              {voiceError || speechError}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
