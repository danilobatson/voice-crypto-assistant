'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVoiceOutput } from '@/hooks/useVoiceOutput';
import { Volume2, VolumeX, Mic } from 'lucide-react';

export function VoiceTest() {
  const [testText, setTestText] = useState('Hello! This is a test of browser speech synthesis for the Voice Crypto Assistant.');
  const { isSpeaking, speak, stop, error } = useVoiceOutput();

  const handleSpeak = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(testText);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">🎤 Voice Test Component</h3>
        <p className="text-sm text-gray-600">
          Tests browser speech synthesis - works on all devices, zero setup required
        </p>
      </div>
      
      <div className="space-y-4">
        {/* Text Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Text to Speak:</label>
          <Input
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Enter text to speak..."
            className="w-full"
          />
        </div>

        {/* Speak Button */}
        <Button 
          onClick={handleSpeak}
          disabled={!testText.trim()}
          className="w-full h-12"
          variant={isSpeaking ? "destructive" : "default"}
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-5 h-5 mr-2" />
              Stop Speaking
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5 mr-2" />
              Test Voice Synthesis
            </>
          )}
        </Button>

        {/* Status Display */}
        <div className="space-y-2">
          {isSpeaking && (
            <div className="flex items-center justify-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <Mic className="w-4 h-4 text-blue-600 animate-pulse" />
              <span className="text-blue-700 text-sm">🔊 Speaking with browser synthesis...</span>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">⚠️ {error}</p>
            </div>
          )}

          {!isSpeaking && !error && (
            <div className="text-center">
              <Badge variant="outline" className="text-green-600">
                ✅ Browser voice synthesis ready
              </Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>🌐 Uses browser Speech Synthesis API</p>
          <p>📱 Works on desktop and mobile browsers</p>
          <p>⚡ Zero setup required - no API keys needed</p>
        </div>
      </div>
    </Card>
  );
}
