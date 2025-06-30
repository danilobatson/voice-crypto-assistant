import { VoiceTest } from '@/components/VoiceTest';

export default function Home() {
  return (
    <main className="container mx-auto p-8 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🎤 Voice Crypto Assistant
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Powered by Google Gemini AI, AWS Polly, and LunarCrush real-time social data
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Phase 2: AWS Polly Voice Synthesis Testing
        </p>
      </div>
      
      <VoiceTest />
      
      <div className="text-center mt-8 text-sm text-gray-500">
        <p>Built with Next.js 14, TypeScript, AWS Polly, Google Gemini, and LunarCrush MCP</p>
      </div>
    </main>
  );
}
