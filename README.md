# 🗣️ Language Tutor

A **local-first AI language tutor** that runs in your terminal. Practice 15+ languages with privacy - all your data stays on your machine.

## ✨ Features

- **🔒 Privacy First** - All conversations, vocabulary, and progress stored locally in SQLite
- **🌐 15 Languages** - Spanish, French, German, Italian, Portuguese, Japanese, Korean, Chinese, Russian, Arabic, Hindi, Turkish, Dutch, Polish, Swedish
- **🤖 8 Free AI Models** - Via NVIDIA's free API tier (Llama 3.1, Mistral, Gemma, Phi, Nemotron)
- **🎭 4 Tutor Personalities** - Encouraging, Strict, Casual, Formal
- **📊 CEFR Levels** - A1 through C2 difficulty adaptation
- **📚 Spaced Repetition** - SM-2 algorithm for vocabulary review
- **🎭 Practice Scenarios** - Restaurant, Travel, Interview, Shopping, Doctor, Emergency + Custom
- **📈 Progress Tracking** - Streaks, heatmaps, statistics, export/import
- **⌨️ Keyboard Shortcuts** - Full TUI navigation without mouse

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- NVIDIA API key (free at [build.nvidia.com](https://build.nvidia.com))

### Installation

```bash
# Clone and install
git clone https://github.com/H-sharma63/language-tutor
cd language-tutor
npm install

# Build
npm run build

# Run
node dist/index.js
```

Or run directly with npx (after publishing):
```bash
npx language-tutor
```

### First Run

1. **Get API Key**: Visit [build.nvidia.com](https://build.nvidia.com), sign up, and create an API key
2. **Launch**: Run `language-tutor` in your terminal
3. **Enter Key**: Paste your NVIDIA API key when prompted
4. **Choose Language**: Select from 15 supported languages
5. **Start Chatting**: Begin practicing immediately!

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+1` | Chat screen |
| `Ctrl+2` | Vocabulary Review |
| `Ctrl+3` | Scenarios |
| `Ctrl+4` | Progress |
| `Ctrl+5` | Settings |
| `Esc` | Back to Chat |
| `Ctrl+Shift+H` | Show help |
| `Enter` | Send message (Chat) / Select (Menus) |
| `↑/↓` | Navigate lists |
| `←/→` | Switch tabs (Settings) |

## 📖 Usage Guide

### Chat Screen
- Type messages and press `Enter` to send
- Streaming responses appear in real-time
- Sidebar shows conversation history
- `Ctrl+1` to return from other screens

### Vocabulary Review (Ctrl+2)
- **SM-2 Spaced Repetition** - Optimal review scheduling
- Grades: `0` (Again), `1` (Hard), `3` (Good), `5` (Easy)
- Press `A` to add new words
- Shows pronunciation, context, and review stats

### Scenarios (Ctrl+3)
- 8 built-in scenarios: Restaurant, Travel, Interview, Coffee Chat, Shopping, Doctor, Emergency
- Custom scenarios - describe any situation
- Each scenario configures the AI with roleplay context

### Progress (Ctrl+4)
- **Streaks** - Current and longest daily streaks
- **Statistics** - Messages, words reviewed/learned, practice time
- **Heatmap** - 12-week activity visualization
- `Ctrl+E` - Export all data as JSON
- `Ctrl+I` - Import data from JSON

### Settings (Ctrl+5)
- **Models** - Choose from 8 NVIDIA models
- **Personality** - Encouraging, Strict, Casual, Formal
- **Difficulty** - CEFR levels A1-C2
- **API Key** - Update/test your NVIDIA key
- **Data** - Export/import, delete all data

## 🏗️ Architecture

```
language-tutor/
├── src/
│   ├── index.ts           # CLI entry point (Commander)
│   ├── app.tsx            # Main Ink app with screen routing
│   ├── screens/           # 6 TUI screens
│   │   ├── Welcome.tsx    # Language selection + API key
│   │   ├── Chat.tsx       # Streaming conversation
│   │   ├── VocabReview.tsx # SM-2 spaced repetition
│   │   ├── Scenarios.tsx  # Roleplay scenarios
│   │   ├── Progress.tsx   # Stats + heatmap
│   │   └── Settings.tsx   # 5-tab settings
│   ├── components/        # Reusable UI components
│   ├── services/          # Business logic
│   │   ├── llm.ts         # NVIDIA API client (streaming)
│   │   ├── conversation.ts # Chat persistence
│   │   ├── vocabulary.ts  # Vocab CRUD + SM-2 SRS
│   │   ├── progress.ts    # Analytics + export/import
│   │   └── prompts.ts     # System prompt builder
│   └── utils/
│       ├── db.ts          # SQLite + schema
│       └── paths.ts       # Cross-platform data dirs
├── templates/prompts/     # Language-specific prompts (15)
├── dist/                  # Built output
└── package.json
```

### Data Storage

All data stored in SQLite at:
- **Windows**: `%APPDATA%\language-tutor\language-tutor.db`
- **macOS/Linux**: `~/.local/share/language-tutor/language-tutor.db`

Tables: `settings`, `languages`, `conversations`, `messages`, `vocabulary`, `vocab_reviews`, `progress`

## 🛠️ Development

```bash
# Development with hot reload
npm run dev

# Run tests
npm test

# Lint
npm run lint

# Build for production
npm run build
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| TUI | Ink (React for CLI) |
| CLI | Commander.js |
| Database | better-sqlite3 (WAL mode) |
| AI API | NVIDIA (fetch + SSE streaming) |
| Build | tsup |
| Testing | Vitest |
| Language | TypeScript (strict) |

## 🔧 Configuration

Settings stored in SQLite, configurable via Settings screen:
- `selected_model` - AI model ID
- `personality` - encouraging/strict/casual/formal
- `difficulty` - A1/A2/B1/B2/C1/C2
- `nvidia_api_key` - Your API key
- `last_language` - Auto-resume language

## 📦 Data Portability

**Export** (Progress screen → Ctrl+E):
- Complete JSON with conversations, messages, vocabulary, reviews, progress, settings

**Import** (Progress screen → Ctrl+I):
- Restore from exported JSON file
- Useful for backup, machine transfer, or sharing with friend

## 🎯 Hacktoberfest 2024

Built for **"Build for a Friend"** challenge:
- ✅ Local-first (privacy by default)
- ✅ Cloud AI via free APIs (no local GPU needed)
- ✅ Works offline for review/stats
- ✅ Zero cost, no subscriptions
- ✅ Single binary, easy to share

## 🤝 Contributing

1. Fork the repo
2. Create feature branch
3. Make changes
4. Run tests: `npm test`
5. Submit PR

## 📄 License

MIT License - see LICENSE file

## 🙏 Acknowledgments

- [Ink](https://github.com/vadimdemedes/ink) - React for CLI
- [NVIDIA](https://build.nvidia.com) - Free AI model hosting
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - Fast SQLite
- SM-2 algorithm by Piotr Woźniak

---

**Made with ❤️ for language learners everywhere**
