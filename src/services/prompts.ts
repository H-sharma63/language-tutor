import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = join(fileURLToPath(import.meta.url), "..");

export interface TutorPersonality {
  id: string;
  name: string;
  description: string;
  systemAddition: string;
}

export const PERSONALITIES: TutorPersonality[] = [
  {
    id: "encouraging",
    name: "Encouraging",
    description: "Patient, positive, celebrates progress",
    systemAddition: "Be warm and encouraging. Celebrate every small win. Correct gently with positive reinforcement.",
  },
  {
    id: "strict",
    name: "Strict Teacher",
    description: "Precise, demands accuracy, corrects every error",
    systemAddition: "Be precise and demanding. Correct every mistake immediately. Explain grammar rules thoroughly. Don't accept sloppy output.",
  },
  {
    id: "casual",
    name: "Conversation Partner",
    description: "Natural chat, minimal corrections, focuses on flow",
    systemAddition: "Chat like a friend. Only correct major errors that change meaning. Focus on keeping conversation flowing naturally.",
  },
  {
    id: "formal",
    name: "Formal Instructor",
    description: "Structured lessons, academic tone, systematic",
    systemAddition: "Use formal register. Structure responses as mini-lessons. Introduce grammar systematically. Use linguistic terminology.",
  },
];

export const CEFR_LEVELS = [
  { id: "A1", name: "Beginner (A1)", description: "Basic phrases, present tense, ~500 words" },
  { id: "A2", name: "Elementary (A2)", description: "Daily routines, past tense, ~1000 words" },
  { id: "B1", name: "Intermediate (B1)", description: "Opinions, subjunctive basics, ~2500 words" },
  { id: "B2", name: "Upper Intermediate (B2)", description: "Complex topics, nuance, ~5000 words" },
  { id: "C1", name: "Advanced (C1)", description: "Idioms, abstract, professional, ~10000 words" },
  { id: "C2", name: "Mastery (C2)", description: "Native-like, subtle nuance, ~20000+ words" },
];

function loadPromptTemplate(languageCode: string): string {
  try {
    const path = join(__dirname, "..", "templates", "prompts", `${languageCode}.md`);
    return readFileSync(path, "utf-8");
  } catch {
    return getDefaultPrompt(languageCode);
  }
}

function getDefaultPrompt(languageCode: string): string {
  const languageNames: Record<string, string> = {
    es: "Spanish", fr: "French", de: "German", it: "Italian", pt: "Portuguese",
    ja: "Japanese", ko: "Korean", zh: "Chinese", ru: "Russian", ar: "Arabic",
    hi: "Hindi", tr: "Turkish", nl: "Dutch", pl: "Polish", sv: "Swedish",
  };
  const name = languageNames[languageCode] || languageCode;

  return `You are a ${name} language tutor. Help the user practice ${name} through conversation.

Guidelines:
- Reply primarily in ${name}, with English translations for new/difficult words
- Adapt to the user's CEFR level
- Be conversational and engaging
- Correct errors based on the selected personality
- Ask follow-up questions to keep conversation going
- Introduce 1-2 new words/phrases per response naturally`;
}

export function buildSystemPrompt(
  languageCode: string,
  personalityId: string,
  cefrLevel: string
): string {
  const basePrompt = loadPromptTemplate(languageCode);
  const personality = PERSONALITIES.find(p => p.id === personalityId) || PERSONALITIES[0];
  const level = CEFR_LEVELS.find(l => l.id === cefrLevel) || CEFR_LEVELS[0];

  return `${basePrompt}

=== PERSONALITY: ${personality.name} ===
${personality.systemAddition}

=== CEFR LEVEL: ${level.name} ===
${level.description}

Adjust your vocabulary, grammar complexity, and sentence structure to match this level exactly.`;
}

export function getPersonality(id: string): TutorPersonality {
  return PERSONALITIES.find(p => p.id === id) || PERSONALITIES[0];
}

export function getCefrLevel(id: string) {
  return CEFR_LEVELS.find(l => l.id === id) || CEFR_LEVELS[0];
}