'use client';

import { useState } from 'react';
import { 
  Button, 
  Card, 
  TextInput, 
  Text, 
  Group,
  Alert,
  Loader
} from '@mantine/core';
import { useVoiceOutput } from '@/hooks/useVoiceOutput';
import { IconVolume, IconVolumeOff } from '@tabler/icons-react';

export function VoiceTest() {
  const [testText, setTestText] = useState('Hello! This is a test of browser voice synthesis.');
  const { isSpeaking, speak, stop, error } = useVoiceOutput();

  const handleSpeak = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(testText);
    }
  };

  return (
    <Card 
      shadow="md" 
      padding="xl" 
      radius="md" 
      style={{ maxWidth: '500px', margin: '0 auto' }}
    >
      <Text size="xl" fw={600} mb="md" ta="center">
        Voice Test (Browser Speech)
      </Text>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <TextInput
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          placeholder="Enter text to speak..."
          size="md"
        />
        
        <Button 
          onClick={handleSpeak}
          disabled={!testText.trim()}
          size="md"
          leftSection={isSpeaking ? <IconVolumeOff size={18} /> : <IconVolume size={18} />}
          color={isSpeaking ? "red" : "blue"}
          variant={isSpeaking ? "filled" : "filled"}
        >
          {isSpeaking ? 'Stop Speaking' : 'Test Voice'}
        </Button>
        
        {error && (
          <Alert color="red" variant="light">
            <Text size="sm">{error}</Text>
          </Alert>
        )}
        
        {isSpeaking && (
          <Group justify="center">
            <Loader color="blue" size="sm" />
            <Text size="sm" c="blue">🔊 Speaking...</Text>
          </Group>
        )}
      </div>
    </Card>
  );
}
