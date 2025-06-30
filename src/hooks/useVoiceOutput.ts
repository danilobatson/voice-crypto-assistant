'use client';

import { useState, useCallback } from 'react';

interface UseVoiceOutputReturn {
  isSpeaking: boolean;
  speak: (text: string) => Promise<void>;
  stop: () => void;
  error: string | null;
}

export function useVoiceOutput(): UseVoiceOutputReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [error, setError] = useState<string | null>(null);

  const speak = useCallback(async (text: string) => {
    try {
      setError(null);
      
      // Check if speech synthesis is available
      if (!('speechSynthesis' in window)) {
        throw new Error('Speech synthesis not supported in this browser');
      }

      // Stop any current speech
      if (currentUtterance) {
        speechSynthesis.cancel();
      }

      setIsSpeaking(true);

      // Try AWS Polly first (if available), then fall back to browser synthesis
      try {
        const response = await fetch('/api/voice-synthesis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });

        const data = await response.json();
        
        if (data.success && data.audioUrl) {
          // Use AWS Polly audio
          const audio = new Audio(data.audioUrl);
          
          audio.onended = () => {
            setIsSpeaking(false);
            setCurrentUtterance(null);
          };

          audio.onerror = () => {
            // Fall back to browser synthesis
            useBrowserSynthesis(text);
          };

          await audio.play();
          return;
        }
      } catch (awsError) {
        // AWS Polly not available, fall back to browser synthesis
      }

      // Use browser speech synthesis as fallback
      useBrowserSynthesis(text);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to speak text');
      setIsSpeaking(false);
    }
  }, [currentUtterance]);

  const useBrowserSynthesis = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use a high-quality voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Premium') || 
      voice.name.includes('Enhanced') ||
      voice.name.includes('Google') ||
      voice.lang.startsWith('en-US')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentUtterance(null);
    };

    utterance.onerror = (event) => {
      setError(`Speech synthesis error: ${event.error}`);
      setIsSpeaking(false);
      setCurrentUtterance(null);
    };

    setCurrentUtterance(utterance);
    speechSynthesis.speak(utterance);
  };

  const stop = useCallback(() => {
    if (currentUtterance) {
      speechSynthesis.cancel();
      setCurrentUtterance(null);
    }
    setIsSpeaking(false);
  }, [currentUtterance]);

  return {
    isSpeaking,
    speak,
    stop,
    error
  };
}
