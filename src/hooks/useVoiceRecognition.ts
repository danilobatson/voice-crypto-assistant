'use client';

import { useState, useEffect, useCallback } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface UseVoiceRecognitionReturn {
  transcript: string;
  isListening: boolean;
  isMicrophoneAvailable: boolean;
  isLoaded: boolean; // New: track if component is loaded client-side
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

export function useVoiceRecognition(onSpeechEnd?: (transcript: string) => void): UseVoiceRecognitionReturn {
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  // Mark as loaded on client side only
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Auto-process when speech ends
  useEffect(() => {
    if (!listening && transcript.trim() && onSpeechEnd && isLoaded) {
      onSpeechEnd(transcript);
    }
  }, [listening, transcript, onSpeechEnd, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return; // Don't check until client-side loaded
    
    if (!browserSupportsSpeechRecognition) {
      setError('Browser does not support speech recognition');
    } else if (!isMicrophoneAvailable) {
      setError('Microphone is not available');
    } else {
      setError(null);
    }
  }, [browserSupportsSpeechRecognition, isMicrophoneAvailable, isLoaded]);

  const startListening = useCallback(() => {
    if (!isLoaded) return;
    
    setError(null);
    resetTranscript();
    SpeechRecognition.startListening({
      continuous: false,
      language: 'en-US',
    });
  }, [resetTranscript, isLoaded]);

  const stopListening = useCallback(() => {
    if (!isLoaded) return;
    SpeechRecognition.stopListening();
  }, [isLoaded]);

  return {
    transcript,
    isListening: listening,
    isMicrophoneAvailable: isLoaded ? (isMicrophoneAvailable && browserSupportsSpeechRecognition) : false,
    isLoaded,
    startListening,
    stopListening,
    resetTranscript,
    error
  };
}
