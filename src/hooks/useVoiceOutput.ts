'use client';

import { useState, useRef, useCallback } from 'react';

interface UseVoiceOutputReturn {
  isSpeaking: boolean;
  isPaused: boolean;
  speak: (text: string) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  currentRate: number;
  currentVolume: number;
  error: string | null;
}

export function useVoiceOutput(): UseVoiceOutputReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentRate, setCurrentRate] = useState(1);
  const [currentVolume, setCurrentVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isIntentionalStop = useRef(false);

  const speak = useCallback(async (text: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        // Stop any current speech
        if (utteranceRef.current) {
          isIntentionalStop.current = true;
          speechSynthesis.cancel();
        }

        setError(null);
        setIsSpeaking(true);
        setIsPaused(false);
        isIntentionalStop.current = false;

        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        // Set voice properties
        utterance.rate = currentRate;
        utterance.volume = currentVolume;
        utterance.pitch = 1;

        // Try to get a better voice
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Google') || 
          voice.name.includes('Microsoft') ||
          voice.name.includes('System')
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onstart = () => {
          setIsSpeaking(true);
          setIsPaused(false);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          utteranceRef.current = null;
          
          // Only resolve if it wasn't an intentional stop
          if (!isIntentionalStop.current) {
            resolve();
          }
        };

        utterance.onerror = (event) => {
          setIsSpeaking(false);
          setIsPaused(false);
          utteranceRef.current = null;
          
          // Only show error if it wasn't an intentional interruption
          if (!isIntentionalStop.current && event.error !== 'interrupted') {
            setError(`Speech synthesis error: ${event.error}`);
            reject(new Error(`Speech synthesis error: ${event.error}`));
          } else {
            // For intentional stops or interruptions, just resolve
            resolve();
          }
        };

        utterance.onpause = () => {
          setIsPaused(true);
        };

        utterance.onresume = () => {
          setIsPaused(false);
        };

        speechSynthesis.speak(utterance);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to synthesize speech');
        setIsSpeaking(false);
        setIsPaused(false);
        reject(err);
      }
    });
  }, [currentRate, currentVolume]);

  const pause = useCallback(() => {
    if (utteranceRef.current && isSpeaking) {
      speechSynthesis.pause();
    }
  }, [isSpeaking]);

  const resume = useCallback(() => {
    if (utteranceRef.current && isPaused) {
      speechSynthesis.resume();
    }
  }, [isPaused]);

  const stop = useCallback(() => {
    if (utteranceRef.current) {
      isIntentionalStop.current = true;
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
      setError(null); // Clear any errors when intentionally stopping
    }
  }, []);

  const setRate = useCallback((rate: number) => {
    setCurrentRate(rate);
    // If currently speaking, stop and restart with new rate
    if (utteranceRef.current && isSpeaking) {
      const currentText = utteranceRef.current.text;
      stop();
      // Small delay to ensure clean stop
      setTimeout(() => {
        speak(currentText);
      }, 100);
    }
  }, [isSpeaking, speak, stop]);

  const setVolume = useCallback((volume: number) => {
    setCurrentVolume(volume);
    // Volume can be changed in real-time
    if (utteranceRef.current) {
      utteranceRef.current.volume = volume;
    }
  }, []);

  return {
    isSpeaking,
    isPaused,
    speak,
    pause,
    resume,
    stop,
    setRate,
    setVolume,
    currentRate,
    currentVolume,
    error
  };
}
