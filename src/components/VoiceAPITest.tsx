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
}

export function VoiceAPITest() {
  const [response, setResponse] = useState<StructuredAPIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Voice output controls
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [speechRate, setSpeechRate] = useState(1.3); // Faster default speed
  const [showVolumeWarning, setShowVolumeWarning] = useState(false);
  const [hasTestedVolume, setHasTestedVolume] = useState(false);

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

  // Show volume reminder after first speech attempt
  useEffect(() => {
    if (isSpeaking && !hasTestedVolume) {
      setShowVolumeWarning(true);
      setHasTestedVolume(true);
      // Hide warning after 5 seconds
      setTimeout(() => setShowVolumeWarning(false), 5000);
    }
  }, [isSpeaking, hasTestedVolume]);

  // Check if speech synthesis is available
  const speechSynthesisAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const startListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({
      continuous: false,
      language: 'en-US',
    });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  const speakText = (text: string) => {
    if (!speechSynthesisAvailable) return;

    // Stop any current speech
    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate; // Use adjustable speed
    utterance.pitch = 1;
    utterance.volume = 0.9; // Slightly louder
    
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeechUtterance(null);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeechUtterance(null);
    };

    setSpeechUtterance(utterance);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthesisAvailable && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeechUtterance(null);
    }
  };

  const pauseSpeaking = () => {
    if (speechSynthesisAvailable && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  };

  const resumeSpeaking = () => {
    if (speechSynthesisAvailable && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  };

  const testVolume = () => {
    speakText("Volume test. If you can hear this, your volume is working correctly.");
  };

  const testAPI = async (query: string) => {
    if (!query.trim()) {
      setError('Please provide a query first');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      console.log('🚀 Testing API with voice query:', query);
      
      const startTime = Date.now();
      const result = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const endTime = Date.now();
      
      console.log(`📡 API Response in ${endTime - startTime}ms:`, result.status);
      
      if (!result.ok) {
        throw new Error(`API Error: ${result.status} ${result.statusText}`);
      }
      
      const data = await result.json();
      console.log('✅ API Response Data:', data);
      
      setResponse(data);
      
      // Auto-speak if enabled
      if (autoSpeak && data.spokenResponse) {
        setTimeout(() => {
          speakText(data.spokenResponse);
        }, 1000); // Small delay to let user see the results first
      }
      
    } catch (err) {
      console.error('❌ API Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceQuery = () => {
    if (listening) {
      stopListening();
      // Process the transcript after stopping
      setTimeout(() => {
        if (transcript.trim()) {
          testAPI(transcript);
        }
      }, 500);
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
      <p>Ask about any cryptocurrency using your voice!</p>
      
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
            style={{ 
              background: '#17a2b8', 
              fontSize: '0.875rem',
              padding: '0.5rem 1rem'
            }}
          >
            🔊 Test Volume
          </button>
        </div>
        
        {speechSynthesisAvailable ? (
          <div style={{ marginTop: '0.5rem' }}>
            <span className="status-indicator success">
              ✅ Text-to-Speech Available
            </span>
          </div>
        ) : (
          <div style={{ marginTop: '0.5rem' }}>
            <span className="status-indicator error">
              ❌ Text-to-Speech Not Available
            </span>
          </div>
        )}
      </div>

      {/* Volume Warning */}
      {showVolumeWarning && (
        <div style={{ 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7',
          borderRadius: '6px',
          padding: '1rem',
          margin: '1rem 0',
          animation: 'pulse 2s infinite'
        }}>
          <strong>🔊 Can't hear the audio?</strong>
          <br />• Check your device volume is turned up
          <br />• Make sure your speakers/headphones are connected
          <br />• Click "Test Volume" to verify audio is working
          <br />• Look for the 🎵 speaking animation below when audio plays
        </div>
      )}

      {/* Voice Input Section */}
      <div style={{ textAlign: 'center', margin: '2rem 0' }}>
        <button 
          onClick={handleVoiceQuery}
          disabled={loading || !isMicrophoneAvailable}
          className={`button ${listening ? 'danger' : ''}`}
          style={{ 
            fontSize: '1.2rem', 
            padding: '1rem 2rem',
            minWidth: '200px'
          }}
        >
          {listening ? '🛑 Stop Listening' : '🎤 Start Voice Input'}
        </button>
        
        {!isMicrophoneAvailable && (
          <div className="status error" style={{ marginTop: '1rem' }}>
            ❌ Microphone not available. Please allow microphone access.
          </div>
        )}
      </div>

      {/* Voice Status */}
      {listening && (
        <div className="status info">
          <strong>🎤 Listening...</strong>
          <br />Ask about any cryptocurrency: Bitcoin, Ethereum, Solana, etc.
        </div>
      )}

      {/* Transcript Display */}
      {transcript && (
        <div className="status success">
          <strong>👂 I heard:</strong> "{transcript}"
          <br />
          <button 
            onClick={() => testAPI(transcript)}
            disabled={loading}
            className="button"
            style={{ marginTop: '0.5rem' }}
          >
            🚀 Analyze This Query
          </button>
        </div>
      )}

      {/* Quick Voice Test Buttons */}
      <div style={{ marginTop: '1rem' }}>
        <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
          📝 Or click to test these queries:
        </p>
        {quickQueries.map((query, index) => (
          <button
            key={index}
            onClick={() => testAPI(query)}
            disabled={loading}
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

      {/* Loading State */}
      {loading && (
        <div className="status info">
          <strong>⏳ Analyzing with AI...</strong>
          <br />🤖 Gemini AI is detecting the cryptocurrency...
          <br />🌙 Gathering real-time LunarCrush data...
          <br />📊 Generating structured analysis...
          <br /><em>This takes 10-30 seconds for real analysis.</em>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="status error">
          <strong>❌ Error:</strong>
          <br />{error}
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

          {/* Spoken Response Section with Enhanced Audio Controls */}
          <div className="voice-response-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#0c5460' }}>🔊 Voice Response</h3>
              
              {/* Audio Controls */}
              <div className="audio-controls">
                <button
                  onClick={() => speakText(response.spokenResponse)}
                  disabled={isSpeaking}
                  className="button"
                  style={{ 
                    background: '#17a2b8', 
                    fontSize: '0.875rem',
                    padding: '0.5rem 1rem'
                  }}
                >
                  {isSpeaking ? '🔊 Speaking...' : '▶️ Play Audio'}
                </button>
                
                {isSpeaking && (
                  <>
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
                  </>
                )}
              </div>
            </div>
            
            {/* Enhanced Speaking Status with Animation */}
            {isSpeaking && (
              <div className="speaking-indicator">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="audio-wave">
                    🎵📢🔊
                  </div>
                  <div>
                    <strong>Audio is playing at {speechRate}x speed!</strong>
                    <br />Can't hear it? Check your volume or use the controls above.
                  </div>
                </div>
              </div>
            )}
            
            {/* Spoken Response Text */}
            <div className="voice-text">
              {response.spokenResponse}
            </div>
            
            <div style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.875rem', 
              color: '#6c757d',
              fontStyle: 'italic'
            }}>
              💡 This is the text that gets read aloud at {speechRate}x speed. You can read it yourself or use the audio controls above.
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
        <strong>🎯 Voice Features:</strong>
        <br />• <strong>Speed Control:</strong> Adjust speech speed from 0.5x to 2.0x
        <br />• <strong>Volume Test:</strong> Click "Test Volume" to check audio
        <br />• <strong>Visual Feedback:</strong> Look for 🎵📢🔊 when audio plays
        <br />• <strong>Auto-speak:</strong> Toggle on/off to automatically hear responses
        <br />• <strong>Full Control:</strong> Play, pause, or stop audio anytime
        <br /><br />
        <strong>🎙️ Try saying:</strong>
        <br />• "What's the sentiment on Bitcoin?"
        <br />• "Should I buy Ethereum now?"
        <br />• "How is Solana performing today?"
        <br />• "Give me analysis on Cardano"
        <br /><br />
        <strong>🔊 Audio Tips:</strong>
        <br />• Default speed is 1.3x (faster than normal)
        <br />• Watch for the speaking animation when audio plays
        <br />• Test your volume first if unsure about audio
      </div>
    </div>
  );
}
