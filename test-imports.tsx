// Quick import test to verify all paths work
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { HeroSection } from '@/components/HeroSection';
import { Footer } from '@/components/Footer';
import theme from '@/lib/theme';

console.log('All imports successful:', {
	VoiceAssistant: !!VoiceAssistant,
	HeroSection: !!HeroSection,
	Footer: !!Footer,
	theme: !!theme,
});

export default function TestImports() {
	return null;
}
