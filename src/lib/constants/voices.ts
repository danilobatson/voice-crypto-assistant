import { VoiceId } from '@aws-sdk/client-polly';

// Available voices for the UI
export const AVAILABLE_VOICES = [
  { id: VoiceId.Joanna, name: 'Joanna (Female, US)', gender: 'Female' },
  { id: VoiceId.Matthew, name: 'Matthew (Male, US)', gender: 'Male' },
  { id: VoiceId.Amy, name: 'Amy (Female, UK)', gender: 'Female' },
  { id: VoiceId.Brian, name: 'Brian (Male, UK)', gender: 'Male' },
] as const;

export type VoiceOption = typeof AVAILABLE_VOICES[number];
