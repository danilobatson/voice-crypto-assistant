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
  const [error, setError] = useState<string | null>(null);

  const speak = useCallback(async (text: string) => {
    try {
      setError(null);
      setIsSpeaking(true);

      // Use browser Speech Synthesis API
      if ('speechSynthesis' in window) {
        // Stop any currently speaking audio
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice settings
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Try to use a high-quality voice (fixed the TypeScript error)
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Google') || 
          voice.name.includes('Microsoft') ||
          voice.name.includes('Samantha') ||
          voice.lang.includes('en-US')
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        utterance.onend = () => {
          setIsSpeaking(false);
        };
        
        utterance.onerror = (event) => {
          setError('Speech synthesis failed: ' + event.error);
          setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
      } else {
        throw new Error('Speech synthesis not supported in this browser');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to synthesize speech');
      setIsSpeaking(false);
    }
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  return {
    isSpeaking,
    speak,
    stop,
    error
  };
}
