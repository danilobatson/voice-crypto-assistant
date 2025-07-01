'use client';

import { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface StructuredAPIResponse {
  success: boolean;
  recommendation: "BUY" | "SELL" | "HOLD";
  confidence: number;
  reasoning: string;
  social_sentiment: "bullish" | "bearish" | "neutral";
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
  crypto_detection?: any;
  responseTime?: number;
  timestamp?: string;
}

export function VoiceAPITest() {
  const [response, setResponse] = useState<StructuredAPIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Voice output controls
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [speechRate, setSpeechRate] = useState(1.3);
  const [showVolumeWarning, setShowVolumeWarning] = useState(false);
  const [hasTestedVolume, setHasTestedVolume] = useState(false);

  // Query tracking and editing
  const [submittedQuery, setSubmittedQuery] = useState<string>('');
  const [processingQuery, setProcessingQuery] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableQuery, setEditableQuery] = useState<string>('');
  const [showEditOption, setShowEditOption] = useState(false);

  // New features
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingStep, setLoadingStep] = useState('');

  const lastTranscriptRef = useRef('');
  const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  // Prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load query history on mount
  useEffect(() => {
    if (isClient) {
      try {
        const saved = localStorage.getItem('cryptoQueryHistory');
        if (saved) {
          setQueryHistory(JSON.parse(saved));
        }
      } catch (e) {
        console.warn('Failed to load query history');
      }
    }
  }, [isClient]);

  // Network status detection
  useEffect(() => {
    if (!isClient) return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isClient]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isClient) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Spacebar to toggle voice input (when not editing)
      if (event.code === 'Space' && !isEditing && document.activeElement?.tagName !== 'INPUT') {
        event.preventDefault();
        handleVoiceToggle();
      }
      
      // Escape to cancel everything
      if (event.code === 'Escape') {
        stopEverything();
      }
      
      // Enter to submit current transcript (when not editing)
      if (event.code === 'Enter' && transcript && !isEditing && !loading) {
        event.preventDefault();
        testAPI(transcript);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isClient, isEditing, transcript, loading]);

  // Auto-submit logic when transcript stops changing
  useEffect(() => {
    if (listening && transcript && transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript;
      
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current);
      }

      // Show edit option when transcript appears
      if (transcript.trim()) {
        setShowEditOption(true);
        setEditableQuery(transcript);
      }

      // Start timeout for auto-submit (only if not in edit mode)
      if (!isEditing) {
        transcriptTimeoutRef.current = setTimeout(() => {
          if (transcript.trim() && listening && !isEditing) {
            stopListening();
            testAPI(transcript.trim());
          }
        }, 4000); // 4 seconds to give time for editing
      }
    }
  }, [transcript, listening, isEditing]);

  // Show volume reminder after first speech attempt
  useEffect(() => {
    if (isSpeaking && !hasTestedVolume) {
      setShowVolumeWarning(true);
      setHasTestedVolume(true);
      setTimeout(() => setShowVolumeWarning(false), 5000);
    }
  }, [isSpeaking, hasTestedVolume]);

  // Check if speech synthesis is available
  const speechSynthesisAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Add query to history
  const addToHistory = (query: string) => {
    setQueryHistory(prev => {
      const newHistory = [query, ...prev.filter(q => q !== query)].slice(0, 10); // Keep last 10
      try {
        localStorage.setItem('cryptoQueryHistory', JSON.stringify(newHistory));
      } catch (e) {
        console.warn('Failed to save query history');
      }
      return newHistory;
    });
  };

  const startListening = () => {
    resetTranscript();
    setProcessingQuery(false);
    lastTranscriptRef.current = '';
    setError(null);
    setResponse(null);
    setSubmittedQuery('');
    setIsEditing(false);
    setEditableQuery('');
    setShowEditOption(false);
    setRetryCount(0);
    setLoadingStep('');
    
    if (transcriptTimeoutRef.current) {
      clearTimeout(transcriptTimeoutRef.current);
    }

    SpeechRecognition.startListening({
      continuous: true,
      language: 'en-US',
    });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  const stopEverything = () => {
    // Stop listening
    stopListening();
    
    // Clear timeouts
    if (transcriptTimeoutRef.current) {
      clearTimeout(transcriptTimeoutRef.current);
    }
    
    // Abort any ongoing API request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Stop any speech
    stopSpeaking();
    
    // Reset all states
    setProcessingQuery(false);
    setLoading(false);
    setError(null);
    resetTranscript();
    lastTranscriptRef.current = '';
    setIsEditing(false);
    setEditableQuery('');
    setShowEditOption(false);
    setRetryCount(0);
    setLoadingStep('');
    
    console.log('🛑 Everything stopped - ready for new query');
  };

  const startNewQuery = () => {
    stopEverything();
    setResponse(null);
    setSubmittedQuery('');
    console.log('🔄 Starting fresh - all data cleared');
  };

  const startEdit = () => {
    // Stop the auto-submit timer
    if (transcriptTimeoutRef.current) {
      clearTimeout(transcriptTimeoutRef.current);
    }
    stopListening();
    setIsEditing(true);
    setEditableQuery(transcript || '');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditableQuery('');
    setShowEditOption(false);
    resetTranscript();
  };

  const submitEditedQuery = () => {
    if (editableQuery.trim()) {
      setIsEditing(false);
      setShowEditOption(false);
      testAPI(editableQuery.trim());
    }
  };

  const speakText = (text: string) => {
    if (!speechSynthesisAvailable) return;

    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = 1;
    utterance.volume = 0.9;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeechUtterance(null);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeechUtterance(null);
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    setSpeechUtterance(utterance);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthesisAvailable && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeechUtterance(null);
    }
  };

  const pauseSpeaking = () => {
    if (speechSynthesisAvailable && window.speechSynthesis.speaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeaking = () => {
    if (speechSynthesisAvailable && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const testVolume = () => {
    speakText("Volume test. If you can hear this, your volume is working correctly.");
  };

  // Enhanced testAPI with retry logic and progress tracking
  const testAPI = async (query: string, attempt: number = 1) => {
    const maxRetries = 3;
    
    if (!query.trim()) {
      setError('Please provide a query first');
      return;
    }

    // Check if offline
    if (!isOnline) {
      setError('No internet connection. Please check your network and try again.');
      return;
    }

    // Store the submitted query immediately
    setSubmittedQuery(query);
    setLoading(true);
    setProcessingQuery(true);
    setError(null);
    setResponse(null);
    setShowEditOption(false);
    setRetryCount(attempt - 1);

    // Add to history
    addToHistory(query);

    // Create abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      console.log(`🚀 Testing API with query: "${query}" (attempt ${attempt})`);
      
      setLoadingStep('🔍 Detecting cryptocurrency...');
      const startTime = Date.now();
      
      const result = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: abortController.signal
      });
      
      const endTime = Date.now();
      console.log(`📡 API Response in ${endTime - startTime}ms:`, result.status);
      
      if (!result.ok) {
        const errorData = await result.json().catch(() => ({}));
        
        // Handle specific error codes
        if (result.status === 429) {
          throw new Error(`Too many requests. Please wait ${errorData.retryAfter || 60} seconds before trying again.`);
        } else if (result.status === 400) {
          throw new Error(errorData.error || 'Invalid request. Please check your query.');
        } else if (result.status >= 500) {
          throw new Error('Server error. Please try again in a moment.');
        } else {
          throw new Error(`API Error: ${result.status} ${result.statusText}`);
        }
      }
      
      setLoadingStep('🧠 Processing AI analysis...');
      const data = await result.json();
      console.log('✅ API Response Data:', data);
      
      setLoadingStep('✅ Complete!');
      setResponse(data);
      setRetryCount(0);
      
      if (autoSpeak && data.spokenResponse) {
        setTimeout(() => {
          speakText(data.spokenResponse);
        }, 1000);
      }
      
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('🛑 API request was cancelled');
        return;
      }
      
      console.error(`❌ API Error (attempt ${attempt}):`, err);
      
      // Retry logic
      if (attempt < maxRetries && isOnline) {
        console.log(`🔄 Retrying API call (attempt ${attempt + 1}/${maxRetries})`);
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        setTimeout(() => {
          testAPI(query, attempt + 1);
        }, delay);
        return;
      }
      
      // Final error handling
      setRetryCount(0);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      if (attempt >= maxRetries) {
        setError(`Analysis failed after ${maxRetries} attempts: ${errorMessage}`);
      } else {
        setError(errorMessage);
      }
      
    } finally {
      if (attempt >= maxRetries || retryCount === 0) {
        setLoading(false);
        setProcessingQuery(false);
        setLoadingStep('');
        abortControllerRef.current = null;
      }
    }
  };

  const handleVoiceToggle = () => {
    if (listening || loading || processingQuery) {
      stopEverything();
    } else {
      startListening();
    }
  };

  const quickQueries = [
    'What is the sentiment on Bitcoin?',
    'How is Ethereum trending?',
    'What is the price of Solana?',
    'Should I buy Cardano?'
  ];

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY': return '#28a745';
      case 'SELL': return '#dc3545';
      case 'HOLD': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return '#28a745';
      case 'bearish': return '#dc3545';
      case 'neutral': return '#6c757d';
      default: return '#6c757d';
    }
  };

  // Don't render until client-side to prevent hydration issues
  if (!isClient) {
    return (
      <div className="card">
        <div className="loading">Loading voice interface...</div>
      </div>
    );
  }

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="card">
        <div className="status error">
          <strong>❌ Speech Recognition Not Supported</strong>
          <br />Your browser doesn't support speech recognition. 
          <br />Try Chrome, Edge, or Safari for voice features.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>🎤 Voice Crypto Assistant</h2>
      <p>Ask about any cryptocurrency using your voice - with edit option for tricky names!</p>
      
      {/* Keyboard shortcuts hint */}
      <div style={{ 
        fontSize: '0.75rem', 
        color: '#6c757d', 
        textAlign: 'center',
        marginBottom: '1rem',
        fontStyle: 'italic'
      }}>
        💡 Shortcuts: Spacebar (start/stop voice) • Enter (submit) • Escape (cancel)
      </div>
      
      {/* Voice Settings */}
      <div className="settings-panel">
        <div className="settings-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
            />
            <span>🔊 Auto-speak responses</span>
          </label>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="speechRate" style={{ fontSize: '0.875rem' }}>
              🏃 Speed:
            </label>
            <input
              id="speechRate"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              style={{ width: '80px' }}
            />
            <span style={{ fontSize: '0.875rem', minWidth: '30px' }}>
              {speechRate}x
            </span>
          </div>

          <button
            onClick={testVolume}
            className="button"
            disabled={loading || processingQuery}
            style={{ 
              background: '#17a2b8', 
              fontSize: '0.875rem',
              padding: '0.5rem 1rem'
            }}
          >
            🔊 Test Volume
          </button>
        </div>
        
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {speechSynthesisAvailable ? (
            <span className="status-indicator success">
              ✅ Text-to-Speech Available
            </span>
          ) : (
            <span className="status-indicator error">
              ❌ Text-to-Speech Not Available
            </span>
          )}
          
          {!isOnline && (
            <span className="status-indicator error">
              🌐 Offline
            </span>
          )}
        </div>
      </div>

      {/* Network status warning */}
      {!isOnline && (
        <div className="status error">
          <strong>🌐 No Internet Connection</strong>
          <br />Please check your network connection and try again.
        </div>
      )}

      {/* Retry indicator */}
      {retryCount > 0 && (
        <div className="status info">
          <strong>🔄 Retrying... (Attempt {retryCount + 1}/3)</strong>
          <br />Having trouble connecting to the analysis service.
        </div>
      )}

      {/* Volume Warning */}
      {showVolumeWarning && (
        <div className="volume-warning">
          <strong>🔊 Can't hear the audio?</strong>
          <br />• Check your device volume is turned up
          <br />• Make sure your speakers/headphones are connected
          <br />• Click "Test Volume" to verify audio is working
          <br />• Look for the 🎵 speaking animation when audio plays
        </div>
      )}

      {/* Voice Input Section with Stop Button */}
      <div style={{ textAlign: 'center', margin: '2rem 0' }}>
        <button 
          onClick={handleVoiceToggle}
          disabled={!isMicrophoneAvailable || isEditing}
          className={`button ${(listening || loading || processingQuery) ? 'danger' : ''}`}
          style={{ 
            fontSize: '1.2rem', 
            padding: '1rem 2rem',
            minWidth: '200px'
          }}
        >
          {listening ? '🛑 Stop & Cancel' : 
           loading || processingQuery ? '🛑 Stop Analysis' : 
           '🎤 Start Voice Input'}
        </button>
        
        {!isMicrophoneAvailable && (
          <div className="status error" style={{ marginTop: '1rem' }}>
            ❌ Microphone not available. Please allow microphone access.
          </div>
        )}
      </div>

      {/* Submitted Query Display */}
      {submittedQuery && (
        <div style={{ 
          background: '#e3f2fd', 
          border: '2px solid #2196f3',
          borderRadius: '8px',
          padding: '1rem',
          margin: '1rem 0',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#1976d2', fontSize: '1rem' }}>
                📤 Your Query:
              </strong>
              <div style={{ 
                marginTop: '0.5rem',
                fontSize: '1.1rem',
                fontWeight: '500',
                color: '#0d47a1',
                lineHeight: '1.4'
              }}>
                "{submittedQuery}"
              </div>
              {loading && (
                <div style={{ 
                  marginTop: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#1976d2',
                  fontStyle: 'italic'
                }}>
                  ⏳ {loadingStep || 'Analyzing this question...'}
                </div>
              )}
              {response?.crypto_detection?.correction_made && (
                <div style={{ 
                  marginTop: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#ff9800',
                  fontStyle: 'italic'
                }}>
                  🔧 Auto-corrected: {response.crypto_detection.reasoning}
                </div>
              )}
              {response && (
                <div style={{ 
                  marginTop: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#2e7d32',
                  fontStyle: 'italic'
                }}>
                  ✅ Analysis complete • Response time: {response.responseTime}ms
                </div>
              )}
            </div>
            
            <button
              onClick={startNewQuery}
              className="button"
              style={{ 
                background: '#4caf50',
                fontSize: '0.875rem',
                padding: '0.5rem 1rem',
                marginLeft: '1rem'
              }}
            >
              🔄 New Query
            </button>
          </div>
        </div>
      )}

      {/* Voice Status */}
      {listening && !isEditing && (
        <div className="status info listening-status">
          <strong>🎤 Listening...</strong>
          <br />Ask about any cryptocurrency. I'll auto-submit after 4 seconds of silence.
          <br /><em>Click "Edit Query" below if the text looks wrong!</em>
        </div>
      )}

      {/* Real-time Transcript Display with Edit Option */}
      {(listening || showEditOption) && !isEditing && transcript && (
        <div className="transcript-container">
          <strong>👂 I heard:</strong> 
          <div style={{ 
            marginTop: '0.5rem',
            fontSize: '1.1rem',
            fontWeight: '500',
            color: '#0c5460'
          }}>
            "{transcript}"
          </div>
          <div style={{ 
            marginTop: '1rem',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ 
              fontSize: '0.875rem',
              color: '#6c757d',
              fontStyle: 'italic',
              flex: 1
            }}>
              {listening ? 'Auto-submit in 4 seconds of silence...' : 'Ready to submit or edit'}
            </div>
            <button
              onClick={startEdit}
              className="button"
              style={{ 
                background: '#ffc107',
                color: '#212529',
                fontSize: '0.875rem',
                padding: '0.5rem 1rem'
              }}
            >
              ✏️ Edit Query
            </button>
            {!listening && (
              <button
                onClick={() => testAPI(transcript)}
                className="button"
                style={{ 
                  background: '#28a745',
                  fontSize: '0.875rem',
                  padding: '0.5rem 1rem'
                }}
              >
                🚀 Submit As-Is
              </button>
            )}
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <div style={{ 
          background: '#fff3cd', 
          border: '2px solid #ffc107',
          borderRadius: '8px',
          padding: '1rem',
          margin: '1rem 0'
        }}>
          <strong style={{ color: '#856404' }}>✏️ Edit Your Query:</strong>
          <div style={{ marginTop: '1rem' }}>
            <input
              type="text"
              value={editableQuery}
              onChange={(e) => setEditableQuery(e.target.value)}
              placeholder="Type your cryptocurrency question..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ffc107',
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none'
              }}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  submitEditedQuery();
                }
              }}
            />
          </div>
          <div style={{ 
            marginTop: '1rem',
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={cancelEdit}
              className="button"
              style={{ 
                background: '#6c757d',
                fontSize: '0.875rem',
                padding: '0.5rem 1rem'
              }}
            >
              ❌ Cancel
            </button>
            <button
              onClick={submitEditedQuery}
              disabled={!editableQuery.trim()}
              className="button"
              style={{ 
                background: '#28a745',
                fontSize: '0.875rem',
                padding: '0.5rem 1rem'
              }}
            >
              🚀 Submit Query
            </button>
          </div>
          <div style={{ 
            marginTop: '0.5rem',
            fontSize: '0.875rem',
            color: '#6c757d',
            fontStyle: 'italic'
          }}>
            💡 Perfect for tricky names like "Axie Infinity", "Chainlink", "Uniswap", etc.
          </div>
        </div>
      )}

      {/* Manual Query Input */}
      <div style={{ marginTop: '1rem' }}>
        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '1rem' }}>
            ⌨️ Or type your query manually
          </summary>
          <div style={{ 
            background: '#f8f9fa',
            padding: '1rem',
            borderRadius: '6px',
            border: '1px solid #dee2e6'
          }}>
            <input
              type="text"
              placeholder="Type cryptocurrency name or question (e.g., 'Axie Infinity price', 'Chainlink sentiment')"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '1rem',
                marginBottom: '0.5rem'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const query = (e.target as HTMLInputElement).value;
                  if (query.trim()) {
                    testAPI(query.trim());
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
            <div style={{ 
              fontSize: '0.875rem',
              color: '#6c757d',
              fontStyle: 'italic'
            }}>
              Press Enter to submit • Great for hard-to-pronounce cryptocurrency names
            </div>
          </div>
        </details>
      </div>

      {/* Query History */}
      {queryHistory.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '1rem' }}>
              🕒 Recent Queries ({queryHistory.length})
            </summary>
            <div style={{ 
              background: '#f8f9fa',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #dee2e6'
            }}>
              {queryHistory.map((historyQuery, index) => (
                <div 
                  key={index}
                  className="query-history-item"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem',
                    borderBottom: index < queryHistory.length - 1 ? '1px solid #dee2e6' : 'none'
                  }}
                >
                  <span style={{ flex: 1, fontSize: '0.875rem' }}>
                    "{historyQuery}"
                  </span>
                  <button
                    onClick={() => testAPI(historyQuery)}
                    disabled={loading || listening || processingQuery || isEditing}
                    className="button"
                    style={{ 
                      background: '#007bff',
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      marginLeft: '0.5rem'
                    }}
                  >
                    🔄 Run Again
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  setQueryHistory([]);
                  localStorage.removeItem('cryptoQueryHistory');
                }}
                className="button"
                style={{ 
                  background: '#dc3545',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  marginTop: '0.5rem'
                }}
              >
                🗑️ Clear History
              </button>
            </div>
          </details>
        </div>
      )}

      {/* Quick Test Buttons */}
      <div style={{ marginTop: '1rem' }}>
        <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
          📝 Or click to test these queries:
        </p>
        {quickQueries.map((query, index) => (
          <button
            key={index}
            onClick={() => testAPI(query)}
            disabled={loading || listening || processingQuery || isEditing}
            className="button"
            style={{ 
              background: '#6c757d', 
              fontSize: '0.875rem', 
              padding: '0.5rem 1rem',
              margin: '0.25rem'
            }}
          >
            {query}
          </button>
        ))}
      </div>

      {/* Enhanced Loading State */}
      {(loading || processingQuery) && (
        <div className="loading-container">
          <strong>⏳ {loadingStep || 'Analyzing with AI...'}</strong>
          <div style={{ 
            background: '#e9ecef', 
            borderRadius: '4px', 
            height: '4px', 
            marginTop: '0.5rem',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#007bff',
              height: '100%',
              borderRadius: '4px',
              animation: 'progress 2s ease-in-out infinite',
              width: loading ? '70%' : '100%'
            }} />
          </div>
          <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            💡 <strong>Tip:</strong> Press Escape to cancel anytime
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="status error error-with-retry">
          <strong>❌ Error:</strong>
          <br />{error}
          {!isOnline && (
            <>
              <br />🌐 Check your internet connection and try again.
            </>
          )}
        </div>
      )}

      {/* Structured Analysis Results */}
      {response && (
        <div>
          {/* Header */}
          <div className="status success">
            <strong>✅ AI Analysis Complete!</strong>
            <br />Cryptocurrency: <strong>{response.symbol}</strong>
            <br />Tools Used: {response.toolsUsed} | Data Points: {response.dataPoints}
            {response.responseTime && (
              <>
                <br />⚡ Response Time: {response.responseTime}ms
              </>
            )}
            {response.crypto_detection?.correction_made && (
              <>
                <br />🔧 <strong>Auto-corrected:</strong> {response.crypto_detection.original_term} → {response.crypto_detection.detected_crypto}
              </>
            )}
          </div>

          {/* Recommendation Section */}
          <div style={{ 
            background: '#f8f9fa', 
            border: '2px solid ' + getRecommendationColor(response.recommendation),
            borderRadius: '8px', 
            padding: '1rem', 
            margin: '1rem 0' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: getRecommendationColor(response.recommendation) 
              }}>
                {response.recommendation}
              </span>
              <span style={{ 
                fontSize: '1.2rem', 
                fontWeight: 'bold',
                color: getSentimentColor(response.social_sentiment)
              }}>
                {response.confidence}% Confident
              </span>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Social Sentiment:</strong> 
              <span style={{ color: getSentimentColor(response.social_sentiment), fontWeight: 'bold' }}>
                {response.social_sentiment.toUpperCase()}
              </span>
            </div>
            <div>
              <strong>Reasoning:</strong> {response.reasoning}
            </div>
          </div>

          {/* Spoken Response Section with Enhanced Controls */}
          <div className="voice-response-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#0c5460' }}>🔊 Voice Response</h3>
              
              <div className="audio-controls">
                <button
                  onClick={() => speakText(response.spokenResponse)}
                  disabled={isSpeaking && !isPaused}
                  className="button"
                  style={{ 
                    background: '#17a2b8', 
                    fontSize: '0.875rem',
                    padding: '0.5rem 1rem'
                  }}
                >
                  {isSpeaking && !isPaused ? '🔊 Speaking...' : '▶️ Play Audio'}
                </button>
                
                {isSpeaking && !isPaused && (
                  <button
                    onClick={pauseSpeaking}
                    className="button"
                    style={{ 
                      background: '#ffc107', 
                      color: '#212529',
                      fontSize: '0.875rem',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    ⏸️ Pause
                  </button>
                )}

                {isPaused && (
                  <button
                    onClick={resumeSpeaking}
                    className="button"
                    style={{ 
                      background: '#28a745', 
                      fontSize: '0.875rem',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    ▶️ Resume
                  </button>
                )}
                
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="button"
                    style={{ 
                      background: '#dc3545', 
                      fontSize: '0.875rem',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    ⏹️ Stop
                  </button>
                )}
              </div>
            </div>
            
            {isSpeaking && (
              <div className="speaking-indicator">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="audio-wave">🎵📢🔊</div>
                  <div>
                    <strong>
                      {isPaused ? 
                        `Audio paused at ${speechRate}x speed` : 
                        `Audio is playing at ${speechRate}x speed!`
                      }
                    </strong>
                    <br />Can't hear it? Check your volume or use the controls above.
                  </div>
                </div>
              </div>
            )}
            
            <div className="voice-text">
              {response.spokenResponse}
            </div>
            
            <div style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.875rem', 
              color: '#6c757d',
              fontStyle: 'italic'
            }}>
              💡 This text was read aloud at {speechRate}x speed. Use audio controls to replay or pause/resume.
            </div>
          </div>

          {/* Key Metrics */}
          <div style={{ 
            background: '#f8f9fa', 
            borderRadius: '6px', 
            padding: '1rem', 
            margin: '1rem 0' 
          }}>
            <strong>📊 Key Metrics:</strong>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '0.5rem', 
              marginTop: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <div><strong>Price:</strong> {response.key_metrics.price}</div>
              <div><strong>Galaxy Score:</strong> {response.key_metrics.galaxy_score}</div>
              <div><strong>Alt Rank:</strong> {response.key_metrics.alt_rank}</div>
              <div><strong>Social Dominance:</strong> {response.key_metrics.social_dominance}</div>
              <div><strong>Market Cap:</strong> {response.key_metrics.market_cap}</div>
              <div><strong>24h Volume:</strong> {response.key_metrics.volume_24h}</div>
              <div><strong>Mentions:</strong> {response.key_metrics.mentions}</div>
              <div><strong>Engagements:</strong> {response.key_metrics.engagements}</div>
              <div><strong>Creators:</strong> {response.key_metrics.creators}</div>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="result-box">
            <strong>🤖 AI Analysis:</strong>
            <br /><br />
            {response.ai_analysis}
          </div>

          {/* Miscellaneous */}
          {response.miscellaneous && (
            <div style={{ 
              background: '#e9ecef', 
              borderRadius: '6px', 
              padding: '1rem', 
              margin: '1rem 0',
              fontSize: '0.875rem'
            }}>
              <strong>💡 Additional Insights:</strong>
              <br />{response.miscellaneous}
            </div>
          )}

          {/* Raw Response Toggle */}
          <details style={{ marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              🔍 Raw API Response (Click to expand)
            </summary>
            <div className="result-box">
              {JSON.stringify(response, null, 2)}
            </div>
          </details>
        </div>
      )}

      {/* Enhanced Instructions */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        background: '#f8f9fa', 
        borderRadius: '6px',
        fontSize: '0.875rem'
      }}>
        <strong>🎯 Complete Feature List:</strong>
        <br />• <strong>Smart Voice Recognition:</strong> Auto-correction for crypto names
        <br />• <strong>Edit Mode:</strong> Fix transcript before submission  
        <br />• <strong>Manual Input:</strong> Type queries for any cryptocurrency
        <br />• <strong>Query History:</strong> Recent queries saved and reusable
        <br />• <strong>Retry Logic:</strong> Auto-retry failed requests (3 attempts)
        <br />• <strong>Keyboard Shortcuts:</strong> Spacebar, Enter, Escape
        <br />• <strong>Network Detection:</strong> Offline/online status
        <br />• <strong>Progress Tracking:</strong> See which step is running
        <br />• <strong>Audio Controls:</strong> Play, pause, resume, stop from any position
        <br /><br />
        <strong>🚀 Production Ready:</strong>
        <br />• Rate limiting protection • Error categorization • Request timeouts
        <br />• Smart fallbacks • Input validation • Response time tracking
      </div>
    </div>
  );
}
