import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Mantine imports
import { MantineProvider, ColorSchemeScript, MantineThemeOverride } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Voice Crypto Assistant - AI-Powered Crypto Analysis',
  description: 'AI-powered voice crypto analysis with real-time social sentiment data from LunarCrush and Google Gemini AI',
  keywords: ['crypto', 'AI', 'voice', 'sentiment', 'LunarCrush', 'Gemini', 'MCP'],
  authors: [{ name: 'Danilo Batson', url: 'https://danilobatson.github.io' }],
  openGraph: {
    title: 'Voice Crypto Assistant',
    description: 'AI-powered voice crypto analysis with real-time social sentiment',
    type: 'website',
  },
};

// Mantine theme configuration with proper typing
const theme: MantineThemeOverride = {
  primaryColor: 'blue',
  defaultRadius: 'md',
  colors: {
    // Custom crypto-themed colors (properly typed as tuple)
    crypto: [
      '#e3f2fd',
      '#bbdefb', 
      '#90caf9',
      '#64b5f6',
      '#42a5f5',
      '#2196f3', // Main crypto blue
      '#1e88e5',
      '#1976d2',
      '#1565c0',
      '#0d47a1'
    ] as const,
    voice: [
      '#fff3e0',
      '#ffe0b2',
      '#ffcc02',
      '#ffb74d',
      '#ffa726',
      '#ff9800', // Main voice orange
      '#fb8c00',
      '#f57c00',
      '#ef6c00',
      '#e65100'
    ] as const
  },
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
      },
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body className={inter.className}>
        <MantineProvider theme={theme}>
          <Notifications position="top-right" />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
