'use client';

import { useState, useCallback } from 'react';

interface UseVoiceOutputReturn {
  isSpeaking: boolean;
  speak: (text: string, options?: { voiceId?: string }) => Promise<void>;
  stop: () => void;
  error: string | null;
}

export function useVoiceOutput(): UseVoiceOutputReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const speak = useCallback(async (text: string, options?: { voiceId?: string }) => {
    try {
      setError(null);
      setIsSpeaking(true);

      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.remove();
      }

      // Try AWS Polly first
      const response = await fetch('/api/voice-synthesis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceId: options?.voiceId || 'Joanna'
        })
      });

      const data = await response.json();

      if (data.success && data.audioUrl) {
        // Use AWS Polly audio
        const audio = new Audio(data.audioUrl);
        setCurrentAudio(audio);

        audio.onended = () => {
          setIsSpeaking(false);
          setCurrentAudio(null);
        };

        audio.onerror = () => {
          setError('Failed to play AWS Polly audio');
          setIsSpeaking(false);
          setCurrentAudio(null);
        };

        await audio.play();
        
      } else if (data.useFallback) {
        // Fallback to browser Speech Synthesis
        console.log('Using browser speech synthesis fallback');
        
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          
          utterance.onend = () => {
            setIsSpeaking(false);
          };
          
          utterance.onerror = () => {
            setError('Browser speech synthesis failed');
            setIsSpeaking(false);
          };

          window.speechSynthesis.speak(utterance);
        } else {
          throw new Error('Speech synthesis not supported in this browser');
        }
      } else {
        throw new Error(data.error || 'Voice synthesis failed');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to synthesize speech');
      setIsSpeaking(false);
    }
  }, [currentAudio]);

  const stop = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.remove();
      setCurrentAudio(null);
    }
    
    // Stop browser speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
  }, [currentAudio]);

  return {
    isSpeaking,
    speak,
    stop,
    error
  };
}
