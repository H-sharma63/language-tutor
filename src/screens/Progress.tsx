import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { Header } from "../components/Header.js";
import { getCurrentStreak, getLongestStreak, getTotalStatsForLanguage, getHeatmapData, exportAllData, importAllData } from "../services/progress.js";
import { getWordCount, getDueCount } from "../services/vocabulary.js";
import { getConversationsForLanguage } from "../services/conversation.js";

interface ProgressProps {
  language: string;
  onNavigate: (screen: string) => void;
}

export function Progress({ language, onNavigate }: ProgressProps) {
  const [stats, setStats] = useState({
    streak: 0,
    longestStreak: 0,
    totalMessages: 0,
    totalWordsReviewed: 0,
    totalWordsLearned: 0,
    totalMinutes: 0,
    activeDays: 0,
    totalWords: 0,
    dueWords: 0,
    totalConversations: 0,
  });
  const [heatmap, setHeatmap] = useState<Map<string, number>>(new Map());
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importPath, setImportPath] = useState("");
  const [message, setMessage] = useState<{type: "success" | "error", text: string} | null>(null);

  useEffect(() => {
    loadStats();
  }, [language]);

  const loadStats = () => {
    setStats({
      streak: getCurrentStreak(language),
      longestStreak: getLongestStreak(language),
      ...getTotalStatsForLanguage(language),
      totalWords: getWordCount(language),
      dueWords: getDueCount(language),
      totalConversations: getConversationsForLanguage(language).length,
    });
    setHeatmap(getHeatmapData(language, 365));
  };

  const handleExport = () => {
    setExporting(true);
    try {
      const data = exportAllData(language);
      const json = JSON.stringify(data, null, 2);
      // In a real app, we'd save to file. For now, show success.
      setMessage({ type: "success", text: `Exported ${json.length} chars. Use file system to save.` });
      // Actually write to file
      const fs = require("fs");
      const path = require("path");
      const filename = `language-tutor-export-${language}-${new Date().toISOString().split("T")[0]}.json`;
      fs.writeFileSync(filename, json);
      setMessage({ type: "success", text: `Exported to ./${filename}` });
    } catch (e) {
      setMessage({ type: "error", text: `Export failed: ${e instanceof Error ? e.message : "Unknown"}` });
    } finally {
      setExporting(false);
    }
  };

  const handleImportSubmit = () => {
    if (!importPath.trim()) return;
    setImporting(true);
    try {
      const fs = require("fs");
      const content = fs.readFileSync(importPath.trim(), "utf-8");
      const data = JSON.parse(content);
      const result = importAllData(data);
      if (result.success) {
        setMessage({ type: "success", text: "Import successful! Restart to see changes." });
        loadStats();
      } else {
        setMessage({ type: "error", text: `Import failed: ${result.error}` });
      }
    } catch (e) {
      setMessage({ type: "error", text: `Import failed: ${e instanceof Error ? e.message : "Unknown"}` });
    } finally {
      setImporting(false);
      setImportPath("");
    }
  };

  useInput((input, key) => {
    if (key.escape) {
      onNavigate("chat");
    }
    if (key.ctrl && input === "e") {
      handleExport();
    }
    if (key.ctrl && input === "i") {
      // Would open file dialog in GUI, here just prompt
    }
  });

  // Render heatmap (simplified - last 12 weeks)
  const renderHeatmap = () => {
    const weeks = 12;
    const daysPerWeek = 7;
    const cells: React.ReactNode[] = [];

    const intensityChars = [" ", "░", "▒", "▓", "█"];
    const intensityColors = ["dim", "dim", "yellow", "green", "cyan"];

    for (let week = 0; week < weeks; week++) {
      const weekCells: React.ReactNode[] = [];
      for (let day = 0; day < daysPerWeek; day++) {
        const date = new Date();
        date.setDate(date.getDate() - (weeks - week) * 7 - (6 - day));
        const dateStr = date.toISOString().split("T")[0];
        const intensity = heatmap.get(dateStr) || 0;

        weekCells.push(
          <Box key={dateStr} marginRight={1} paddingX={1}>
            <Text color={intensityColors[intensity]}>{intensityChars[intensity]}</Text>
          </Box>
        );
      }
      cells.push(<Box key={`week-${week}`} flexDirection="row" marginBottom={1}>{weekCells}</Box>);
    }

    return <Box flexDirection="column">{cells}</Box>;
  };

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${hours}h ${m}m` : `${hours}h`;
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Header step={2} totalSteps={3} stepName="Progress" />

      {/* Streaks */}
      <Box marginTop={1} flexDirection="row" marginBottom={2}>
        <Box padding={1} borderStyle="round" borderColor="yellow" marginRight={1} flexDirection="column" alignItems="center">
          <Box><Text bold color="yellow">{stats.streak}</Text></Box>
          <Box><Text dimColor>Day Streak</Text></Box>
        </Box>
        <Box padding={1} borderStyle="round" borderColor="green" marginRight={1} flexDirection="column" alignItems="center">
          <Box><Text bold color="green">{stats.longestStreak}</Text></Box>
          <Box><Text dimColor>Longest Streak</Text></Box>
        </Box>
        <Box padding={1} borderStyle="round" borderColor="cyan" marginRight={1} flexDirection="column" alignItems="center">
          <Box><Text bold color="cyan">{stats.activeDays}</Text></Box>
          <Box><Text dimColor>Active Days</Text></Box>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Box marginBottom={2} flexDirection="row" flexWrap="wrap">
        <Box width="50%" padding={1} flexDirection="column">
          <Box><Text bold>💬 Conversations</Text></Box>
          <Box><Text color="white" bold>{stats.totalConversations}</Text></Box>
          <Box><Text dimColor>Total messages: {stats.totalMessages}</Text></Box>
        </Box>
        <Box width="50%" padding={1} flexDirection="column">
          <Box><Text bold>📚 Vocabulary</Text></Box>
          <Box><Text color="white" bold>{stats.totalWords}</Text></Box>
          <Box><Text dimColor>{stats.dueWords} due for review</Text></Box>
        </Box>
        <Box width="50%" padding={1} flexDirection="column">
          <Box><Text bold>✅ Reviews</Text></Box>
          <Box><Text color="white" bold>{stats.totalWordsReviewed}</Text></Box>
          <Box><Text dimColor>{stats.totalWordsLearned} learned</Text></Box>
        </Box>
        <Box width="50%" padding={1} flexDirection="column">
          <Box><Text bold>⏱️ Time</Text></Box>
          <Box><Text color="white" bold>{formatMinutes(stats.totalMinutes)}</Text></Box>
          <Box><Text dimColor>Total practice time</Text></Box>
        </Box>
      </Box>

      {/* Heatmap */}
      <Box marginBottom={2}>
        <Box marginBottom={1}><Text bold>📅 Activity (Last 12 Weeks)</Text></Box>
        <Box flexDirection="row" alignItems="center" marginBottom={1}>
          <Box><Text dimColor>Less </Text></Box>
          <Box flexDirection="row">
            {[0,1,2,3,4].map(i => (
              <Box key={i} marginRight={1} paddingX={1}>
                <Text color={["dim","dim","yellow","green","cyan"][i]}>▓</Text>
              </Box>
            ))}
          </Box>
          <Box><Text dimColor> More</Text></Box>
        </Box>
        {renderHeatmap()}
      </Box>

      {/* Export/Import */}
      <Box borderStyle="round" borderColor="dim" padding={1} marginBottom={1}>
        <Box><Text bold>📤 Data Export / Import</Text></Box>
        <Box marginTop={1}><Text dimColor>Your data stays on your machine. Export for backup or transfer.</Text></Box>
        <Box marginTop={1} flexDirection="row">
          <Box paddingX={1} paddingY={1}>
            <Text color="cyan">{exporting ? "Exporting..." : "Ctrl+E Export JSON"}</Text>
          </Box>
          <Box marginLeft={2}><Text dimColor>|</Text></Box>
          <Box marginLeft={2}><Text color="cyan">Ctrl+I Import JSON</Text></Box>
        </Box>
        {importing && (
          <Box marginTop={1} flexDirection="column">
            <Box><Text bold>Import from file:</Text></Box>
            <Box marginTop={1} flexDirection="row">
              <Box><Text color="cyan">❯ </Text></Box>
              <TextInput
                value={importPath}
                onChange={setImportPath}
                onSubmit={handleImportSubmit}
                placeholder="/path/to/export.json"
                showCursor
              />
            </Box>
          </Box>
        )}
        {message && (
          <Box marginTop={1} padding={1}>
            <Text color="white">{message.text}</Text>
          </Box>
        )}
      </Box>

      <Box marginTop={1} flexDirection="row">
        <Text color="cyan">Ctrl+E</Text><Text dimColor> Export  </Text>
        <Text color="cyan">Ctrl+I</Text><Text dimColor> Import  </Text>
        <Text color="cyan">Esc</Text><Text dimColor> Back to chat</Text>
      </Box>
    </Box>
  );
}