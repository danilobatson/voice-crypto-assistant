'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface UseVoiceRecognitionReturn {
  transcript: string;
  isListening: boolean;
  isMicrophoneAvailable: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

export function useVoiceRecognition(): UseVoiceRecognitionReturn {
  const [error, setError] = useState<string | null>(null);
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      setError('Browser does not support speech recognition. Please use Chrome, Safari, or Edge.');
    } else if (!isMicrophoneAvailable) {
      setError('Microphone is not available. Please check your permissions.');
    } else {
      setError(null);
    }
  }, [browserSupportsSpeechRecognition, isMicrophoneAvailable]);

  const startListening = useCallback(() => {
    setError(null);
    
    if (!browserSupportsSpeechRecognition) {
      setError('Speech recognition is not supported in this browser');
      return;
    }
    
    SpeechRecognition.startListening({
      continuous: true, // Keep listening for continuous speech
      language: 'en-US',
      interimResults: true, // Show interim results
    });
  }, [browserSupportsSpeechRecognition]);

  const stopListening = useCallback(() => {
    SpeechRecognition.stopListening();
  }, []);

  return {
    transcript,
    isListening: listening,
    isMicrophoneAvailable: isMicrophoneAvailable && browserSupportsSpeechRecognition,
    startListening,
    stopListening,
    resetTranscript,
    error
  };
}
