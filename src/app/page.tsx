'use client';

import 'regenerator-runtime/runtime';
import { useRef } from 'react';
import { Container, Box } from '@mui/material';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { HeroSection } from '@/components/HeroSection';
import { Footer } from '@/components/Footer';

export default function Home() {
  const voiceAssistantRef = useRef<{ startVoiceInput: () => void }>(null);

  const handleStartVoiceFromHero = () => {
    // Trigger voice input from the VoiceAssistant component
    if (voiceAssistantRef.current) {
      voiceAssistantRef.current.startVoiceInput();
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section with voice trigger */}
      <HeroSection onStartVoiceInput={handleStartVoiceFromHero} />
      
      {/* Main Application */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <VoiceAssistant ref={voiceAssistantRef} />
      </Container>
      
      {/* Footer */}
      <Footer />
    </Box>
  );
}
