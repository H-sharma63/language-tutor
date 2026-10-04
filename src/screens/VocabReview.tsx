import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { Header } from "../components/Header.js";
import { getDueWordsForReview, reviewWord, getDueCount, VocabWord, addWord, getWordsForLanguage } from "../services/vocabulary.js";

interface VocabReviewProps {
  language: string;
  onNavigate: (screen: string) => void;
}

type VocabWordWithSRS = VocabWord & { ease_factor: number; interval: number; repetitions: number; next_review: number; last_reviewed: number | null };

export function VocabReview({ language, onNavigate }: VocabReviewProps) {
  const [dueWords, setDueWords] = useState<VocabWordWithSRS[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0, again: 0 });
  const [addingWord, setAddingWord] = useState(false);
  const [newWord, setNewWord] = useState({ word: "", translation: "", context: "" });
  const [addField, setAddField] = useState<"word" | "translation" | "context">("word");

  const loadDueWords = useCallback(() => {
    const words = getDueWordsForReview(language);
    setDueWords(words);
    setCurrentIndex(0);
    setShowAnswer(false);
  }, [language]);

  useEffect(() => {
    loadDueWords();
  }, [loadDueWords]);

  useInput((input, key) => {
    if (addingWord) {
      if (key.escape) {
        setAddingWord(false);
        setNewWord({ word: "", translation: "", context: "" });
        setAddField("word");
      }
      return;
    }

    if (key.escape) {
      onNavigate("chat");
      return;
    }

    if (dueWords.length === 0) {
      if (key.return) {
        setAddingWord(true);
        setAddField("word");
      }
      return;
    }

    if (!showAnswer) {
      if (key.return || input === " ") {
        setShowAnswer(true);
      }
    } else {
      // Grade buttons: 0=Again, 1=Hard, 3=Good, 5=Easy
      if (key.return || input === "0") handleGrade(0);
      else if (input === "1") handleGrade(1);
      else if (input === "3") handleGrade(3);
      else if (input === "5") handleGrade(5);
    }

    if (input === "a") setAddingWord(true); // Add new word shortcut
    if (input === "s") onNavigate("chat"); // Skip to chat
  });

  const handleGrade = (grade: 0 | 1 | 3 | 5) => {
    if (currentIndex >= dueWords.length) return;

    const word = dueWords[currentIndex];
    reviewWord(word.id, grade);

    setSessionStats(prev => ({
      reviewed: prev.reviewed + 1,
      correct: prev.correct + (grade >= 3 ? 1 : 0),
      again: prev.again + (grade === 0 ? 1 : 0),
    }));

    setShowAnswer(false);
    if (currentIndex + 1 < dueWords.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Session complete
      setTimeout(() => loadDueWords(), 500);
    }
  };

  const handleAddWord = () => {
    if (!newWord.word.trim() || !newWord.translation.trim()) return;

    addWord(language, newWord.word, newWord.translation, newWord.context || null);
    setAddingWord(false);
    setNewWord({ word: "", translation: "", context: "" });
    setAddField("word");
    loadDueWords();
  };

  const handleAddFieldChange = (value: string) => {
    if (addField === "word") setNewWord(prev => ({ ...prev, word: value }));
    else if (addField === "translation") setNewWord(prev => ({ ...prev, translation: value }));
    else if (addField === "context") setNewWord(prev => ({ ...prev, context: value }));
  };

  const handleAddFieldSubmit = () => {
    if (addField === "word") setAddField("translation");
    else if (addField === "translation") setAddField("context");
    else if (addField === "context") handleAddWord();
  };

  const totalDue = getDueCount(language);
  const totalWords = getWordsForLanguage(language).length;

  if (dueWords.length === 0 && !addingWord) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header step={2} totalSteps={3} stepName="Vocabulary" />
        <Box flexDirection="column" marginTop={2} alignItems="center">
          <Box marginBottom={1}><Text bold color="green">🎉 All caught up!</Text></Box>
          <Text dimColor>No words due for review right now.</Text>
          <Box marginTop={2} flexDirection="column">
            <Box><Text>Total vocabulary: <Text bold>{totalWords}</Text> words</Text></Box>
            <Box><Text>Due for review: <Text bold>{totalDue}</Text></Text></Box>
          </Box>
          <Box marginTop={2} flexDirection="row">
            <Box><Text color="cyan">A</Text><Text dimColor> - Add new word</Text></Box>
            <Box marginLeft={2}><Text dimColor>|</Text></Box>
            <Box><Text color="cyan"> S</Text><Text dimColor> - Back to chat</Text></Box>
            <Box marginLeft={2}><Text dimColor>|</Text></Box>
            <Box><Text color="cyan"> Esc</Text><Text dimColor> - Back to chat</Text></Box>
          </Box>
        </Box>
      </Box>
    );
  }

  if (addingWord) {
    const fieldLabels = { word: "Target Word", translation: "Translation", context: "Context (optional)" };
    const fieldPlaceholders = { word: "hola", translation: "hello", context: "used as greeting" };

    return (
      <Box flexDirection="column" padding={1}>
        <Header step={2} totalSteps={3} stepName="Add Word" />
        <Box marginTop={2} flexDirection="column">
          <Text bold>Add New Vocabulary</Text>
          <Box marginTop={1}><Text dimColor>Enter word, translation, and optional context</Text></Box>

          <Box marginTop={2} flexDirection="column">
            <Box><Text bold>{fieldLabels[addField]}</Text></Box>
            <Box marginTop={1} flexDirection="row">
              <Box><Text color="cyan">❯ </Text></Box>
              <TextInput
                value={newWord[addField]}
                onChange={handleAddFieldChange}
                onSubmit={handleAddFieldSubmit}
                placeholder={fieldPlaceholders[addField]}
                showCursor
              />
            </Box>
            <Box marginTop={1}><Text dimColor>
              {addField === "word" && "Enter the word in your target language"}
              {addField === "translation" && "Enter the meaning in your native language"}
              {addField === "context" && "Optional: example sentence or usage note"}
            </Text></Box>
          </Box>

          <Box marginTop={2} flexDirection="row">
            <Box><Text color="cyan">Enter</Text><Text dimColor> - Next field / Save</Text></Box>
            <Box marginLeft={2}><Text dimColor>|</Text></Box>
            <Box><Text color="cyan">Esc</Text><Text dimColor> - Cancel</Text></Box>
          </Box>
        </Box>
      </Box>
    );
  }

  const currentWord = dueWords[currentIndex];
  const progress = dueWords.length > 0 ? ((currentIndex + 1) / dueWords.length) * 100 : 0;
  const barWidth = 40;
  const filled = Math.round(barWidth * progress / 100);
  const progressBar = "█".repeat(filled) + "░".repeat(barWidth - filled);

  return (
    <Box flexDirection="column" padding={1}>
      <Header step={2} totalSteps={3} stepName="Vocabulary Review" />

      <Box marginBottom={1} flexDirection="row">
        <Box><Text dimColor>Progress: </Text></Box>
        <Box><Text color="cyan">{progressBar}</Text></Box>
        <Box><Text dimColor> {Math.round(progress)}% ({currentIndex + 1}/{dueWords.length})</Text></Box>
      </Box>

      <Box marginTop={1} flexDirection="column" alignItems="center" padding={2}>
        {/* Word Card */}
        <Box
          borderStyle="round"
          borderColor={showAnswer ? "green" : "cyan"}
          padding={2}
          marginBottom={2}
          minWidth={50}
        >
          <Box flexDirection="column" alignItems="center">
            <Box><Text bold color={showAnswer ? "green" : "white"}>
              {currentWord.word}
            </Text></Box>

            {currentWord.pronunciation && (
              <Box marginTop={1}><Text dimColor>{currentWord.pronunciation}</Text></Box>
            )}

            {showAnswer && (
              <Box marginTop={1} flexDirection="column" alignItems="center">
                <Box><Text dimColor>{"─".repeat(30)}</Text></Box>
                <Box marginTop={1}><Text bold color="yellow">{currentWord.translation}</Text></Box>

                {currentWord.context && (
                  <Box marginTop={1}>
                    <Box><Text dimColor>Example:</Text></Box>
                    <Box><Text color="white" wrap="wrap">{currentWord.context}</Text></Box>
                  </Box>
                )}

                <Box marginTop={1}><Text dimColor>
                  Difficulty: {currentWord.difficulty}  |  Reviews: {currentWord.repetitions}  |  Ease: {currentWord.ease_factor.toFixed(1)}
                </Text></Box>
              </Box>
            )}

            {!showAnswer && (
              <Box marginTop={2}>
                <Text dimColor>Press Enter or Space to reveal answer</Text>
              </Box>
            )}
          </Box>
        </Box>

        {/* Grade Buttons */}
        {showAnswer && (
          <Box flexDirection="row" marginTop={1}>
            <Box marginRight={1} padding={1} borderStyle="round" borderColor="red">
              <Box><Text color="red" bold>0 Again</Text></Box>
              <Box><Text dimColor> - Forgot completely</Text></Box>
            </Box>
            <Box marginRight={1} padding={1} borderStyle="round" borderColor="yellow">
              <Box><Text color="yellow" bold>1 Hard</Text></Box>
              <Box><Text dimColor> - Struggled</Text></Box>
            </Box>
            <Box marginRight={1} padding={1} borderStyle="round" borderColor="green">
              <Box><Text color="green" bold>3 Good</Text></Box>
              <Box><Text dimColor> - Recalled with effort</Text></Box>
            </Box>
            <Box padding={1} borderStyle="round" borderColor="cyan">
              <Box><Text color="cyan" bold>5 Easy</Text></Box>
              <Box><Text dimColor> - Instant recall</Text></Box>
            </Box>
          </Box>
        )}

        {/* Session Stats */}
        <Box marginTop={2} flexDirection="row">
          <Box><Text dimColor>Session: </Text></Box>
          <Box><Text bold>{sessionStats.reviewed}</Text><Text dimColor> reviewed  </Text></Box>
          <Box><Text color="green" bold>{sessionStats.correct}</Text><Text dimColor> correct  </Text></Box>
          <Box><Text color="red" bold>{sessionStats.again}</Text><Text dimColor> again</Text></Box>
        </Box>

        {/* Shortcuts */}
        <Box marginTop={2} flexDirection="row">
          <Box><Text color="cyan">0/1/3/5</Text><Text dimColor> - Grade  </Text></Box>
          <Box><Text color="cyan">A</Text><Text dimColor> - Add word  </Text></Box>
          <Box><Text color="cyan">S</Text><Text dimColor> - Chat  </Text></Box>
          <Box><Text color="cyan">Esc</Text><Text dimColor> - Back</Text></Box>
        </Box>
      </Box>
    </Box>
  );
}