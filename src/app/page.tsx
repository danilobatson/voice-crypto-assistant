import { VoiceAPITest } from '@/components/VoiceAPITest';

export default function Home() {
  return (
    <div className="container">
      <h1 className="title">🎤 Voice Crypto Assistant</h1>
      <p className="subtitle">
        AI-powered cryptocurrency analysis with voice interface
        <br />
        Powered by Google Gemini AI and LunarCrush real-time data
      </p>
      
      <VoiceAPITest />
      
      <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: '#6c757d' }}>
        Built with Next.js, TypeScript, Google Gemini, and LunarCrush MCP
      </div>
    </div>
  );
}
