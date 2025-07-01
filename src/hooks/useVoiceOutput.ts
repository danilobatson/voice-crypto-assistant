import { useState, useCallback, useRef } from 'react';

interface UseVoiceOutputReturn {
  isSpeaking: boolean;
  isPaused: boolean;
  currentRate: number;
  currentVolume: number;
  speak: (text: string, rate?: number, volume?: number) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  setRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  error: string | null;
}

export function useVoiceOutput(): UseVoiceOutputReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentRate, setCurrentRate] = useState(1.0);
  const [currentVolume, setCurrentVolume] = useState(1.0);
  const [error, setError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(async (text: string, rate?: number, volume?: number) => {
    try {
      setError(null);
      
      // Stop any current speech
      if (utteranceRef.current) {
        speechSynthesis.cancel();
      }

      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
      
      // Configure voice settings
      utterance.rate = rate ?? currentRate;
      utterance.pitch = 1.0;
      utterance.volume = volume ?? currentVolume;
      
      // Find a good voice (prefer female, English)
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('zira') || voice.name.toLowerCase().includes('samantha'))
      ) || voices.find(voice => voice.lang.startsWith('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Set up event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      };
      
      utterance.onpause = () => {
        setIsPaused(true);
      };
      
      utterance.onresume = () => {
        setIsPaused(false);
      };
      
      utterance.onerror = (event) => {
        setError(`Speech synthesis error: ${event.error}`);
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      };

      // Start speaking
      speechSynthesis.speak(utterance);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to speak');
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [currentRate, currentVolume]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    utteranceRef.current = null;
  }, []);

  const pause = useCallback(() => {
    if (isSpeaking && !isPaused) {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (isSpeaking && isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isSpeaking, isPaused]);

  const setRate = useCallback((rate: number) => {
    setCurrentRate(rate);
    // If currently speaking, need to restart with new rate
    if (utteranceRef.current && isSpeaking) {
      const currentText = utteranceRef.current.text;
      stop();
      setTimeout(() => speak(currentText, rate), 100);
    }
  }, [isSpeaking, speak, stop]);

  const setVolume = useCallback((volume: number) => {
    setCurrentVolume(volume);
    // Volume can be changed on the fly
    if (utteranceRef.current) {
      utteranceRef.current.volume = volume;
    }
  }, []);

  return {
    isSpeaking,
    isPaused,
    currentRate,
    currentVolume,
    speak,
    stop,
    pause,
    resume,
    setRate,
    setVolume,
    error
  };
}
