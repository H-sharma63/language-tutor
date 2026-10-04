import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import { Header } from "../components/Header.js";
import { getSetting, setSetting } from "../utils/db.js";
import { getSelectedModel, setSelectedModel, getAvailableModels, hasApiKey, testConnection, getNvidiaApiKey } from "../services/llm.js";
import { PERSONALITIES, CEFR_LEVELS } from "../services/prompts.js";

interface SettingsProps {
  currentLanguage: string;
  currentModel: string;
  onNavigate: (screen: string) => void;
}

export function Settings({ currentLanguage, currentModel, onNavigate }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "learning" | "account" | "advanced">("chat");
  const [apiKey, setApiKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [simpleMode, setSimpleMode] = useState(() => getSetting("simple_mode") === "true");

  const tabs = ["chat", "learning", "account", "advanced"] as const;
  const currentPersonality = getSetting("personality") || "encouraging";
  const currentDifficulty = getSetting("difficulty") || "A1";
  const savedApiKey = getNvidiaApiKey() || "";

  useInput((input, key) => {
    if (key.leftArrow) {
      const idx = tabs.indexOf(activeTab);
      setActiveTab(tabs[(idx - 1 + tabs.length) % tabs.length]);
    }
    if (key.rightArrow) {
      const idx = tabs.indexOf(activeTab);
      setActiveTab(tabs[(idx + 1) % tabs.length]);
    }
    if (key.escape) {
      onNavigate("chat");
    }
    if (activeTab === "advanced" && input === "d") {
      handleClearData();
    }
  });

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
  };

  const handlePersonalitySelect = (persId: string) => {
    setSetting("personality", persId);
  };

  const handleDifficultySelect = (levelId: string) => {
    setSetting("difficulty", levelId);
  };

  const handleApiTest = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    setSetting("nvidia_api_key", apiKey.trim());
    const ok = await testConnection();
    setTesting(false);
    setTestResult(ok ? "success" : "error");
  };

  const handleApiSave = () => {
    if (apiKey.trim()) {
      setSetting("nvidia_api_key", apiKey.trim());
      setTestResult("success");
    }
  };

  const handleSimpleModeToggle = () => {
    const newMode = !simpleMode;
    setSimpleMode(newMode);
    setSetting("simple_mode", newMode.toString());
  };

  const handleClearData = async () => {
    if (confirmDelete) {
      const db = (await import("../utils/db.js")).db;
      db.exec(`
        DELETE FROM messages;
        DELETE FROM conversations;
        DELETE FROM vocabulary;
        DELETE FROM vocab_reviews;
        DELETE FROM progress;
      `);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const renderTabs = () => (
    <Box flexDirection="row" marginBottom={1} borderStyle="single" borderColor="dim">
      {tabs.map(tab => (
        <Box
          key={tab}
          flexDirection="row"
          paddingX={2}
          paddingY={1}
        >
          <Text color={activeTab === tab ? "cyan" : "white"}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </Box>
      ))}
    </Box>
  );

  const renderChat = () => {
    const models = getAvailableModels();
    const modelItems = models.map((m, i) => ({ label: `${m.name} (${m.speed})`, value: m.id }));
    return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold>🤖 AI Model</Text>
      <Box marginTop={1}><Text dimColor>Choose which AI model to use for conversations</Text></Box>
      <Box marginTop={1}>
        <SelectInput
          items={modelItems}
          initialIndex={models.findIndex(m => m.id === currentModel) || 0}
          onSelect={(item) => handleModelSelect(item.value)}
        />
      </Box>
      <Box marginTop={1}><Text dimColor>Current: {models.find(m => m.id === currentModel)?.name}</Text></Box>
      <Box marginTop={1}><Text dimColor>Fast models = quicker replies. Larger models = better quality.</Text></Box>
    </Box>
    );
  };

  const renderLearning = () => (
    <Box flexDirection="column" marginTop={1}>
      <Text bold>🎭 Tutor Personality</Text>
      <Box marginTop={1}><Text dimColor>How should your tutor behave?</Text></Box>
      <Box marginTop={1}>
        <SelectInput
          items={PERSONALITIES.map((p, i) => ({ label: `${p.name} - ${p.description}`, value: p.id }))}
          initialIndex={PERSONALITIES.findIndex(p => p.id === currentPersonality) || 0}
          onSelect={(item) => handlePersonalitySelect(item.value)}
        />
      </Box>
      <Box marginTop={1}><Text dimColor>{PERSONALITIES.find(p => p.id === currentPersonality)?.systemAddition}</Text></Box>

      <Box marginTop={2} flexDirection="column">
        <Text bold>📚 Difficulty Level (CEFR)</Text>
        <Box marginTop={1}><Text dimColor>Matches vocabulary and grammar to your level</Text></Box>
        <Box marginTop={1}>
          <SelectInput
            items={CEFR_LEVELS.map(l => ({ label: `${l.name} - ${l.description}`, value: l.id }))}
            initialIndex={CEFR_LEVELS.findIndex(l => l.id === currentDifficulty) || 0}
            onSelect={(item) => handleDifficultySelect(item.value)}
          />
        </Box>
      </Box>
    </Box>
  );

  const renderAccount = () => (
    <Box flexDirection="column" marginTop={1}>
      <Text bold>🔑 NVIDIA API Key</Text>
      <Box marginTop={1}><Text dimColor>Get a free key at https://build.nvidia.com — includes 8 models</Text></Box>
      <Box marginTop={1} flexDirection="row">
        <Text color="cyan">❯ </Text>
        <TextInput
          value={apiKey || savedApiKey}
          onChange={setApiKey}
          onSubmit={handleApiTest}
          placeholder="nvapi-xxxxxxxxxxxx"
          showCursor
        />
      </Box>
      <Box marginTop={1}>{testing && <Text color="yellow">Testing connection...</Text>}</Box>
      <Box marginTop={1}>{testResult === "success" && <Text color="green">✓ Connected! Key saved.</Text>}</Box>
      <Box marginTop={1}>{testResult === "error" && <Text color="red">✗ Failed. Check key and network.</Text>}</Box>
      <Box marginTop={1}><Text dimColor>Enter to test & save, or type and press Enter</Text></Box>
    </Box>
  );

  const renderAdvanced = () => (
    <Box flexDirection="column" marginTop={1}>
      <Box marginBottom={2} flexDirection="row" alignItems="center">
        <Text bold>🔧 Simple Mode</Text>
        <Box marginLeft={2} width={20} flexDirection="row">
          <Box
            flexDirection="row"
            paddingX={2}
            paddingY={1}
            borderStyle="round"
          >
            <Text color={simpleMode ? "black" : "white"}>
              {simpleMode ? "ON (Simple)" : "OFF (Advanced)"}
            </Text>
          </Box>
          <Box marginLeft={1}>
            <Text dimColor>
              {simpleMode ? "Shows only Chat + Vocab. Turn off for Scenarios, Progress, and more." : "Shows all features: Scenarios, Progress, Settings."}
            </Text>
          </Box>
        </Box>
      </Box>

      <Box marginTop={2}><Text dimColor>Simple Mode hides advanced features for a cleaner experience.</Text></Box>
      <Box><Text dimColor>Perfect for beginners who just want to chat and review words.</Text></Box>

      <Box marginTop={2} borderStyle="round" borderColor="red" padding={1}>
        <Text bold color="red">🗑️ Danger Zone</Text>
        <Box marginTop={1}><Text dimColor>All data stored locally in SQLite on your machine</Text></Box>
        <Box marginTop={2} flexDirection="column">
          <Text color="red" bold>
            {confirmDelete ? "Press again to confirm DELETE ALL DATA" : "Delete ALL conversations, vocabulary, progress"}
          </Text>
          <Text dimColor>This cannot be undone!</Text>
        </Box>
        <Box marginTop={1} flexDirection="row">
          <Text color={confirmDelete ? "red" : "white"}>
            {confirmDelete ? "⚠️  CONFIRM DELETE (Press D)" : "🗑️  Delete Everything (Press D)"}
          </Text>
        </Box>
      </Box>

      <Box marginTop={2}>
        <Text bold>📤 Export / Import Data</Text>
        <Box marginTop={1}><Text dimColor>Use Progress screen (Ctrl+4) for full JSON export/import</Text></Box>
      </Box>
    </Box>
  );

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" marginBottom={1}>
        <Text color="cyan" bold>←/→ </Text>
        <Text dimColor>Switch tabs  |  </Text>
        <Text color="cyan" bold>Esc </Text>
        <Text dimColor>Back to chat</Text>
      </Box>
      {renderTabs()}
      <Box flexGrow={1}>
        {activeTab === "chat" && renderChat()}
        {activeTab === "learning" && renderLearning()}
        {activeTab === "account" && renderAccount()}
        {activeTab === "advanced" && renderAdvanced()}
      </Box>
    </Box>
  );
}