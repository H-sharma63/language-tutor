import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import { getSetting, setSetting } from "../utils/db.js";
import { hasApiKey, testConnection } from "../services/llm.js";

interface WelcomeProps {
  onLanguageSelect: (lang: string) => void;
  onApiKeySubmit: (key: string) => void;
  hasApiKey: boolean;
  selectedLanguage: string;
}

const LANGUAGES = [
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italian", native: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹" },
  { code: "ja", name: "Japanese", native: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", native: "한국어", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", native: "中文", flag: "🇨🇳" },
  { code: "ru", name: "Russian", native: "Русский", flag: "🇷🇺" },
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "tr", name: "Turkish", native: "Türkçe", flag: "🇹🇷" },
  { code: "nl", name: "Dutch", native: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polish", native: "Polski", flag: "🇵🇱" },
  { code: "sv", name: "Swedish", native: "Svenska", flag: "🇸🇪" },
];

export function Welcome({
  onLanguageSelect,
  onApiKeySubmit,
  hasApiKey,
  selectedLanguage
}: WelcomeProps) {
  const [step, setStep] = useState<"language" | "api" | "ready">(
    hasApiKey && selectedLanguage ? "ready" : hasApiKey ? "language" : "api"
  );

  // Update step when props change
  useEffect(() => {
    if (hasApiKey && selectedLanguage) {
      setStep("ready");
    } else if (hasApiKey) {
      setStep("language");
    } else {
      setStep("api");
    }
  }, [hasApiKey, selectedLanguage]);
  const [apiKey, setApiKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [languageIndex, setLanguageIndex] = useState(0);

  // Initialize language index from saved preference
  useEffect(() => {
    const lastLang = getSetting("last_language");
    if (lastLang) {
      const idx = LANGUAGES.findIndex(l => l.code === lastLang);
      if (idx >= 0) setLanguageIndex(idx);
    }
  }, []);

  // Handle Enter key for language selection
  useInput((input, key) => {
    if (step === "language" && key.return) {
      const lang = LANGUAGES[languageIndex];
      if (lang) onLanguageSelect(lang.code);
    }
    if (step === "language" && (input === "b" || input === "B")) {
      setStep("api");
    }
    if (step === "ready" && key.return) {
      // Transition to chat screen
      onLanguageSelect(selectedLanguage);
    }
  });

  const handleApiSubmit = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    onApiKeySubmit(apiKey.trim());
    const ok = await testConnection();
    setTesting(false);
    setTestResult(ok ? "success" : "error");
    if (ok) setStep("language");
  };

  const renderStepIndicator = () => (
    <Box flexDirection="row" marginBottom={2} marginTop={1}>
      <Box flexDirection="row">
        {[
          { id: "api", label: "1. Add API Key" },
          { id: "language", label: "2. Pick Language" },
          { id: "ready", label: "3. Start Chatting" }
        ].map((s, i) => (
          <Box key={s.id} flexDirection="row" marginRight={3} alignItems="center">
            <Box
              width={2}
              height={2}
              borderStyle="round"
              borderColor={step === s.id ? "cyan" : i < (step === "ready" ? 3 : step === "language" ? 1 : 0) ? "green" : "dim"}
              alignItems="center"
            >
              <Box>
                <Text color={step === s.id ? "black" : i < (step === "ready" ? 3 : step === "language" ? 1 : 0) ? "white" : "dim"} bold>
                  {i + 1}
                </Text>
              </Box>
            </Box>
            <Box marginLeft={1}>
              <Text color={step === s.id ? "cyan" : i < (step === "ready" ? 3 : step === "language" ? 1 : 0) ? "green" : "dim"} bold>
                {s.label}
              </Text>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );

  if (step === "ready") {
    return (
      <Box flexDirection="column" padding={1}>
        {renderStepIndicator()}
        <Box flexDirection="column" marginTop={2} alignItems="center">
          <Box><Text bold color="green">✓ Ready to go!</Text></Box>
          <Box marginTop={1}><Text>Press <Text color="cyan" bold>Enter</Text> to start chatting</Text></Box>
          <Box marginTop={1}><Text dimColor>Your language: <Text bold>{LANGUAGES.find(l => l.code === selectedLanguage)?.name}</Text></Text></Box>
        </Box>
      </Box>
    );
  }

  if (step === "api") {
    return (
      <Box flexDirection="column" padding={1}>
        {renderStepIndicator()}

        <Box marginTop={1} flexDirection="column" alignItems="center">
          <Box><Text bold>🗣️  Language Tutor</Text></Box>
          <Box marginTop={1}><Text dimColor>Practice any language with AI — 100% private, runs in your terminal</Text></Box>
        </Box>

        <Box marginTop={2} flexDirection="column">
          <Box><Text bold>Step 1 of 2: Get your free API key</Text></Box>
          <Box marginTop={1}><Text dimColor>1. Open {"https://build.nvidia.com"} in your browser</Text></Box>
          <Box><Text dimColor>2. Sign in (Google/GitHub/Email) — it's free</Text></Box>
          <Box><Text dimColor>3. Click "Get API Key" and copy it</Text></Box>
          <Box><Text dimColor>4. Paste it below and press Enter</Text></Box>
        </Box>

        <Box marginTop={1} flexDirection="row">
          <Box><Text color="cyan">❯ </Text></Box>
          <TextInput
            value={apiKey}
            onChange={setApiKey}
            onSubmit={handleApiSubmit}
            placeholder="nvapi-xxxxxxxxxxxx (paste your key here)"
            showCursor
          />
        </Box>

        {testing && <Box marginTop={1}><Text color="yellow">Testing connection...</Text></Box>}
        {testResult === "success" && <Box marginTop={1}><Text color="green">✓ Connected! Press Enter to continue.</Text></Box>}
        {testResult === "error" && <Box marginTop={1}><Text color="red">✗ Failed. Check your key and try again.</Text></Box>}

        <Box marginTop={2}><Text dimColor>Your key is saved locally. Only used for AI responses — conversations stay on your machine.</Text></Box>
      </Box>
    );
  }

  // Step: language selection
  return (
    <Box flexDirection="column" padding={1}>
      {renderStepIndicator()}

      <Box marginTop={1} flexDirection="column" alignItems="center">
        <Box><Text bold>🗣️  Language Tutor</Text></Box>
        <Box marginTop={1}><Text dimColor>Your API key is saved. Now pick a language to practice.</Text></Box>
      </Box>

      <Box marginTop={2} flexDirection="column">
        <Box><Text bold>Step 2 of 2: Choose your language</Text></Box>
        <SelectInput
          items={LANGUAGES.map((l, i) => ({ label: `${l.flag}  ${l.name} (${l.native})`, value: i }))}
          initialIndex={languageIndex}
          onSelect={(item) => setLanguageIndex(item.value)}
        />
        <Box marginTop={1}><Text dimColor>Use ↑/↓ to navigate, Enter to select</Text></Box>
      </Box>

      <Box marginTop={1} flexDirection="row">
        <Box><Text color="cyan">Enter</Text><Text dimColor> - Start chatting  </Text></Box>
        <Box><Text color="cyan">B</Text><Text dimColor> - Back to API key</Text></Box>
      </Box>
    </Box>
  );
}