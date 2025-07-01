import { useState, useCallback } from 'react';

interface UseVoiceOutputReturn {
  isSpeaking: boolean;
  speak: (text: string, options?: { voice?: string; rate?: number; pitch?: number }) => Promise<void>;
  stop: () => void;
  error: string | null;
}

export function useVoiceOutput(): UseVoiceOutputReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [error, setError] = useState<string | null>(null);

  const speak = useCallback(async (text: string, options?: { voice?: string; rate?: number; pitch?: number }) => {
    try {
      setError(null);
      
      // Check if speech synthesis is supported
      if (!window.speechSynthesis) {
        throw new Error('Speech synthesis not supported');
      }

      // Stop any currently speaking utterance
      if (currentUtterance) {
        window.speechSynthesis.cancel();
      }

      setIsSpeaking(true);

      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice options
      utterance.rate = options?.rate || 1;
      utterance.pitch = options?.pitch || 1;
      utterance.volume = 1;
      
      // Try to set a good voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Prefer English voices
        const englishVoice = voices.find(voice => 
          voice.lang.startsWith('en') && voice.name.includes('Google')
        ) || voices.find(voice => voice.lang.startsWith('en'));
        
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }

      setCurrentUtterance(utterance);

      // Set up event handlers
      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentUtterance(null);
      };

      utterance.onerror = (event) => {
        setError(`Speech synthesis error: ${event.error}`);
        setIsSpeaking(false);
        setCurrentUtterance(null);
      };

      // Speak the utterance
      window.speechSynthesis.speak(utterance);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to synthesize speech');
      setIsSpeaking(false);
    }
  }, [currentUtterance]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setCurrentUtterance(null);
  }, []);

  return {
    isSpeaking,
    speak,
    stop,
    error
  };
}
