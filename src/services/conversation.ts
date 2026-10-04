import { db } from "../utils/db.js";

export interface Conversation {
  id: number;
  language_code: string;
  title: string | null;
  model: string;
  personality: string;
  difficulty: string;
  created_at: number;
  updated_at: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: "user" | "assistant" | "system";
  content: string;
  tokens_used: number;
  created_at: number;
}

const createConversation = db.prepare(`
  INSERT INTO conversations (language_code, title, model, personality, difficulty)
  VALUES (?, ?, ?, ?, ?)
`);

const updateConversation = db.prepare(`
  UPDATE conversations SET title = ?, updated_at = strftime('%s', 'now') WHERE id = ?
`);

const getConversation = db.prepare(`
  SELECT * FROM conversations WHERE id = ?
`);

const getConversations = db.prepare(`
  SELECT * FROM conversations WHERE language_code = ? ORDER BY updated_at DESC
`);

const deleteConversation = db.prepare(`
  DELETE FROM conversations WHERE id = ?
`);

const insertMessage = db.prepare(`
  INSERT INTO messages (conversation_id, role, content, tokens_used)
  VALUES (?, ?, ?, ?)
`);

const getMessages = db.prepare(`
  SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC
`);

const getRecentMessages = db.prepare(`
  SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?
`);

export function createNewConversation(
  languageCode: string,
  model: string,
  personality: string,
  difficulty: string
): Conversation {
  const result = createConversation.run(languageCode, null, model, personality, difficulty);
  return getConversationById(result.lastInsertRowid as number);
}

export function getConversationById(id: number): Conversation {
  return getConversation.get(id) as Conversation;
}

export function getConversationsForLanguage(languageCode: string): Conversation[] {
  return getConversations.all(languageCode) as Conversation[];
}

export function updateConversationTitle(id: number, title: string): void {
  updateConversation.run(title, id);
}

export function deleteConversationById(id: number): void {
  deleteConversation.run(id);
}

export function addMessage(
  conversationId: number,
  role: "user" | "assistant" | "system",
  content: string,
  tokensUsed = 0
): Message {
  const result = insertMessage.run(conversationId, role, content, tokensUsed);
  return getMessageById(result.lastInsertRowid as number);
}

export function getMessageById(id: number): Message {
  return db.prepare("SELECT * FROM messages WHERE id = ?").get(id) as Message;
}

export function getMessagesForConversation(conversationId: number): Message[] {
  return getMessages.all(conversationId) as Message[];
}

export function getRecentMessagesForConversation(conversationId: number, limit: number): Message[] {
  return getRecentMessages.all(conversationId, limit) as Message[];
}

export function buildMessageHistory(conversationId: number, maxMessages = 20): Array<{role: string, content: string}> {
  const messages = getRecentMessagesForConversation(conversationId, maxMessages).reverse();
  return messages.map(m => ({ role: m.role, content: m.content }));
}

export function generateConversationTitle(firstUserMessage: string): string {
  const words = firstUserMessage.trim().split(/\s+/).slice(0, 6).join(" ");
  return words.length > 40 ? words.slice(0, 37) + "..." : words;
}