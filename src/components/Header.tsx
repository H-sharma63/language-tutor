import React from "react";
import { Box, Text } from "ink";

interface HeaderProps {
  step: number;
  totalSteps: number;
  stepName: string;
}

export function Header({ step, totalSteps, stepName }: HeaderProps) {
  return (
    <Box flexDirection="column" marginBottom={1} borderStyle="single" borderColor="dim" padding={1}>
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <Box flexDirection="row" alignItems="center">
          <Text bold color="cyan">🗣️  Language Tutor</Text>
          <Box marginLeft={2}>
            <Text dimColor>v0.1.0</Text>
          </Box>
        </Box>
        <Box flexDirection="row" alignItems="center">
          <Text dimColor>Step {step}/{totalSteps}: </Text>
          <Text bold>{stepName}</Text>
        </Box>
      </Box>
    </Box>
  );
}