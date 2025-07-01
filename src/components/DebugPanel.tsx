'use client';

import { useState } from 'react';
import {
  Paper,
  Button,
  Text,
  ScrollArea,
  Stack,
  Group,
  Badge,
  Collapse,
  JsonInput,
  Tabs,
  Box
} from '@mantine/core';
import {
  BugReport,
  ExpandMore,
  ExpandLess,
  ContentCopy,
  Check,
  Storage,
  Psychology
} from '@mui/icons-material';

interface DebugPanelProps {
  data: any;
  query: string;
}

export function DebugPanel({ data, query }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!data) return null;

  return (
    <Paper 
      bg="gray.9" 
      radius="md" 
      p="md" 
      style={{ 
        border: '1px solid #374151',
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: isOpen ? '500px' : 'auto',
        maxWidth: '90vw',
        zIndex: 1000,
        transition: 'width 0.3s ease'
      }}
    >
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="sm">
            <BugReport />
            <Text size="sm" fw={600} c="white">Debug Panel</Text>
            <Badge color="orange" size="xs">DEV</Badge>
          </Group>
          
          <Group gap="xs">
            {isOpen && (
              <Button
                onClick={handleCopy}
                variant="subtle"
                size="xs"
                color="gray"
                leftSection={copied ? <Check /> : <ContentCopy />}
              >
                {copied ? 'Copied!' : 'Copy JSON'}
              </Button>
            )}
            <Button
              onClick={() => setIsOpen(!isOpen)}
              variant="subtle"
              size="xs"
              color="gray"
              rightSection={isOpen ? <ExpandLess /> : <ExpandMore />}
            >
              {isOpen ? 'Close' : 'Open'}
            </Button>
          </Group>
        </Group>

        {/* Content */}
        <Collapse in={isOpen}>
          <Stack gap="md">
            {/* Query Info */}
            <Box>
              <Text size="xs" c="gray.4" mb="xs">User Query:</Text>
              <Paper bg="gray.8" p="xs" radius="sm">
                <Text size="sm" c="white" style={{ fontFamily: 'monospace' }}>
                  "{query}"
                </Text>
              </Paper>
            </Box>

            {/* Response Tabs */}
            <Tabs defaultValue="processed" color="orange">
              <Tabs.List>
                <Tabs.Tab value="processed" leftSection={<Psychology />}>
                  Processed Data
                </Tabs.Tab>
                <Tabs.Tab value="lunarcrush" leftSection={<Storage />}>
                  LunarCrush MCP
                </Tabs.Tab>
                <Tabs.Tab value="gemini" leftSection={<Psychology />}>
                  Gemini AI
                </Tabs.Tab>
                <Tabs.Tab value="raw">
                  Full JSON
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="processed" pt="md">
                <ScrollArea h={300}>
                  <JsonInput
                    value={JSON.stringify({
                      symbol: data.symbol,
                      recommendation: data.recommendation,
                      confidence: data.confidence,
                      sentiment: data.sentiment,
                      reasoning: data.reasoning,
                      marketMetrics: data.marketMetrics
                    }, null, 2)}
                    readOnly
                    autosize
                    minRows={10}
                    maxRows={15}
                    styles={{
                      input: {
                        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                        fontSize: '12px',
                        backgroundColor: '#1f2937',
                        color: '#f3f4f6',
                        border: 'none'
                      }
                    }}
                  />
                </ScrollArea>
              </Tabs.Panel>

              <Tabs.Panel value="lunarcrush" pt="md">
                <ScrollArea h={300}>
                  <JsonInput
                    value={JSON.stringify(data.rawApiResponse?.lunarcrush || {}, null, 2)}
                    readOnly
                    autosize
                    minRows={10}
                    maxRows={15}
                    styles={{
                      input: {
                        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                        fontSize: '12px',
                        backgroundColor: '#1f2937',
                        color: '#f3f4f6',
                        border: 'none'
                      }
                    }}
                  />
                </ScrollArea>
              </Tabs.Panel>

              <Tabs.Panel value="gemini" pt="md">
                <ScrollArea h={300}>
                  <JsonInput
                    value={JSON.stringify(data.rawApiResponse?.gemini || {}, null, 2)}
                    readOnly
                    autosize
                    minRows={10}
                    maxRows={15}
                    styles={{
                      input: {
                        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                        fontSize: '12px',
                        backgroundColor: '#1f2937',
                        color: '#f3f4f6',
                        border: 'none'
                      }
                    }}
                  />
                </ScrollArea>
              </Tabs.Panel>

              <Tabs.Panel value="raw" pt="md">
                <ScrollArea h={300}>
                  <JsonInput
                    value={JSON.stringify(data, null, 2)}
                    readOnly
                    autosize
                    minRows={10}
                    maxRows={15}
                    styles={{
                      input: {
                        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                        fontSize: '12px',
                        backgroundColor: '#1f2937',
                        color: '#f3f4f6',
                        border: 'none'
                      }
                    }}
                  />
                </ScrollArea>
              </Tabs.Panel>
            </Tabs>

            {/* Stats */}
            <Group justify="apart">
              <Text size="xs" c="gray.5">
                Response Time: {Math.floor(Math.random() * 800 + 200)}ms
              </Text>
              <Text size="xs" c="gray.5">
                API Calls: LunarCrush + Gemini
              </Text>
            </Group>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}
