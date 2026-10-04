import React, { useEffect, useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { Header } from "./components/Header.js";
import { Welcome } from "./screens/Welcome.js";
import { Chat } from "./screens/Chat.js";
import { Settings } from "./screens/Settings.js";
import { VocabReview } from "./screens/VocabReview.js";
import { Scenarios } from "./screens/Scenarios.js";
import { Progress } from "./screens/Progress.js";
import { hasApiKey, getSelectedModel } from "./services/llm.js";
import { createNewConversation, Conversation } from "./services/conversation.js";
import { getSetting, setSetting } from "./utils/db.js";

type Screen = "welcome" | "chat" | "settings" | "vocab" | "scenarios" | "progress";

// Simple mode: only Chat + Vocab for beginners (less overwhelming)
const SIMPLE_SCREENS: Screen[] = ["chat", "vocab"];
const ALL_SCREENS: Screen[] = ["chat", "vocab", "scenarios", "progress", "settings"];

const TOTAL_STEPS = 3;

const STEP_MAP: Record<Screen, { step: number; name: string }> = {
  welcome:  { step: 1, name: "Setup" },
  chat:     { step: 2, name: "Chat" },
  settings: { step: 2, name: "Settings" },
  vocab:    { step: 2, name: "Vocabulary" },
  scenarios:{ step: 2, name: "Scenarios" },
  progress: { step: 2, name: "Progress" },
};

export function App({
  initialLanguage,
  disableStream = false
}: AppProps) {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [language, setLanguage] = useState<string>(initialLanguage || "");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [error, setError] = useState<string>("");
  const [showHelp, setShowHelp] = useState(false);

  // Global keyboard shortcuts
  useInput((input, key) => {
    if (key.ctrl && key.shift && input === "h") {
      setShowHelp(!showHelp);
    }
    if (key.escape) {
      if (screen !== "chat" && screen !== "welcome") {
        setScreen("chat");
      }
    }
    if (key.ctrl && input === "1") setScreen("chat");
    if (key.ctrl && input === "2") setScreen("vocab");
    if (key.ctrl && input === "3") setScreen("scenarios");
    if (key.ctrl && input === "4") setScreen("progress");
    if (key.ctrl && input === "5") setScreen("settings");
  });

  // Check API key on mount
  useEffect(() => {
    if (!hasApiKey() && screen === "welcome") {
      // Stay on welcome to enter API key
    } else if (hasApiKey() && !language && screen === "welcome") {
      // Has key but no language - stay on welcome to pick language
    }
  }, []);

  const handleLanguageSelect = (lang: string) => {
    setLanguage(lang);
    setSetting("last_language", lang);
    if (hasApiKey()) {
      handleNewConversation(lang);
    }
  };

  const handleApiKeySubmit = (key: string) => {
    setSetting("nvidia_api_key", key.trim());
    if (language) {
      setScreen("chat");
    }
  };

  const handleNewConversation = (lang?: string) => {
    const useLanguage = lang || language;
    if (!useLanguage) return;
    const model = getSelectedModel();
    const personality = getSetting("personality") || "encouraging";
    const difficulty = getSetting("difficulty") || "A1";
    const newConv = createNewConversation(useLanguage, model, personality, difficulty);
    setConversation(newConv);
    setScreen("chat");
  };

  // Simple mode: only Chat + Vocab screens for beginners
  const [simpleMode, setSimpleMode] = useState(() => getSetting("simple_mode") === "true");
  const availableScreens = simpleMode ? SIMPLE_SCREENS : ALL_SCREENS;

  const handleNavigate = (newScreen: string) => {
    // In simple mode, only allow chat and vocab
    if (simpleMode && !SIMPLE_SCREENS.includes(newScreen as Screen)) {
      return;
    }
    setScreen(newScreen as Screen);
  };

  const { step, name: stepName } = STEP_MAP[screen];

  if (showHelp) {
    return (
      <Box flexDirection="column" padding={2}>
        <Header step={step} totalSteps={TOTAL_STEPS} stepName="Help" />
        <Box flexDirection="column" marginTop={1}>
          <Text bold>Keyboard Shortcuts</Text>
          <Text dimColor>──────────────────</Text>
          <Box marginTop={1}>
            <Text><Text color="cyan">Ctrl+1</Text>  Chat</Text>
            <Text><Text color="cyan">Ctrl+2</Text>  Vocabulary Review</Text>
            {!simpleMode && <Text><Text color="cyan">Ctrl+3</Text>  Scenarios</Text>}
            {!simpleMode && <Text><Text color="cyan">Ctrl+4</Text>  Progress</Text>}
            {!simpleMode && <Text><Text color="cyan">Ctrl+5</Text>  Settings</Text>}
            <Text><Text color="cyan">Esc</Text>     Back to Chat</Text>
            <Text><Text color="cyan">Ctrl+Shift+H</Text> Toggle Help</Text>
            <Text><Text color="cyan">Ctrl+C</Text>  Quit</Text>
            <Box marginTop={1}><Text dimColor>
              {simpleMode ? "Simple mode: only Chat + Vocab. Enable advanced in Settings → Data." : "Advanced mode: all features available."}
            </Text></Box>
          </Box>
          <Box marginTop={2}>
            <Text dimColor>Press Ctrl+Shift+H to close</Text>
          </Box>
        </Box>
      </Box>
    );
  }

  if (screen === "welcome") {
    return (
      <Welcome
        onLanguageSelect={handleLanguageSelect}
        onApiKeySubmit={handleApiKeySubmit}
        hasApiKey={hasApiKey()}
        selectedLanguage={language}
      />
    );
  }

  if (!conversation) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header step={step} totalSteps={TOTAL_STEPS} stepName={stepName} />
        <Text color="yellow">Creating new conversation...</Text>
      </Box>
    );
  }

  const renderScreen = () => {
    switch (screen) {
      case "chat":
        return (
          <Chat
            conversation={conversation}
            onNewConversation={handleNewConversation}
            onNavigate={handleNavigate}
            disableStream={disableStream}
          />
        );
      case "settings":
        return (
          <Settings
            currentLanguage={language}
            currentModel={getSelectedModel()}
            onNavigate={handleNavigate}
          />
        );
      case "vocab":
        return (
          <VocabReview
            language={language}
            onNavigate={handleNavigate}
          />
        );
      case "scenarios":
        return (
          <Scenarios
            language={language}
            conversation={conversation}
            onNavigate={handleNavigate}
          />
        );
      case "progress":
        return (
          <Progress
            language={language}
            onNavigate={handleNavigate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      {screen !== "chat" && (
        <Header step={step} totalSteps={TOTAL_STEPS} stepName={stepName} />
      )}
      {renderScreen()}
      <Box marginTop={1} paddingX={1}>
        <Text dimColor>Ctrl+Shift+H for shortcuts  |  Ctrl+1-5 to navigate  |  Esc for chat</Text>
      </Box>
    </Box>
  );
}

interface AppProps {
  initialLanguage?: string;
  initialConversation?: number;
  disableStream?: boolean;
}