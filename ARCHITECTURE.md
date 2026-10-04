# Language Tutor - Architecture Document

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Terminal)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      INK TUI (React)                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │Welcome  │ │  Chat   │ │VocabRev │ │Scenarios│ │Progress │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────────┐ ┌─────────────┐ ┌──────────────┐
│  Conversation Svc   │ │ Vocabulary  │ │  Progress    │
│  (SQLite)           │ │    Svc      │ │   Svc        │
└─────────────────────┘ └─────────────┘ └──────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NVIDIA API CLIENT                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │  Streaming  │ │  Non-Stream │ │  Model List │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NVIDIA API (HTTPS)                           │
│  Models: Nemotron, Llama, Mistral, Gemma, Phi                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Chat Flow
```
User Input → InputArea → Chat Screen → Conversation Svc (save user msg)
                                    → Build history + system prompt
                                    → LLM Service (stream)
                                    → MessageBubble (render tokens)
                                    → Conversation Svc (save assistant msg)
                                    → Progress Svc (update stats)
```

### Vocabulary Review Flow
```
VocabReview Screen → Vocabulary Svc (get due words)
                  → Show card (word + context)
                  → User grades (Again/Hard/Good/Easy)
                  → SRS Algorithm (SM-2) → Update next_review
                  → Progress Svc (increment reviewed count)
```

## Database Schema

### Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `settings` | App configuration | key, value |
| `languages` | Supported languages | code (PK), name, native_name |
| `conversations` | Chat sessions | id (PK), language_code, title, model, personality, difficulty |
| `messages` | Individual messages | id (PK), conversation_id (FK), role, content, tokens_used |
| `vocabulary` | User's word bank | id (PK), language_code, word, translation, context, pronunciation, difficulty, tags |
| `vocab_reviews` | SRS tracking | id (PK), vocab_id (FK), ease_factor, interval, repetitions, next_review |
| `progress` | Daily analytics | id (PK), language_code, date, messages_count, words_reviewed, words_learned, session_minutes |

### Indexes
- `idx_messages_conversation` - Fast message retrieval
- `idx_vocab_language` - Filter vocab by language
- `idx_vocab_reviews_next` - Due words query
- `idx_progress_lang_date` - Progress charts

## Services

### LLM Service (`src/services/llm.ts`)
- **Responsibility**: NVIDIA API communication
- **Functions**:
  - `chat()` - Non-streaming completion
  - `chatStream()` - Streaming via SSE
  - `testConnection()` - Health check
  - `getAvailableModels()` - Model catalog
  - `getSelectedModel()` / `setSelectedModel()` - Persistence
  - `getNvidiaApiKey()` / `setNvidiaApiKey()` - Key management

### Conversation Service (`src/services/conversation.ts`)
- **Responsibility**: Chat persistence & retrieval
- **Functions**:
  - `createNewConversation()` - Initialize with settings
  - `getConversationById()` / `getConversationsForLanguage()`
  - `updateConversationTitle()` - Auto-generate from first message
  - `addMessage()` - Persist each message
  - `buildMessageHistory()` - Context window for LLM
  - `generateConversationTitle()` - Smart titles

### Vocabulary Service (`src/services/vocabulary.ts`)
- **Responsibility**: Word management + SRS
- **Functions**:
  - CRUD: `addWord()`, `getWords()`, `updateWord()`, `deleteWord()`
  - Import: `importFromCSV()`, `importFromAnki()`
  - SRS: `getDueWords()`, `reviewWord(grade)`, `getNextReview()`
  - SM-2 Algorithm implementation

### Progress Service (`src/services/progress.ts`)
- **Responsibility**: Analytics & streaks
- **Functions**:
  - `recordSession()` - Log daily activity
  - `getStreak()` - Current/longest streak
  - `getStats()` - Words learned, time, messages
  - `getHeatmapData()` - GitHub-style contribution graph

### Prompts Service (`src/services/prompts.ts`)
- **Responsibility**: System prompt construction
- **Functions**:
  - `buildSystemPrompt(lang, personality, cefr)` - Composite prompt
  - `loadPromptTemplate(lang)` - Language-specific base
  - `PERSONALITIES[]` - 4 tutor personas
  - `CEFR_LEVELS[]` - 6 proficiency levels

## TUI Architecture

### Screen State Machine
```
Welcome → (has API key?) → Chat
    │                      │
    └─ Settings ←──────────┘
         │
         ├─ VocabReview
         ├─ Scenarios
         └─ Progress
```

### Component Hierarchy
```
App (state: screen, config, conversation)
├── Header (step indicator)
├── Welcome
│   ├── LanguagePicker (ink-select-input)
│   └── ApiKeyInput (ink-text-input)
├── Chat
│   ├── MessageList (virtualized)
│   │   └── MessageBubble[] (user/assistant)
│   └── InputArea (ink-text-input + send)
├── VocabReview
│   ├── Card (word + translation + context)
│   └── GradeButtons (Again/Hard/Good/Easy)
├── Scenarios
│   ├── ScenarioList
│   └── ScenarioCard (description + start)
├── Progress
│   ├── StreakDisplay
│   ├── StatsGrid
│   └── Heatmap
└── Settings
    ├── ModelSelector
    ├── PersonalityPicker
    ├── DifficultyPicker
    └── ApiKeyManager
```

### State Management
- **Global**: React Context (config, current conversation)
- **Local**: useState/useReducer per screen
- **Persistence**: SQLite via services (no Redux needed)

## API Integration

### NVIDIA API
- **Endpoint**: `https://integrate.api.nvidia.com/v1/chat/completions`
- **Auth**: Bearer token (stored in SQLite)
- **Streaming**: Server-Sent Events (SSE)
- **Models**: 8 models available on free tier
- **Rate Limits**: Generous free tier, handled with retry logic

### Request Format
```json
{
  "model": "meta/llama-3.1-8b-instruct",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "Hola!"}
  ],
  "temperature": 0.7,
  "max_tokens": 2048,
  "stream": true
}
```

### Response Handling
- Parse SSE chunks: `data: {...}`
- Extract `choices[0].delta.content`
- Yield tokens to React for real-time rendering
- Handle `[DONE]` sentinel

## Security & Privacy

### Data Handling
- **API Key**: Stored locally in SQLite (user's machine only)
- **Conversations**: Never leave machine except for API call
- **Vocabulary**: 100% local
- **Progress**: 100% local
- **No Telemetry**: Zero tracking

### API Call Content
Only sends:
- System prompt (template + personality + level)
- Conversation history (last 20 messages)
- Current user message

No personal identifiers, no metadata.

## Performance Considerations

### Streaming Optimization
- Token-by-token rendering (no buffering)
- Virtualized message list (only render visible)
- Debounced input (300ms)

### Database
- WAL mode for concurrent reads
- Prepared statements (SQL injection safe)
- Indexes on query paths
- Connection pooling not needed (single-threaded)

### Memory
- Limit context to 20 messages
- Lazy-load vocabulary
- Cleanup old conversations (optional)

## Error Handling

| Scenario | Handling |
|----------|----------|
| No API key | Redirect to Settings → API Key input |
| API timeout | Retry 2x, then show error with suggestion |
| Rate limit | Show wait time, offer to switch model |
| Network offline | Queue message, sync when online |
| SQLite locked | Retry with backoff (WAL prevents most) |
| Invalid model | Fallback to default, notify user |

## Extensibility Points

1. **New Languages**: Add to `languages` table + prompt template
2. **New Models**: Add to `AVAILABLE_MODELS` array
3. **New Personalities**: Add to `PERSONALITIES` array
4. **New Scenarios**: JSON config in `templates/scenarios/`
5. **New Export Formats**: Add to `Progress.export()`
6. **Plugins**: Hook system in `services/` (future)

## Deployment

### Build Output
```
dist/
├── index.js        # Entry point (ESM)
├── index.d.ts      # Types
└── templates/      # Copied prompt templates
```

### Installation
```bash
npm install -g language-tutor
# or
npx language-tutor
```

### Data Location
- Windows: `%APPDATA%\language-tutor\language-tutor.db`
- Linux/macOS: `~/.local/share/language-tutor/language-tutor.db`

## Testing Strategy

| Layer | Tool | Coverage Target |
|-------|------|-----------------|
| Unit | Vitest | Services (80%+) |
| Integration | Vitest | DB + API mocks |
| E2E | Manual | Full user flows |
| TUI | Snapshot | Component renders |

## Monitoring (Future)

- Structured logging (pino)
- Error tracking (Sentry)
- Usage analytics (local only, opt-in)