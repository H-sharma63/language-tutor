# Language Tutor - Daily Tracker

## Hacktoberfest 2026 Submission Tracking

**Project**: language-tutor  
**Dates**: October 2-5, 2026  
**Goal**: Ship a working local-first AI language tutor

---

## Day 1 - October 2 (Wednesday) ✓ COMPLETED

### Completed
- [x] Project initialization (package.json, tsconfig, tsup.config.ts)
- [x] Database schema design & implementation (7 tables, indexes)
- [x] SQLite utilities with WAL mode
- [x] NVIDIA API service with 8 models support
- [x] Streaming SSE implementation
- [x] System prompt templates (base + personalities + CEFR)
- [x] Conversation persistence service
- [x] Project structure created

### Files Created
```
src/utils/db.ts           - Database connection & schema
src/utils/paths.ts        - Cross-platform data directories
src/services/llm.ts       - NVIDIA API client (streaming + non-stream)
src/services/prompts.ts   - Prompt templates, personalities, CEFR levels
src/services/conversation.ts - Chat persistence & history
PLAN.md                   - Project plan
ARCHITECTURE.md           - Architecture document
```

### Time Spent: ~3 hours
### Blockers: None

---

## Day 2 - October 3 (Thursday) ✓ MAJOR PROGRESS

### Completed (Core TUI + Chat + Vocab + Scenarios + Progress + Settings)

#### Morning - CLI Entry & App Structure ✓
- [x] Main entry point (index.ts) with Commander
- [x] App.tsx with screen navigation state machine
- [x] Header component (step indicator like berwapp)
- [x] Welcome screen (language picker + API key input)
- [x] Settings screen (model, personality, difficulty, API key)

#### Afternoon - Chat Interface ✓
- [x] Chat screen with streaming message bubbles
- [x] Input area with send/submit
- [x] Message history loading
- [x] Auto-title generation for conversations
- [x] Conversation list/switching (sidebar)
- [x] MessageBubble component (user/assistant styling)

#### Evening - Vocabulary & Learning Features ✓
- [x] Vocabulary service (CRUD + CSV import/export)
- [x] SM-2 Spaced Repetition Algorithm implementation
- [x] VocabReview screen with grade buttons (Again/Hard/Good/Easy)
- [x] Due words query with next_review scheduling
- [x] Add new word inline flow

#### Bonus - Additional Screens ✓
- [x] Scenarios screen (8 scenarios: restaurant, travel, interview, casual, shopping, doctor, emergency, custom)
- [x] Progress dashboard (streaks, stats, heatmap, export/import)
- [x] Progress service (streaks, analytics, heatmap data, export/import)
- [x] Keyboard shortcuts (Ctrl+1-5 navigation, Ctrl+Shift+H help)
- [x] Help overlay with all shortcuts

### Files Created (Day 2)
```
src/index.ts                    # CLI entry
src/app.tsx                     # Main app with navigation
src/components/Header.tsx       # Step header
src/components/MessageBubble.tsx # Chat message rendering
src/screens/Welcome.tsx         # Language + API setup
src/screens/Settings.tsx        # Configuration (5 tabs)
src/screens/Chat.tsx            # Main chat interface
src/screens/VocabReview.tsx     # Spaced repetition UI
src/screens/Scenarios.tsx       # Practice scenarios
src/screens/Progress.tsx        # Analytics dashboard
src/services/vocabulary.ts      # Vocab CRUD + SRS
src/services/progress.ts        # Analytics + export/import
```

### Time Spent: ~6 hours (cumulative ~9 hours)
### Bugs Fixed: 
- Fixed import paths (relative to services vs utils)
- Fixed TypeScript declaration issue with better-sqlite3 (disabled dts)
- Fixed SelectInput key warnings (using objects with label/value)
- Fixed database directory creation
- Fixed duplicate flexDirection in MessageBubble

---

## Day 3 - October 4 (Friday) - POLISH & TEST ✓ COMPLETED

### Target: Polish, Test, README, Ship

### Morning (2 hours) ✓
- [x] Fix TUI raw mode issue on Windows (added `process.stdin.isTTY` check in index.ts)
- [x] Test full user flows end-to-end
- [x] Verify build works with real API key setup

### Afternoon (2 hours) ✓
- [x] Create prompt templates for all 15 languages (templates/prompts/)
- [x] Added language-specific common mistakes and cultural context
- [x] Polish UI/UX (colors, spacing, error messages)
- [x] Test export/import round-trip

### Evening (2 hours) ✓
- [x] README.md with screenshots and usage
- [x] Final build verification
- [x] Test `npx language-tutor` fresh install
- [x] Prepare demo

### Files Created/Updated (Day 3)
```
templates/prompts/es.md         # Spanish prompt
templates/prompts/fr.md         # French prompt
templates/prompts/de.md         # German prompt ✓
templates/prompts/ja.md         # Japanese prompt
templates/prompts/ko.md         # Korean prompt
templates/prompts/zh.md         # Chinese prompt
templates/prompts/it.md         # Italian prompt
templates/prompts/pt.md         # Portuguese prompt
templates/prompts/ru.md         # Russian prompt
templates/prompts/ar.md         # Arabic prompt ✓
templates/prompts/hi.md         # Hindi prompt ✓
templates/prompts/tr.md         # Turkish prompt ✓
templates/prompts/nl.md         # Dutch prompt ✓
templates/prompts/pl.md         # Polish prompt ✓
templates/prompts/sv.md         # Swedish prompt ✓
README.md                       # Documentation ✓
src/index.ts                    # Fixed TTY check ✓
src/screens/Welcome.tsx         # Simplified 3-step onboarding ✓
src/screens/Settings.tsx        # 4 tabs, simple/advanced mode ✓
src/app.tsx                     # Simple mode support ✓
```

---

## Day 4 - October 5 (Saturday) - SUBMISSION DAY ✓ COMPLETED

### Morning (2 hours) ✓
- [x] End-to-end testing with friend
- [x] Fix critical bugs (TypeScript strict mode)
- [x] Performance check (streaming latency)
- [x] Data export/import verification

### Afternoon (1 hour) ✓
- [x] Final README polish
- [x] Version bump (0.1.0)
- [x] Build verification (`npm run build`) — clean, no errors
- [x] Test `npx language-tutor` fresh install
- [x] Create HACKTOBERFEST_SUBMISSION.md

### Evening (1 hour) ✓
- [x] Initialize git repository
- [x] Commit all changes
- [x] Ready to submit to Hacktoberfest
- [x] Demo documentation complete

---

## Daily Metrics

| Date | Hours | Features Done | Bugs Fixed | Lines of Code |
|------|-------|---------------|------------|---------------|
| Oct 2 | 3 | 8 | 0 | ~800 |
| Oct 3 | 6 | 18 | 5 | ~2500 |
| Oct 4 | 4 | 12 | 15 | ~1500 |
| Oct 5 | 3 | 3 | 5 | ~500 |

---

## Scope Decisions (Track Changes)

| Date | Decision | Reason |
|------|----------|--------|
| Oct 2 | Use NVIDIA API instead of Ollama | Laptop can't run local models |
| Oct 2 | 15 languages at launch | Cover major languages friend might need |
| Oct 2 | 4 personalities | Covers main learning styles |
| Oct 2 | SM-2 spaced repetition | Proven algorithm, simple implementation |
| Oct 2 | SQLite only, no sync | Privacy-first, simpler architecture |
| Oct 3 | Disabled dts generation | better-sqlite3 types issue |

---

## Current Status: Day 4 Evening - SUBMISSION READY ✓

### What Works Now:
1. ✅ CLI launches with `node dist/index.js`
2. ✅ Welcome screen: 3-step onboarding (API key → Language → Chat)
3. ✅ Settings: 4 tabs (Chat, Learning, Account, Advanced) + Simple Mode
4. ✅ Chat: streaming responses, conversation history, auto-titles
5. ✅ Vocab Review: SM-2 algorithm, due words, add words, session stats
6. ✅ Scenarios: 8 built-in (restaurant, travel, interview, casual, shopping, doctor, emergency) + custom
7. ✅ Progress: streaks, stats grid, 12-week heatmap, export/import JSON
8. ✅ Keyboard shortcuts: Ctrl+1-5, Esc, Ctrl+Shift+H, arrows
9. ✅ All data local (SQLite in %APPDATA%/language-tutor/)
10. ✅ Builds successfully — zero TypeScript errors
11. ✅ 15 language prompt templates with strict language enforcement
12. ✅ Simple Mode for beginners (Chat + Vocab only)
13. ✅ Git repository initialized and committed

### All Known Issues Resolved:
1. ✅ TUI raw mode error on Windows — fixed with TTY check
2. ✅ TypeScript strict mode errors — all fixed
3. ✅ Language mixing — fixed all 15 templates with "IMPORTANT: Always respond in [LANGUAGE]"
4. ✅ Enter key on Welcome screen — fixed
5. ✅ Conversation sidebar removed (was confusing with 1 conversation)
6. ✅ Settings reorganized with 4 tabs + Simple Mode
7. ✅ UI polished — Header, MessageBubble, progress bars

### Ready for Submission:
- ✅ `npm run build` clean
- ✅ `node dist/index.js` works
- ✅ Documentation complete (README, ARCHITECTURE, PLAN, TRACKER, HACKTOBERFEST_SUBMISSION)
- ✅ Git history clean
- ✅ MIT license in package.json

---

## Submission Checklist

- [x] Works on fresh machine (`npx language-tutor`) - builds OK
- [x] All data local (SQLite)
- [x] Multiple models selectable (8 NVIDIA models)
- [x] 15 languages supported
- [x] Vocab with spaced repetition (SM-2)
- [x] Progress tracking (streaks, heatmap, stats)
- [x] Export/import works (JSON)
- [x] README with install + usage
- [x] MIT license (in package.json)
- [x] Package.json has bin entry
- [x] Builds without errors
- [x] No hardcoded paths/secrets
- [x] Simple mode for beginners (Chat + Vocab only)
- [x] Guided 3-step onboarding (API key → Language → Chat)
- [x] Settings organized by purpose (Chat, Learning, Account, Advanced)