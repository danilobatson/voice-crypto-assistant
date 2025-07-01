import { VoiceAssistant } from '@/components/VoiceAssistant';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <VoiceAssistant />
      <Footer />
    </div>
  );
}
