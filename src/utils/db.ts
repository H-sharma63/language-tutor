import Database from "better-sqlite3";
import { appDataDir } from "./paths.js";
import { mkdirSync } from "fs";

const dir = appDataDir();
mkdirSync(dir, { recursive: true });
const dbPath = `${dir}/language-tutor.db`;

const database = new Database(dbPath);

database.pragma("journal_mode = WAL");
database.pragma("foreign_keys = ON");

export const db = database as InstanceType<typeof Database>;

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS languages (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    native_name TEXT NOT NULL,
    cefr_level TEXT DEFAULT 'A1',
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_code TEXT NOT NULL,
    title TEXT,
    model TEXT NOT NULL,
    personality TEXT DEFAULT 'encouraging',
    difficulty TEXT DEFAULT 'A1',
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (language_code) REFERENCES languages(code)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS vocabulary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_code TEXT NOT NULL,
    word TEXT NOT NULL,
    translation TEXT NOT NULL,
    context TEXT,
    pronunciation TEXT,
    difficulty TEXT DEFAULT 'A1',
    tags TEXT DEFAULT '[]',
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (language_code) REFERENCES languages(code)
  );

  CREATE TABLE IF NOT EXISTS vocab_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vocab_id INTEGER NOT NULL,
    ease_factor REAL DEFAULT 2.5,
    interval INTEGER DEFAULT 0,
    repetitions INTEGER DEFAULT 0,
    next_review INTEGER DEFAULT (strftime('%s', 'now')),
    last_reviewed INTEGER,
    FOREIGN KEY (vocab_id) REFERENCES vocabulary(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_code TEXT NOT NULL,
    date TEXT NOT NULL,
    messages_count INTEGER DEFAULT 0,
    words_reviewed INTEGER DEFAULT 0,
    words_learned INTEGER DEFAULT 0,
    session_minutes INTEGER DEFAULT 0,
    UNIQUE(language_code, date),
    FOREIGN KEY (language_code) REFERENCES languages(code)
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_vocab_language ON vocabulary(language_code);
  CREATE INDEX IF NOT EXISTS idx_vocab_reviews_next ON vocab_reviews(next_review);
  CREATE INDEX IF NOT EXISTS idx_progress_lang_date ON progress(language_code, date);
`);

// Default languages
const defaultLanguages = [
  { code: "es", name: "Spanish", native_name: "Español" },
  { code: "fr", name: "French", native_name: "Français" },
  { code: "de", name: "German", native_name: "Deutsch" },
  { code: "it", name: "Italian", native_name: "Italiano" },
  { code: "pt", name: "Portuguese", native_name: "Português" },
  { code: "ja", name: "Japanese", native_name: "日本語" },
  { code: "ko", name: "Korean", native_name: "한국어" },
  { code: "zh", name: "Chinese (Mandarin)", native_name: "中文" },
  { code: "ru", name: "Russian", native_name: "Русский" },
  { code: "ar", name: "Arabic", native_name: "العربية" },
  { code: "hi", name: "Hindi", native_name: "हिन्दी" },
  { code: "tr", name: "Turkish", native_name: "Türkçe" },
  { code: "nl", name: "Dutch", native_name: "Nederlands" },
  { code: "pl", name: "Polish", native_name: "Polski" },
  { code: "sv", name: "Swedish", native_name: "Svenska" },
];

const insertLang = db.prepare(`
  INSERT OR IGNORE INTO languages (code, name, native_name) VALUES (?, ?, ?)
`);

for (const lang of defaultLanguages) {
  insertLang.run(lang.code, lang.name, lang.native_name);
}

export function getSetting(key: string): string | undefined {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value;
}

export function setSetting(key: string, value: string): void {
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
}

export function getAllSettings(): Record<string, string> {
  const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}