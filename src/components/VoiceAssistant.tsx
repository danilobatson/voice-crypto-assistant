'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useVoiceOutput } from '@/hooks/useVoiceOutput';
import { Mic, MicOff, Volume2, VolumeX, Brain, Loader2 } from 'lucide-react';

interface AnalysisData {
  query: string;
  analysis: string;
  toolsUsed: number;
  dataPoints: number;
  spokenResponse: string;
  symbol: string;
}

export function VoiceAssistant() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  const {
    isSpeaking,
    speak,
    stop: stopSpeaking,
    error: speechError
  } = useVoiceOutput();

  const processQuery = useCallback(async (query: string) => {
    setIsProcessing(true);
    
    try {
      console.log('Processing query:', query);
      
      // Call the analyze API endpoint
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysisData(data);
        setLastResponse(data.spokenResponse || data.analysis || 'Analysis completed');

        // Speak the response
        await speak(data.spokenResponse || data.analysis || 'Analysis completed');
      } else {
        throw new Error(data.error || 'Analysis failed');
      }

    } catch (error) {
      console.error('Error processing query:', error);
      const errorMessage = 'I apologize, but I encountered an error processing your request. Please try again.';
      setLastResponse(errorMessage);
      await speak(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [speak]);

  // Auto-process speech when it ends
  const handleSpeechEnd = useCallback(async (transcript: string) => {
    if (transcript.trim()) {
      await processQuery(transcript);
    }
  }, [processQuery]);

  const {
    transcript,
    isListening,
    isMicrophoneAvailable,
    isLoaded,
    startListening,
    stopListening,
    error: voiceError
  } = useVoiceRecognition(handleSpeechEnd);

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else if (isProcessing) {
      // Don't allow starting while processing
      return;
    } else if (isSpeaking) {
      stopSpeaking();
    } else {
      startListening();
    }
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
  };

  // Show loading state during hydration
  if (!isLoaded) {
    return (
      <Card className="p-6 max-w-2xl mx-auto">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold mb-2">🎤 Voice Crypto Assistant</h2>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading voice features...</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">🎤 Voice Crypto Assistant</h2>
        <p className="text-gray-600">
          Ask me about cryptocurrency sentiment, trends, or market analysis
        </p>
      </div>

      <div className="space-y-4">
        {/* Voice Input Section */}
        <div className="text-center">
          <Button
            onClick={handleVoiceInput}
            disabled={!isMicrophoneAvailable || isProcessing}
            size="lg"
            className={`w-64 h-16 text-lg ${
              isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 
              isProcessing ? 'bg-yellow-500 hover:bg-yellow-600' :
              'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                Processing...
              </>
            ) : isListening ? (
              <>
                <MicOff className="w-6 h-6 mr-2" />
                Stop &amp; Analyze
              </>
            ) : (
              <>
                <Mic className="w-6 h-6 mr-2" />
                Start Voice Analysis
              </>
            )}
          </Button>

          {/* Microphone Status */}
          {!isMicrophoneAvailable && isLoaded && (
            <div className="mt-2">
              <Badge variant="destructive" className="text-xs">
                Microphone not available - Please allow microphone access
              </Badge>
            </div>
          )}

          {/* Live Transcript Display */}
          {isListening && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
              <p className="text-blue-700 font-medium text-sm mb-1">🎤 Listening...</p>
              <p className="text-gray-700">
                {transcript || "Speak now..."}
              </p>
            </div>
          )}

          {/* Captured Speech Display */}
          {!isListening && transcript && !isProcessing && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border-2 border-green-200">
              <p className="text-green-700 font-medium text-sm mb-1">✅ You said:</p>
              <p className="text-gray-700">&quot;{transcript}&quot;</p>
            </div>
          )}
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Brain className="w-5 h-5 animate-pulse text-yellow-600" />
              <span className="text-yellow-700 font-medium">Analyzing with AI...</span>
            </div>
            <p className="text-sm text-yellow-600">Using LunarCrush MCP + Google Gemini</p>
          </div>
        )}

        {/* Voice Output Section */}
        {(isSpeaking || lastResponse) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">🤖 AI Response:</h3>
              {isSpeaking && (
                <Button onClick={handleStopSpeaking} variant="outline" size="sm">
                  <VolumeX className="w-4 h-4 mr-1" />
                  Stop
                </Button>
              )}
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm">{lastResponse}</p>
              {isSpeaking && (
                <div className="flex items-center mt-2 text-blue-600">
                  <Volume2 className="w-4 h-4 mr-1" />
                  <span className="text-xs">🔊 Speaking...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analysis Data */}
        {analysisData && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold">📊 Analysis Details:</h3>
            
            {analysisData.symbol && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{analysisData.symbol}</Badge>
                <span className="text-sm text-gray-600">Symbol analyzed</span>
              </div>
            )}

            {analysisData.toolsUsed && (
              <div className="text-sm text-gray-600">
                🛠️ Used {analysisData.toolsUsed} LunarCrush tools with {analysisData.dataPoints} data points
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {(voiceError || speechError) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">
              ⚠️ {voiceError || speechError}
            </p>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="text-center text-sm text-gray-500 space-y-1">
          <p><strong>How to use:</strong></p>
          <p>1. Click &quot;Start Voice Analysis&quot;</p>
          <p>2. Speak your question (e.g., &quot;What&apos;s the sentiment on Bitcoin?&quot;)</p>
          <p>3. Wait 1-2 seconds after speaking - it will auto-process!</p>
          <p>4. Listen to the AI response</p>
        </div>
      </div>
    </Card>
  );
}
