# Hacktoberfest 2026: Build for a Friend — Submission

## What I Built

**Language Tutor** — A local-first AI language tutor that runs entirely in your terminal. Practice 15+ languages with complete privacy — all conversations, vocabulary, and progress data stays on your machine in SQLite. Only API calls leave your device for AI inference.

**Built for:** My friend who wants to learn Spanish privately without subscriptions, data tracking, or cloud sync. They needed something that works offline for review, respects privacy, and costs $0.

**Problems solved:**
- ✅ No monthly fees — uses NVIDIA's generous free API tier (14,400 req/day)
- ✅ Works offline — review vocab, view progress, export data without internet
- ✅ Zero data leaves your machine except API prompts — SQLite stored locally
- ✅ Customizable — 4 tutor personalities, 6 CEFR levels, 8 AI models
- ✅ Portable — single binary, JSON export/import for backup or sharing

---

## Demo

### Terminal Demo (ASCII Recording)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🗣️  Language Tutor                    v0.1.0                  │
│ Step 1/3: Setup                                                   │
├─────────────────────────────────────────────────────────────────┤
│ 1. Add API Key                                                    │
│ 2. Pick Language                                                  │
│ 3. Start Chatting                                                 │
│                                                                   │
│ 🗣️  Language Tutor                                                │
│ Practice any language with AI — 100% private, runs in terminal   │
│                                                                   │
│ Step 1 of 2: Get your free API key                                │
│ 1. Open https://build.nvidia.com in your browser                 │
│ 2. Sign in (Google/GitHub/Email) — it's free                     │
│ 3. Click "Get API Key" and copy it                               │
│ 4. Paste it below and press Enter                                 │
│                                                                   │
│ ❯ nvapi-xxxxxxxxxxxx█                                             │
│                                                                   │
│ ✓ Connected! Press Enter to continue.                             │
│ Your key is saved locally. Only used for AI responses.           │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│ 🗣️  Language Tutor                    v0.1.0                  │
│ Step 2/3: Chat                                                    │
├─────────────────────────────────────────────────────────────────┤
│ 💬 Chat                                          Spanish │ encouraging │ A1 │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ You                                                         │ │
│ │ Hola, ¿cómo estás?                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🤖 Tutor                                                    │ │
│ │ ¡Hola! Estoy muy bien, gracias por preguntar. ¿Y tú?        │ │
│ │ (Hello! I'm very well, thanks for asking. And you?)         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ You                                                         │ │
│ │ Estoy bien. Quiero aprender español para viajar.            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🤖 Tutor                                                    │ │
│ │ ¡Excelente! (Excellent!) Viajar es una gran razón.          │ │
│ │ ¿Qué países hispanohablantes quieres visitar?               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ❯ Estoy bien. Quiero aprender español para viajar.█             │
├─────────────────────────────────────────────────────────────────┤
│ Ctrl+Shift+H for shortcuts  |  Ctrl+1-5 to navigate  |  Esc for chat │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features in Action

| Feature | Demo |
|---------|------|
| **Vocabulary Review (SM-2)** | `Ctrl+2` → Grade words with 0/1/3/5 (Again/Hard/Good/Easy) |
| **Scenarios** | `Ctrl+3` → Restaurant, Travel, Interview, Doctor, Emergency + Custom |
| **Progress Dashboard** | `Ctrl+4` → Streaks, heatmap, stats, `Ctrl+E` export, `Ctrl+I` import |
| **Settings** | `Ctrl+5` → Model, Personality, Difficulty, API Key, Simple Mode |
| **Help** | `Ctrl+Shift+H` → All keyboard shortcuts |

---

## Code

**Repository:** `D:/project/hacktoberfest/language-tutor` (ready to push to GitHub)

### Project Structure

```
language-tutor/
├── src/
│   ├── index.ts              # CLI entry (Commander.js + TTY check)
│   ├── app.tsx               # Main Ink app with screen routing
│   ├── screens/
│   │   ├── Welcome.tsx       # 3-step onboarding (API → Language → Chat)
│   │   ├── Chat.tsx          # Streaming chat with message bubbles
│   │   ├── VocabReview.tsx   # SM-2 spaced repetition UI
│   │   ├── Scenarios.tsx     # 8 roleplay scenarios + custom
│   │   ├── Progress.tsx      # Streaks, stats, heatmap, export/import
│   │   └── Settings.tsx      # 4 tabs: Chat, Learning, Account, Advanced
│   ├── components/
│   │   ├── Header.tsx        # Step indicator (like berwapp)
│   │   └── MessageBubble.tsx # User/assistant message rendering
│   ├── services/
│   │   ├── llm.ts            # NVIDIA API client (streaming + non-stream)
│   │   ├── conversation.ts   # Chat persistence & history
│   │   ├── vocabulary.ts     # Vocab CRUD + SM-2 SRS algorithm
│   │   ├── progress.ts       # Analytics + JSON export/import
│   │   └── prompts.ts        # System prompt builder (personalities + CEFR)
│   └── utils/
│       ├── db.ts             # SQLite + schema (7 tables, WAL mode)
│       └── paths.ts          # Cross-platform data directories
├── templates/prompts/        # 15 language-specific system prompts
├── dist/                     # Built output (single ESM file)
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── README.md
├── ARCHITECTURE.md
├── PLAN.md
└── TRACKER.md
```

### Installation & Run

```bash
# Clone
git clone <your-repo-url>
cd language-tutor

# Install & build
npm install
npm run build

# Run
node dist/index.js
# or after npm publish:
npx language-tutor
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| TUI Framework | Ink 5.x (React for CLI) |
| CLI Parser | Commander.js 12.x |
| Database | better-sqlite3 11.x (WAL mode) |
| AI API | NVIDIA (Nemotron, Llama 3.1, Mistral, Gemma, Phi) |
| Streaming | Native fetch + SSE |
| Build | tsup 8.x (ESM, Node 18+) |
| Language | TypeScript 5.x (strict) |

---

## How I Built It

### Open-Source AI Used

**NVIDIA's Free API Tier** — 8 open-weight models hosted free:
- `nvidia/nemotron-3.5-lightning-30b-a3b` (default, fast)
- `meta/llama-3.1-8b-instruct` / `70b` / `405b-instruct`
- `mistralai/mistral-large-2-instruct` / `mistral-nemo-12b-instruct`
- `google/gemma-2-9b-it`
- `microsoft/phi-3.5-mini-instruct`

**No local inference needed** — runs on any machine with Node.js 18+ and internet for chat.

### Architecture Highlights

1. **Local-First by Default** — SQLite with WAL mode stores everything: conversations, messages, vocabulary, SRS state, daily progress, settings. Zero cloud sync.

2. **Streaming TUI** — Ink (React for terminals) renders tokens in real-time via async generators consuming NVIDIA's SSE stream.

3. **SM-2 Spaced Repetition** — Implemented from scratch in `vocabulary.ts`:
   ```typescript
   // Ease factor update: EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02))
   // Interval: 1, 6, then EF * previous_interval
   ```

4. **Language-Specific Prompts** — 15 `.md` templates in `templates/prompts/` with:
   - Strict language enforcement ("IMPORTANT: Always respond in Spanish")
   - Common learner mistakes per language
   - Cultural context (formal/informal address, regional variations)

5. **Privacy-First Data Export** — Full JSON round-trip for backup, machine transfer, or sharing with a friend.

---

## Why Does Open Innovation Matter?

**Open-weight models + free hosting = Democratized AI access.**

Without NVIDIA's free tier (and similar offerings from Groq, OpenRouter, Together AI):
- This project would need a $2,000+ GPU for local inference
- Or $20+/month for commercial APIs (OpenAI, Anthropic)
- My friend couldn't afford either

**What open innovation made possible:**
- ✅ **Zero cost to run** — 14,400 free requests/day covers heavy daily use
- ✅ **Model choice** — Switch between 8 models for speed vs quality
- ✅ **No vendor lock-in** — Swap API endpoint in one file
- ✅ **Community-driven** — Prompt templates are plain Markdown, anyone can contribute a language
- ✅ **Transparency** — You know exactly what data leaves your machine (just the chat context)

**Closed APIs would have meant:** Usage limits, billing surprises, data retention policies, and no offline capability.

---

## My Agent Session

This project was built with **Claude Code** (Anthropic's CLI agent). The development session included:
- Project planning & architecture (PLAN.md, ARCHITECTURE.md)
- Daily progress tracking (TRACKER.md)
- Full implementation across 4 days
- TypeScript strict-mode fixes
- 15 language prompt templates
- Build verification

*Agent session available via DevRelay if needed for judging.*

---

## Submission Checklist

- ✅ **Working demo** — `node dist/index.js` launches TUI immediately
- ✅ **Privacy-first** — All data in local SQLite (`%APPDATA%/language-tutor/`)
- ✅ **Free to run** — NVIDIA free tier, no subscriptions
- ✅ **Offline-capable** — Vocab review, progress, export work without internet
- ✅ **15 languages** — ES, FR, DE, IT, PT, JA, KO, ZH, RU, AR, HI, TR, NL, PL, SV
- ✅ **8 AI models** — Llama, Mistral, Gemma, Phi, Nemotron via NVIDIA
- ✅ **SM-2 SRS** — Proven spaced repetition algorithm
- ✅ **Export/Import** — Full JSON portability
- ✅ **Keyboard-driven** — Ctrl+1-5, Esc, Ctrl+Shift+H, no mouse needed
- ✅ **Simple Mode** — Beginner-friendly (Chat + Vocab only)
- ✅ **Builds clean** — `npm run build` → single ESM file, no TypeScript errors
- ✅ **MIT License** — In package.json
- ✅ **README + Docs** — Complete usage guide

---

**Built with ❤️ for language learners everywhere — especially the friend who inspired this.**

*Hacktoberfest 2026 • Build for a Friend • Local-First AI*