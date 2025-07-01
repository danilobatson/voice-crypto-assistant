'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseVoiceOutputReturn {
  isSpeaking: boolean;
  isPaused: boolean;
  speak: (text: string) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  setVoice: (voice: SpeechSynthesisVoice | null) => void;
  currentRate: number;
  currentVolume: number;
  currentVoice: SpeechSynthesisVoice | null;
  availableVoices: SpeechSynthesisVoice[];
  error: string | null;
}

export function useVoiceOutput(): UseVoiceOutputReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentRate, setCurrentRate] = useState(1);
  const [currentVolume, setCurrentVolume] = useState(1);
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isIntentionalStop = useRef(false);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      // Auto-select a good default voice if none selected
      if (!currentVoice && voices.length > 0) {
        // Try to find a good English voice
        const preferredVoice = voices.find(voice => 
          voice.lang.startsWith('en') && (
            voice.name.includes('Google') || 
            voice.name.includes('Microsoft') ||
            voice.name.includes('Samantha') || // macOS
            voice.name.includes('Alex') || // macOS
            voice.name.includes('Natural') ||
            voice.name.includes('Neural')
          )
        ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
        
        setCurrentVoice(preferredVoice);
      }
    };

    // Load voices immediately
    loadVoices();

    // Some browsers load voices asynchronously
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [currentVoice]);

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

        // Use selected voice
        if (currentVoice) {
          utterance.voice = currentVoice;
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
  }, [currentRate, currentVolume, currentVoice]);

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

  const setVoice = useCallback((voice: SpeechSynthesisVoice | null) => {
    setCurrentVoice(voice);
    // If currently speaking, stop and restart with new voice
    if (utteranceRef.current && isSpeaking) {
      const currentText = utteranceRef.current.text;
      stop();
      // Small delay to ensure clean stop
      setTimeout(() => {
        speak(currentText);
      }, 100);
    }
  }, [isSpeaking, speak, stop]);

  return {
    isSpeaking,
    isPaused,
    speak,
    pause,
    resume,
    stop,
    setRate,
    setVolume,
    setVoice,
    currentRate,
    currentVolume,
    currentVoice,
    availableVoices,
    error
  };
}
