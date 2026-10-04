import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import TextInput from "ink-text-input";
import { chatStream, chat, LLMMessage } from "../services/llm.js";
import { addMessage, buildMessageHistory, updateConversationTitle, generateConversationTitle } from "../services/conversation.js";
import { buildSystemPrompt } from "../services/prompts.js";
import { MessageBubble } from "../components/MessageBubble.js";
import { Header } from "../components/Header.js";

interface ChatProps {
  conversation: any;
  onNewConversation: () => void;
  onNavigate: (screen: string) => void;
  disableStream: boolean;
}

export function Chat({
  conversation,
  onNewConversation,
  onNavigate,
  disableStream,
}: ChatProps) {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<any>(null);
  const { stdout } = useStdout();

  // Load existing messages on mount
  useEffect(() => {
    const history = buildMessageHistory(conversation.id);
    // Filter out system messages for display
    const displayMessages = history.filter(m => m.role !== "system");
    setMessages(displayMessages);
  }, [conversation.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (stdout && messagesEndRef.current) {
      stdout.write("\x1B[9999B");
    }
  }, [messages, stdout]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);
    setError(null);

    // Add user message to UI immediately
    const newUserMsg = { role: "user", content: userMessage };
    setMessages(prev => [...prev, newUserMsg]);

    // Persist user message
    addMessage(conversation.id, "user", userMessage);

    // Build messages for LLM (with system prompt)
    const systemPrompt = buildSystemPrompt(
      conversation.language_code,
      conversation.personality,
      conversation.difficulty
    );

    const history = buildMessageHistory(conversation.id, 18); // Keep last 18 + system = 20
    const llmMessages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: userMessage },
    ];

    try {
      if (disableStream) {
        // Non-streaming
        const response = await chat(llmMessages);
        const assistantMsg = { role: "assistant", content: response.content };
        setMessages(prev => [...prev, assistantMsg]);
        addMessage(conversation.id, "assistant", response.content, response.tokensUsed);
      } else {
        // Streaming
        setStreaming(true);
        let fullContent = "";

        for await (const chunk of chatStream(llmMessages)) {
          if (chunk.content) {
            fullContent += chunk.content;
            // Update last message (streaming assistant message)
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last && last.role === "assistant") {
                return [...prev.slice(0, -1), { ...last, content: fullContent }];
              } else {
                return [...prev, { role: "assistant", content: fullContent }];
              }
            });
          }
          if (chunk.done) break;
        }

        setStreaming(false);
        // Persist final assistant message
        addMessage(conversation.id, "assistant", fullContent);
      }

      // Auto-generate title if first exchange
      if (messages.length === 1) { // Only user message was there before
        const title = generateConversationTitle(userMessage);
        updateConversationTitle(conversation.id, title);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      // Remove the streaming message on error
      setMessages(prev => prev.filter(m => !(m.role === "assistant" && m.content === "")));
    } finally {
      setSending(false);
    }
  }, [input, conversation, messages.length, disableStream, sending]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleKeyPress = (input: string, key: any) => {
    if (key.return && !key.shift && !sending) {
      handleSend();
    }
    if (key.upArrow && input === "") {
      // Could implement message editing history
    }
  };

  // Language display
  const languageNames: Record<string, string> = {
    es: "Spanish", fr: "French", de: "German", it: "Italian", pt: "Portuguese",
    ja: "Japanese", ko: "Korean", zh: "Chinese", ru: "Russian", ar: "Arabic",
    hi: "Hindi", tr: "Turkish", nl: "Dutch", pl: "Polish", sv: "Swedish",
  };
  const languageName = languageNames[conversation.language_code] || conversation.language_code;

  return (
    <Box flexDirection="column" height="100%" flexGrow={1}>
      {/* Chat Header with conversation info */}
      <Box borderStyle="single" borderColor="dim" paddingX={1} paddingY={1} marginBottom={1}>
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          <Box flexDirection="row" alignItems="center">
            <Text bold color="cyan">💬 Chat</Text>
            <Box marginLeft={2}><Text dimColor>{languageName}</Text></Box>
            <Box marginLeft={1}><Text dimColor>|</Text></Box>
            <Box marginLeft={1}><Text dimColor>{conversation.personality}</Text></Box>
            <Box marginLeft={1}><Text dimColor>|</Text></Box>
            <Box marginLeft={1}><Text dimColor>{conversation.difficulty}</Text></Box>
          </Box>
          <Box flexDirection="row" alignItems="center">
            <Text dimColor>Ctrl+1</Text><Box marginLeft={1}><Text dimColor>Chat</Text></Box>
            <Box marginLeft={2}><Text dimColor>Ctrl+2</Text></Box><Box marginLeft={1}><Text dimColor>Vocab</Text></Box>
            <Box marginLeft={2}><Text dimColor>Esc</Text></Box><Box marginLeft={1}><Text dimColor>Back</Text></Box>
          </Box>
        </Box>
      </Box>

      {/* Main Chat Area */}
      <Box flexDirection="column" flexGrow={1} minWidth={0}>
        {/* Messages */}
        <Box flexDirection="column" flexGrow={1} overflowY="visible" padding={1} minHeight={0}>
          {messages.map((msg, idx) => (
            <MessageBubble
              key={idx}
              message={msg}
              isStreaming={streaming && idx === messages.length - 1 && msg.role === "assistant"}
            />
          ))}
          <Box ref={messagesEndRef} />
        </Box>

        {/* Error Display */}
        {error && (
          <Box margin={1} padding={1} borderStyle="round" borderColor="red">
            <Text color="white">Error: {error}</Text>
          </Box>
        )}

        {/* Input Area */}
        <Box borderStyle="round" borderColor={sending ? "yellow" : streaming ? "green" : "cyan"} padding={1} marginTop={1}>
          <Box flexDirection="row" alignItems="center">
            <Text color="cyan" bold>❯ </Text>
            <TextInput
              value={input}
              onChange={handleInputChange}
              onSubmit={handleSend}
              placeholder={sending ? "Sending..." : streaming ? "Streaming..." : "Type your message (Enter to send, Shift+Enter for new line)"}
              showCursor={!sending}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}