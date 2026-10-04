import { db } from "../utils/db.js";

export interface DailyProgress {
  id: number;
  language_code: string;
  date: string; // YYYY-MM-DD
  messages_count: number;
  words_reviewed: number;
  words_learned: number;
  session_minutes: number;
}

const upsertProgress = db.prepare(`
  INSERT INTO progress (language_code, date, messages_count, words_reviewed, words_learned, session_minutes)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(language_code, date) DO UPDATE SET
    messages_count = messages_count + excluded.messages_count,
    words_reviewed = words_reviewed + excluded.words_reviewed,
    words_learned = words_learned + excluded.words_learned,
    session_minutes = session_minutes + excluded.session_minutes
`);

const getProgress = db.prepare(`
  SELECT * FROM progress WHERE language_code = ? ORDER BY date DESC
`);

const getProgressRange = db.prepare(`
  SELECT * FROM progress
  WHERE language_code = ? AND date >= ? AND date <= ?
  ORDER BY date ASC
`);

const getStreak = db.prepare(`
  WITH dates AS (
    SELECT date FROM progress WHERE language_code = ? ORDER BY date DESC
  ),
  streaks AS (
    SELECT
      date,
      CASE
        WHEN date = date('now') THEN 1
        WHEN date = date('now', '-1 day') THEN 1
        ELSE 0
      END as is_today_or_yesterday,
      ROW_NUMBER() OVER (ORDER BY date DESC) as rn
    FROM dates
  )
  SELECT COUNT(*) as streak FROM streaks WHERE is_today_or_yesterday = 1 AND rn <= (
    SELECT COALESCE(MIN(rn), 0) FROM streaks WHERE is_today_or_yesterday = 0
  )
`);

const getTotalStats = db.prepare(`
  SELECT
    SUM(messages_count) as total_messages,
    SUM(words_reviewed) as total_words_reviewed,
    SUM(words_learned) as total_words_learned,
    SUM(session_minutes) as total_minutes,
    COUNT(DISTINCT date) as active_days
  FROM progress WHERE language_code = ?
`);

export function recordSession(
  languageCode: string,
  messagesCount = 0,
  wordsReviewed = 0,
  wordsLearned = 0,
  sessionMinutes = 0
): void {
  const today = new Date().toISOString().split("T")[0];
  upsertProgress.run(languageCode, today, messagesCount, wordsReviewed, wordsLearned, sessionMinutes);
}

export function getProgressHistory(languageCode: string, days = 365): DailyProgress[] {
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  return getProgressRange.all(languageCode, startDate, endDate) as DailyProgress[];
}

export function getAllProgress(languageCode: string): DailyProgress[] {
  return getProgress.all(languageCode) as DailyProgress[];
}

export function getCurrentStreak(languageCode: string): number {
  const result = getStreak.get(languageCode) as { streak: number } | undefined;
  return result?.streak || 0;
}

export function getLongestStreak(languageCode: string): number {
  const history = getAllProgress(languageCode);
  if (history.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < history.length; i++) {
    const prev = new Date(history[i - 1].date);
    const curr = new Date(history[i].date);
    const diff = Math.round((prev.getTime() - curr.getTime()) / (24 * 60 * 60 * 1000));

    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

export function getTotalStatsForLanguage(languageCode: string) {
  const result = getTotalStats.get(languageCode) as {
    total_messages: number | null;
    total_words_reviewed: number | null;
    total_words_learned: number | null;
    total_minutes: number | null;
    active_days: number | null;
  } | undefined;

  return {
    totalMessages: result?.total_messages || 0,
    totalWordsReviewed: result?.total_words_reviewed || 0,
    totalWordsLearned: result?.total_words_learned || 0,
    totalMinutes: result?.total_minutes || 0,
    activeDays: result?.active_days || 0,
  };
}

export function getHeatmapData(languageCode: string, days = 365): Map<string, number> {
  const history = getProgressHistory(languageCode, days);
  const map = new Map<string, number>();
  for (const day of history) {
    const intensity = Math.min(4, Math.ceil(day.messages_count / 5) + Math.ceil(day.words_reviewed / 10));
    map.set(day.date, intensity);
  }
  return map;
}

export function exportAllData(languageCode: string) {
  const conversations = db.prepare("SELECT * FROM conversations WHERE language_code = ?").all(languageCode);
  const messages = db.prepare(`
    SELECT m.* FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE c.language_code = ?
  `).all(languageCode);
  const vocabulary = db.prepare("SELECT * FROM vocabulary WHERE language_code = ?").all(languageCode);
  const reviews = db.prepare(`
    SELECT vr.* FROM vocab_reviews vr
    JOIN vocabulary v ON vr.vocab_id = v.id
    WHERE v.language_code = ?
  `).all(languageCode);
  const progress = getAllProgress(languageCode);
  const settings = db.prepare("SELECT * FROM settings").all();

  return {
    exportDate: new Date().toISOString(),
    version: "0.1.0",
    language: languageCode,
    conversations,
    messages,
    vocabulary,
    reviews,
    progress,
    settings,
  };
}

export function importAllData(data: any): { success: boolean; error?: string } {
  try {
    const transaction = db.transaction(() => {
      // Import conversations
      for (const c of data.conversations || []) {
        db.prepare(`
          INSERT OR REPLACE INTO conversations (id, language_code, title, model, personality, difficulty, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(c.id, c.language_code, c.title, c.model, c.personality, c.difficulty, c.created_at, c.updated_at);
      }

      // Import messages
      for (const m of data.messages || []) {
        db.prepare(`
          INSERT OR REPLACE INTO messages (id, conversation_id, role, content, tokens_used, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(m.id, m.conversation_id, m.role, m.content, m.tokens_used, m.created_at);
      }

      // Import vocabulary
      for (const v of data.vocabulary || []) {
        db.prepare(`
          INSERT OR REPLACE INTO vocabulary (id, language_code, word, translation, context, pronunciation, difficulty, tags, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(v.id, v.language_code, v.word, v.translation, v.context, v.pronunciation, v.difficulty, v.tags, v.created_at);
      }

      // Import reviews
      for (const r of data.reviews || []) {
        db.prepare(`
          INSERT OR REPLACE INTO vocab_reviews (id, vocab_id, ease_factor, interval, repetitions, next_review, last_reviewed)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(r.id, r.vocab_id, r.ease_factor, r.interval, r.repetitions, r.next_review, r.last_reviewed);
      }

      // Import progress
      for (const p of data.progress || []) {
        db.prepare(`
          INSERT OR REPLACE INTO progress (id, language_code, date, messages_count, words_reviewed, words_learned, session_minutes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(p.id, p.language_code, p.date, p.messages_count, p.words_reviewed, p.words_learned, p.session_minutes);
      }

      // Import settings
      for (const s of data.settings || []) {
        db.prepare(`
          INSERT OR REPLACE INTO settings (key, value)
          VALUES (?, ?)
        `).run(s.key, s.value);
      }
    });

    transaction();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}