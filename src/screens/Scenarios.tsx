import React, { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { Header } from "../components/Header.js";
import { createNewConversation, Conversation } from "../services/conversation.js";
import { buildSystemPrompt } from "../services/prompts.js";
import { getSelectedModel } from "../services/llm.js";
import { getSetting } from "../utils/db.js";

interface ScenariosProps {
  language: string;
  conversation: Conversation | null;
  onNavigate: (screen: string) => void;
}

const SCENARIOS = [
  {
    id: "restaurant",
    name: "🍽️ Restaurant",
    description: "Order food, ask for recommendations, handle dietary restrictions",
    systemAddition: "Roleplay as a waiter/restaurant staff. Help the user practice ordering, asking about menu items, making special requests, and paying the bill. Correct food-related vocabulary.",
  },
  {
    id: "travel",
    name: "✈️ Travel & Directions",
    description: "Ask for directions, book tickets, handle transportation",
    systemAddition: "Roleplay as locals, ticket agents, taxi drivers, hotel staff. Help with directions, buying tickets, checking in, asking about schedules, and navigation phrases.",
  },
  {
    id: "interview",
    name: "💼 Job Interview",
    description: "Practice professional introductions, experience, strengths",
    systemAddition: "Roleplay as an interviewer. Ask standard interview questions (Tell me about yourself, strengths/weaknesses, why this company, behavioral questions). Give feedback on professional language.",
  },
  {
    id: "casual",
    name: "☕ Casual Coffee Chat",
    description: "Small talk, hobbies, weekend plans, making friends",
    systemAddition: "Roleplay as a friendly local at a cafe. Chat about hobbies, weekend plans, weather, recommendations, cultural topics. Keep it light and natural. Correct casually.",
  },
  {
    id: "shopping",
    name: "🛍️ Shopping & Market",
    description: "Buy clothes, negotiate prices, ask for sizes",
    systemAddition: "Roleplay as a shopkeeper/market vendor. Practice asking for sizes, colors, prices, negotiating, returns, and payment. Include numbers, clothing vocab, polite requests.",
  },
  {
    id: "doctor",
    name: "🏥 Doctor Visit",
    description: "Describe symptoms, understand diagnosis, pharmacy",
    systemAddition: "Roleplay as a doctor/pharmacist. Help user describe symptoms, understand medical advice, ask about medications, dosages, side effects. Use clear, simple medical vocabulary.",
  },
  {
    id: "emergency",
    name: "🚨 Emergency Situations",
    description: "Lost items, accidents, police, embassy",
    systemAddition: "Roleplay as police, embassy staff, emergency services. Practice reporting lost items, describing locations, giving personal info, asking for help. Formal, clear language.",
  },
  {
    id: "custom",
    name: "✨ Custom Scenario",
    description: "Create your own practice situation",
    systemAddition: "",
  },
];

export function Scenarios({ language, conversation, onNavigate }: ScenariosProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showCustom, setShowCustom] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const startScenario = useCallback((scenario: typeof SCENARIOS[0]) => {
    const model = getSelectedModel();
    const personality = getSetting("personality") || "encouraging";
    const difficulty = getSetting("difficulty") || "A1";

    const newConv = createNewConversation(language, model, personality, difficulty);

    // Add scenario-specific system message
    const basePrompt = buildSystemPrompt(language, personality, difficulty);
    const scenarioPrompt = `${basePrompt}\n\n=== SCENARIO: ${scenario.name} ===\n${scenario.systemAddition}\n\nStart the scenario naturally. Set the scene and wait for the user to respond.`;

    // Update conversation with scenario context (store in a way we can retrieve)
    // For now, we'll just start the chat with this context

    onNavigate("chat");
  }, [language, onNavigate]);

  const handleCustomStart = () => {
    if (!customPrompt.trim()) return;
    const model = getSelectedModel();
    const personality = getSetting("personality") || "encouraging";
    const difficulty = getSetting("difficulty") || "A1";

    const newConv = createNewConversation(language, model, personality, difficulty);

    const basePrompt = buildSystemPrompt(language, personality, difficulty);
    const customSystemAddition = `Roleplay this custom scenario: ${customPrompt}. Act as the appropriate character(s). Guide the conversation naturally.`;

    onNavigate("chat");
  };

  useInput((input, key) => {
    if (key.escape) {
      if (showCustom) setShowCustom(false);
      else onNavigate("chat");
    }
    if (key.upArrow) {
      setSelectedIndex(prev => (prev - 1 + SCENARIOS.length) % SCENARIOS.length);
    }
    if (key.downArrow) {
      setSelectedIndex(prev => (prev + 1) % SCENARIOS.length);
    }
    if (key.return) {
      if (showCustom) {
        handleCustomStart();
      } else {
        startScenario(SCENARIOS[selectedIndex]);
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Header step={2} totalSteps={3} stepName="Scenarios" />

      <Box marginTop={1} flexDirection="column">
        <Text bold>Practice Real-Life Situations</Text>
        <Box marginTop={1}>
          <Text dimColor>Choose a scenario to roleplay with your AI tutor</Text>
        </Box>
      </Box>

      {showCustom ? (
        <Box marginTop={2} flexDirection="column">
          <Text bold>Custom Scenario</Text>
          <Box marginTop={1}>
            <Text dimColor>Describe the situation you want to practice</Text>
          </Box>
          <Box marginTop={1} flexDirection="column">
            <Text bold>Scenario:</Text>
            <Box marginTop={1} flexDirection="row">
              <Text color="cyan">❯ </Text>
              <TextInput
                value={customPrompt}
                onChange={setCustomPrompt}
                onSubmit={handleCustomStart}
                placeholder="e.g., Negotiating a rent increase with my landlord in Berlin"
                showCursor
              />
            </Box>
            <Box marginTop={1}>
              <Text dimColor>Enter to start, Esc to cancel</Text>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box marginTop={1} flexDirection="column">
          {SCENARIOS.map((scenario, idx) => (
            <Box
              key={scenario.id}
              flexDirection="column"
              marginBottom={1}
              padding={1}
              borderStyle={idx === selectedIndex ? "round" : "single"}
              borderColor={idx === selectedIndex ? "cyan" : "dim"}
            >
              <Box flexDirection="row" alignItems="center">
                <Text bold color={idx === selectedIndex ? "white" : "white"}>
                  {idx === selectedIndex ? "▶ " : "  "}{scenario.name}
                </Text>
              </Box>
              <Box marginTop={1}>
                <Text dimColor color={idx === selectedIndex ? "white" : "dim"}>
                  {scenario.description}
                </Text>
              </Box>
            </Box>
          ))}

          <Box marginTop={1} padding={1} borderStyle="single" borderColor="green">
            <Box flexDirection="row" alignItems="center">
              <Text color="green" bold>✨ Custom Scenario</Text>
              <Box marginLeft={2}>
                <Text dimColor>Create your own practice situation</Text>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      <Box marginTop={2} flexDirection="row">
        <Text color="cyan">↑/↓</Text><Text dimColor> Navigate  </Text>
        <Text color="cyan">Enter</Text><Text dimColor> Start  </Text>
        <Text color="cyan">Esc</Text><Text dimColor> Back to chat</Text>
      </Box>
    </Box>
  );
}