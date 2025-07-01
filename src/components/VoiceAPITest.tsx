'use client';

import { useState, useEffect } from 'react';
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
      
      // Speak the response using Web Speech API
      if ('speechSynthesis' in window && data.spokenResponse) {
        const utterance = new SpeechSynthesisUtterance(data.spokenResponse);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
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
            <br />🔊 <em>AI response is being spoken aloud!</em>
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

      {/* Instructions */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        background: '#f8f9fa', 
        borderRadius: '6px',
        fontSize: '0.875rem'
      }}>
        <strong>🎯 How to use:</strong>
        <br />1. Click "🎤 Start Voice Input"
        <br />2. Say: "What is the sentiment on [Cryptocurrency]?"
        <br />3. Click "🛑 Stop Listening" 
        <br />4. Wait for AI analysis (10-30 seconds)
        <br />5. Listen to the structured spoken response!
        <br /><br />
        <strong>✨ New Features:</strong>
        <br />• Gemini AI automatically detects cryptocurrency
        <br />• Structured recommendation (BUY/SELL/HOLD)  
        <br />• Real metrics from LunarCrush MCP
        <br />• Confidence scores and detailed analysis
      </div>
    </div>
  );
}
