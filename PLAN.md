# Language Tutor - Project Plan

## Overview
A local-first AI language tutor for Hacktoberfest 2026. Practice any language with privacy - all data stays on your machine, only API calls leave for inference.

## Problem Statement
- Friend wants to learn a language privately
- No subscription costs
- Works offline for review
- Customizable tutor personality
- Tracks progress locally

## Solution
TUI-based CLI tool using:
- **NVIDIA API** (free tier) for multiple model options
- **SQLite** for all local data storage
- **Ink/React** for beautiful terminal UI
- **TypeScript** for type safety

## Timeline (3 Days: Oct 2-5)

### Day 1 (Oct 2) - Foundation ✓
- [x] Project setup (package.json, tsconfig, tsup)
- [x] Database schema (conversations, messages, vocabulary, progress)
- [x] NVIDIA API service with streaming
- [x] System prompt templates per language
- [x] Conversation persistence

### Day 2 (Oct 3) - Core Features
- [ ] Main TUI app with screen navigation
- [ ] Welcome screen (language pick, API key setup)
- [ ] Chat screen with streaming tokens
- [ ] Vocabulary manager (CRUD, CSV import)
- [ ] Spaced repetition review mode
- [ ] Scenario-based practice modes

### Day 3 (Oct 4) - Polish
- [ ] Progress dashboard (streaks, stats)
- [ ] Settings (model, personality, difficulty)
- [ ] Export/import data (JSON)
- [ ] Keyboard shortcuts & help
- [ ] README + documentation
- [ ] Test with friend, iterate

### Day 4 (Oct 5) - Ship
- [ ] Final testing
- [ ] npm publish prep
- [ ] Submit to Hacktoberfest

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Node.js | >=18 |
| TUI Framework | Ink | 5.x |
| CLI Parser | Commander | 12.x |
| Database | better-sqlite3 | 11.x |
| LLM API | NVIDIA (Nemotron, Llama, Mistral, Gemma, Phi) | - |
| Build | tsup | 8.x |
| Test | Vitest | 2.x |
| Language | TypeScript | 5.x |

## Project Structure

```
hacktoberfest/language-tutor/
├── src/
│   ├── index.ts                 # CLI entry point
│   ├── app.tsx                  # Main Ink app
│   ├── screens/
│   │   ├── Welcome.tsx          # Language/API setup
│   │   ├── Chat.tsx             # Conversation interface
│   │   ├── VocabReview.tsx      # Spaced repetition
│   │   ├── Scenarios.tsx        # Practice scenarios
│   │   ├── Progress.tsx         # Analytics dashboard
│   │   └── Settings.tsx         # Configuration
│   ├── components/
│   │   ├── MessageBubble.tsx
│   │   ├── InputArea.tsx
│   │   ├── ModelSelector.tsx
│   │   ├── ProgressBar.tsx
│   │   └── KeyboardHelp.tsx
│   ├── services/
│   │   ├── llm.ts               # NVIDIA API client
│   │   ├── conversation.ts      # Chat persistence
│   │   ├── vocabulary.ts        # Vocab + SRS
│   │   ├── progress.ts          # Analytics
│   │   └── prompts.ts           # System prompts
│   ├── hooks/
│   │   ├── useConversation.ts
│   │   ├── useVocabulary.ts
│   │   └── useProgress.ts
│   └── utils/
│       ├── db.ts                # SQLite helpers
│       └── paths.ts             # Data directories
├── templates/prompts/           # Per-language prompts
├── tests/
├── dist/                        # Built output
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── README.md
├── ARCHITECTURE.md
├── TRACKER.md
└── PLAN.md (this file)
```

## Key Features

1. **Multi-Model Support**: Nemotron 3 Ultra, Llama 3.1 (8B/70B/405B), Mistral, Gemma, Phi
2. **15 Languages**: ES, FR, DE, IT, PT, JA, KO, ZH, RU, AR, HI, TR, NL, PL, SV
3. **4 Personalities**: Encouraging, Strict, Casual, Formal
4. **6 CEFR Levels**: A1-C2 with adapted vocabulary/grammar
5. **Spaced Repetition**: SM-2 algorithm for vocabulary
6. **Scenarios**: Restaurant, Travel, Interview, Casual, Custom
7. **Progress Tracking**: Streaks, words learned, session time
8. **Data Export**: Full JSON export for portability
9. **Offline Review**: Practice vocab without internet

## Success Criteria

- [ ] `npx language-tutor` launches immediately
- [ ] One-time API key setup (stored locally)
- [ ] Chat streams tokens in real-time (<100ms first token)
- [ ] All data persists to SQLite
- [ ] Vocab review uses spaced repetition
- [ ] Progress screen shows meaningful stats
- [ ] Export/import works perfectly
- [ ] Friend can use it without help
- [ ] Zero external data storage

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| NVIDIA API down | Low | High | Fallback to OpenRouter/Groq in code |
| Rate limits hit | Medium | Medium | Cache responses, show limit warning |
| Streaming breaks | Low | High | Test thoroughly, fallback to non-stream |
| SQLite corruption | Very Low | High | WAL mode, regular backups |
| Time runs out | Medium | Critical | Cut scope: ship chat + vocab first |

## Out of Scope (Post-Hacktoberfest)

- Web/mobile UI
- Multi-user sync
- Voice input/output
- Custom model fine-tuning
- Plugin system
- Community content sharing