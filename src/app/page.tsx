import { APITestComponent } from '@/components/APITestComponent';

export default function Home() {
  return (
    <div className="container">
      <h1 className="title">Voice Crypto Assistant</h1>
      <p className="subtitle">
        Testing API Connection to LunarCrush MCP + Google Gemini
      </p>
      
      <APITestComponent />
      
      <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: '#6c757d' }}>
        Built with Next.js, TypeScript, Google Gemini, and LunarCrush MCP
      </div>
    </div>
  );
}
