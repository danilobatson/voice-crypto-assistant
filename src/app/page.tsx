import { Container, Box } from '@mui/material';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { HeroSection } from '@/components/HeroSection';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <HeroSection />
      
      {/* Main Application */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <VoiceAssistant />
      </Container>
      
      {/* Footer */}
      <Footer />
    </Box>
  );
}
