'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useVoiceOutput } from '@/hooks/useVoiceOutput';
import { Mic, MicOff, Volume2, VolumeX, Brain, Sparkles } from 'lucide-react';

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
      console.log(`🎤 Processing query: "${query}"`);
      
      // Call our analysis API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysisData(data);
        setLastResponse(data.spokenResponse);
        
        // Speak the response using AWS Polly (with fallback)
        await speak(data.spokenResponse);
        
        console.log(`✅ Analysis complete for ${data.symbol}: Used ${data.toolsUsed} tools, ${data.dataPoints} data points`);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }

    } catch (error) {
      console.error('Error processing query:', error);
      const errorMessage = 'I apologize, but I encountered an error processing your request. Please try again with a specific cryptocurrency like Bitcoin or Ethereum.';
      setLastResponse(errorMessage);
      await speak(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Voice Crypto Assistant</h2>
          <Sparkles className="w-6 h-6 text-blue-500" />
        </div>
        <p className="text-gray-600">
          Powered by LunarCrush MCP, Google Gemini AI, and AWS Polly
        </p>
      </div>

      <div className="space-y-4">
        {/* Voice Input Section */}
        <div className="text-center">
          <Button
            onClick={handleVoiceInput}
            disabled={!isMicrophoneAvailable || isProcessing}
            size="lg"
            className={`w-56 h-16 text-lg ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {isListening ? (
              <>
                <MicOff className="w-6 h-6 mr-2" />
                🎤 Listening...
              </>
            ) : (
              <>
                <Mic className="w-6 h-6 mr-2" />
                Start Voice Analysis
              </>
            )}
          </Button>

          {transcript && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>You said:</strong> "{transcript}"
              </p>
            </div>
          )}
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Brain className="w-5 h-5 animate-spin text-blue-500" />
              <span className="font-medium">Analyzing with LunarCrush MCP + Gemini AI...</span>
            </div>
            <p className="text-sm text-gray-600">
              Discovering tools → Gathering social data → Generating insights
            </p>
          </div>
        )}

        {/* Voice Output Section */}
        {(isSpeaking || lastResponse) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">🤖 AI Analysis:</h3>
              {isSpeaking && (
                <Button onClick={handleStopSpeaking} variant="outline" size="sm">
                  <VolumeX className="w-4 h-4 mr-1" />
                  Stop Voice
                </Button>
              )}
            </div>
            
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
              <p className="text-sm leading-relaxed">{lastResponse}</p>
              {isSpeaking && (
                <div className="flex items-center mt-3 text-blue-600">
                  <Volume2 className="w-4 h-4 mr-1 animate-pulse" />
                  <span className="text-xs font-medium">🔊 Speaking with AWS Polly...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analysis Metadata */}
        {analysisData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <Badge variant="default" className="text-lg px-3 py-1">
                {analysisData.symbol}
              </Badge>
              <p className="text-xs mt-1 text-gray-600">Analyzed</p>
            </div>
            
            <div className="text-center">
              <Badge variant="outline" className="px-3 py-1">
                {analysisData.toolsUsed} tools
              </Badge>
              <p className="text-xs mt-1 text-gray-600">MCP Tools Used</p>
            </div>

            <div className="text-center">
              <Badge variant="secondary" className="px-3 py-1">
                {analysisData.dataPoints} data points
              </Badge>
              <p className="text-xs mt-1 text-gray-600">Social Metrics</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {(voiceError || speechError) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">
              ⚠️ {voiceError || speechError}
            </p>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="text-center text-sm text-gray-500 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
          <p className="font-medium mb-1">💡 Try saying:</p>
          <p>"What's the sentiment on Bitcoin?" • "How is Ethereum trending?" • "Tell me about Solana"</p>
        </div>
      </div>
    </Card>
  );
}
