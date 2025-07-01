'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Card, Stack, Text, Loader } from '@mantine/core';

// Dynamically import VoiceAssistant with no SSR
const VoiceAssistant = dynamic(
  () => import('./VoiceAssistant').then(mod => ({ default: mod.VoiceAssistant })),
  {
    ssr: false,
    loading: () => (
      <Card shadow="md" padding="lg" radius="md" withBorder>
        <Stack gap="md" align="center">
          <Text size="xl" fw={600}>Voice Crypto Assistant</Text>
          <Loader size="sm" />
          <Text size="sm" c="dimmed">Loading voice interface...</Text>
        </Stack>
      </Card>
    )
  }
);

export function VoiceAssistantWrapper() {
  return (
    <Suspense fallback={
      <Card shadow="md" padding="lg" radius="md" withBorder>
        <Stack gap="md" align="center">
          <Text size="xl" fw={600}>Voice Crypto Assistant</Text>
          <Loader size="sm" />
          <Text size="sm" c="dimmed">Loading...</Text>
        </Stack>
      </Card>
    }>
      <VoiceAssistant />
    </Suspense>
  );
}
