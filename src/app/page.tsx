import { VoiceAssistant } from '@/components/VoiceAssistant';

export default function Home() {
  return (
    <main className="container mx-auto p-8 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Voice Crypto Assistant
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Powered by LunarCrush MCP, Google Gemini AI, and AWS Polly
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Say "What's the sentiment on Bitcoin?" to get started
        </p>
      </div>
      
      <VoiceAssistant />
      
      <div className="text-center mt-8 text-sm text-gray-500">
        <p>Built with Next.js, TypeScript, LunarCrush MCP, Google Gemini, and AWS Polly</p>
      </div>
    </main>
  );
}
