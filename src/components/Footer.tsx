'use client';

import {
  Container,
  Group,
  Stack,
  Text,
  Anchor,
  Divider,
  Badge,
  Button,
  Box
} from '@mantine/core';
import {
  IconBrandGithub,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconWorld,
  IconRocket,
  IconBrain,
  IconMicrophone,
  IconChartLine
} from '@tabler/icons-react';

export function Footer() {
  return (
    <Box bg="gray.9" c="white" py="xl" mt="auto">
      <Container size="lg">
        <Stack gap="xl">
          {/* Main Footer Content */}
          <Group justify="space-between" align="flex-start" wrap="wrap">
            {/* Brand Section */}
            <Stack gap="md" style={{ flex: '1 1 300px' }}>
              <Group gap="sm">
                <IconMicrophone size={24} color="#228be6" />
                <Text size="xl" fw={700}>Voice Crypto Assistant</Text>
              </Group>
              <Text size="sm" c="gray.4" maw={300}>
                AI-powered voice crypto analysis using real-time social sentiment data from LunarCrush MCP and Google Gemini AI.
              </Text>
              <Group gap="sm">
                <Badge color="blue" variant="light" leftSection={<IconBrain size={12} />}>
                  AI Powered
                </Badge>
                <Badge color="green" variant="light" leftSection={<IconChartLine size={12} />}>
                  Real-time Data
                </Badge>
                <Badge color="orange" variant="light" leftSection={<IconMicrophone size={12} />}>
                  Voice UI
                </Badge>
              </Group>
            </Stack>

            {/* Links Section */}
            <Stack gap="md" style={{ flex: '1 1 200px' }}>
              <Text size="sm" fw={600} c="white">Resources</Text>
              <Stack gap="xs">
                <Anchor href="https://lunarcrush.com/developers/api" target="_blank" c="gray.4" size="sm">
                  LunarCrush API
                </Anchor>
                <Anchor href="https://ai.google.dev/" target="_blank" c="gray.4" size="sm">
                  Google Gemini AI
                </Anchor>
                <Anchor href="https://docs.anthropic.com/en/docs/build-with-claude/mcp" target="_blank" c="gray.4" size="sm">
                  Model Context Protocol
                </Anchor>
                <Anchor href="https://mantine.dev/" target="_blank" c="gray.4" size="sm">
                  Mantine UI
                </Anchor>
              </Stack>
            </Stack>

            {/* Tech Stack */}
            <Stack gap="md" style={{ flex: '1 1 200px' }}>
              <Text size="sm" fw={600} c="white">Built With</Text>
              <Stack gap="xs">
                <Text size="sm" c="gray.4">Next.js 14 + TypeScript</Text>
                <Text size="sm" c="gray.4">LunarCrush MCP</Text>
                <Text size="sm" c="gray.4">Google Gemini AI</Text>
                <Text size="sm" c="gray.4">Mantine UI</Text>
                <Text size="sm" c="gray.4">Browser Speech APIs</Text>
              </Stack>
            </Stack>

            {/* Call to Action */}
            <Stack gap="md" style={{ flex: '1 1 200px' }}>
              <Text size="sm" fw={600} c="white">Get Started</Text>
              <Button
                component="a"
                href="https://lunarcrush.com/developers"
                target="_blank"
                color="blue"
                leftSection={<IconRocket size={16} />}
                size="sm"
              >
                Try LunarCrush API
              </Button>
              <Group gap="xs">
                <Button
                  component="a"
                  href="https://github.com/danilobatson"
                  target="_blank"
                  variant="subtle"
                  color="gray"
                  size="xs"
                  leftSection={<IconBrandGithub size={16} />}
                >
                  GitHub
                </Button>
                <Button
                  component="a"
                  href="https://danilobatson.github.io"
                  target="_blank"
                  variant="subtle"
                  color="gray"
                  size="xs"
                  leftSection={<IconWorld size={16} />}
                >
                  Portfolio
                </Button>
              </Group>
            </Stack>
          </Group>

          <Divider color="gray.7" />

          {/* Bottom Section */}
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="lg">
              <Text size="xs" c="gray.5">
                © 2025 Voice Crypto Assistant. Built for learning and portfolio demonstration.
              </Text>
              <Group gap="sm">
                <Text size="xs" c="gray.6">Powered by:</Text>
                <Anchor href="https://lunarcrush.com" target="_blank" size="xs" c="blue.4">
                  LunarCrush
                </Anchor>
                <Text size="xs" c="gray.6">•</Text>
                <Anchor href="https://ai.google.dev" target="_blank" size="xs" c="blue.4">
                  Google AI
                </Anchor>
              </Group>
            </Group>

            <Group gap="sm">
              <Anchor href="https://github.com/danilobatson" target="_blank" c="gray.5">
                <IconBrandGithub size={18} />
              </Anchor>
              <Anchor href="https://linkedin.com/in/danilo-batson" target="_blank" c="gray.5">
                <IconBrandLinkedin size={18} />
              </Anchor>
              <Text size="xs" c="gray.6">
                Built by{' '}
                <Anchor href="https://danilobatson.github.io" target="_blank" c="blue.4">
                  Danilo Batson
                </Anchor>
              </Text>
            </Group>
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}
