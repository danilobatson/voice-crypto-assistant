import { NextRequest, NextResponse } from 'next/server';
import { PollyClient, SynthesizeSpeechCommand, VoiceId, Engine } from '@aws-sdk/client-polly';

export interface VoiceSynthesisRequest {
  text: string;
  voiceId?: VoiceId;
  engine?: Engine;
}

export async function POST(request: NextRequest) {
  try {
    const body: VoiceSynthesisRequest = await request.json();
    const { text, voiceId = VoiceId.Joanna, engine = Engine.NEURAL } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Check if AWS credentials are properly configured
    const hasValidCredentials = 
      process.env.AWS_ACCESS_KEY_ID && 
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_ACCESS_KEY_ID !== 'your_aws_access_key_here' &&
      process.env.AWS_SECRET_ACCESS_KEY !== 'your_aws_secret_key_here';

    if (!hasValidCredentials) {
      // Return demo response for tutorial purposes
      return NextResponse.json({
        success: false,
        useFallback: true,
        message: 'AWS Polly not configured - using browser speech synthesis fallback',
        text: text,
        voiceId: voiceId,
        engine: engine
      });
    }

    // Initialize AWS Polly client with real credentials
    const pollyClient = new PollyClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const command = new SynthesizeSpeechCommand({
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: voiceId,
      Engine: engine,
      TextType: 'text'
    });

    const response = await pollyClient.send(command);
    
    if (response.AudioStream) {
      // Handle Node.js stream properly
      const chunks: Buffer[] = [];
      
      // Convert AWS stream to Buffer
      for await (const chunk of response.AudioStream as any) {
        chunks.push(chunk);
      }
      
      const audioBuffer = Buffer.concat(chunks);
      const base64Audio = audioBuffer.toString('base64');
      const audioDataUrl = `data:audio/mp3;base64,${base64Audio}`;
      
      return NextResponse.json({
        success: true,
        audioUrl: audioDataUrl,
        voiceId: voiceId,
        engine: engine
      });
    }
    
    throw new Error('No audio stream received from AWS Polly');
    
  } catch (error) {
    console.error('AWS Polly synthesis error:', error);
    
    // Return fallback response on any AWS error
    return NextResponse.json({
      success: false,
      useFallback: true,
      message: 'AWS Polly error - using browser speech synthesis fallback',
      text: (await request.json()).text,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
