import React from "react";
import { Box, Text } from "ink";

interface MessageBubbleProps {
  message: { role: string; content: string };
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  if (isUser) {
    return (
      <Box marginBottom={1} flexDirection="row-reverse">
        <Box
          flexDirection="column"
          width="85%"
          padding={1}
          borderStyle="round"
        >
          <Box flexDirection="row" alignItems="center" marginBottom={1}>
            <Text color="white" bold>You</Text>
            {isStreaming && <Box marginLeft={1}><Text color="yellow">▌</Text></Box>}
          </Box>
          <Text color="white" wrap="wrap">{message.content}</Text>
        </Box>
      </Box>
    );
  }

  if (isAssistant) {
    return (
      <Box marginBottom={1} flexDirection="row">
        <Box
          flexDirection="column"
          width="85%"
          padding={1}
          borderStyle="round"
        >
          <Box flexDirection="row" alignItems="center" marginBottom={1}>
            <Text color="green" bold>🤖 Tutor</Text>
            {isStreaming && <Box marginLeft={1}><Text color="yellow">▌</Text></Box>}
          </Box>
          <Text color="white" wrap="wrap">{message.content}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box marginBottom={1} padding={1} borderStyle="single" borderColor="dim">
      <Text dimColor>{message.role}: {message.content}</Text>
    </Box>
  );
}