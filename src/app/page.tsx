import { Container, Title, Text, Stack } from '@mantine/core';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Container size="lg" py="xl" style={{ flex: 1 }}>
        <Stack gap="xl" align="center">
          <div style={{ textAlign: 'center' }}>
            <Title 
              order={1} 
              size="h1" 
              style={{ 
                background: 'linear-gradient(135deg, #228be6 0%, #51cf66 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '1rem'
              }}
            >
              Voice Crypto Assistant
            </Title>
            <Text size="xl" c="dimmed" maw={700} mx="auto">
              Powered by Google Gemini AI, LunarCrush real-time social data, and modern browser speech APIs
            </Text>
          </div>
          
          <VoiceAssistant />
        </Stack>
      </Container>
      
      <Footer />
    </div>
  );
}
