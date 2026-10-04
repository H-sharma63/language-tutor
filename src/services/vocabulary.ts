import { db } from "../utils/db.js";

export interface VocabWord {
  id: number;
  language_code: string;
  word: string;
  translation: string;
  context: string | null;
  pronunciation: string | null;
  difficulty: string;
  tags: string;
  created_at: number;
}

export interface VocabReview {
  id: number;
  vocab_id: number;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review: number;
  last_reviewed: number | null;
}

const insertWord = db.prepare(`
  INSERT INTO vocabulary (language_code, word, translation, context, pronunciation, difficulty, tags)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const updateWord = db.prepare(`
  UPDATE vocabulary SET word = ?, translation = ?, context = ?, pronunciation = ?, difficulty = ?, tags = ?
  WHERE id = ?
`);

const deleteWord = db.prepare(`
  DELETE FROM vocabulary WHERE id = ?
`);

const getWord = db.prepare(`
  SELECT * FROM vocabulary WHERE id = ?
`);

const getWords = db.prepare(`
  SELECT * FROM vocabulary WHERE language_code = ? ORDER BY created_at DESC
`);

const getWordsByDifficulty = db.prepare(`
  SELECT * FROM vocabulary WHERE language_code = ? AND difficulty = ? ORDER BY created_at DESC
`);

const searchWords = db.prepare(`
  SELECT * FROM vocabulary WHERE language_code = ? AND (word LIKE ? OR translation LIKE ?) ORDER BY created_at DESC
`);

const insertReview = db.prepare(`
  INSERT OR REPLACE INTO vocab_reviews (vocab_id, ease_factor, interval, repetitions, next_review, last_reviewed)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const getReview = db.prepare(`
  SELECT * FROM vocab_reviews WHERE vocab_id = ?
`);

const getDueReviews = db.prepare(`
  SELECT v.*, vr.ease_factor, vr.interval, vr.repetitions, vr.next_review, vr.last_reviewed
  FROM vocabulary v
  JOIN vocab_reviews vr ON v.id = vr.vocab_id
  WHERE v.language_code = ? AND vr.next_review <= ?
  ORDER BY vr.next_review ASC
`);

const getAllReviews = db.prepare(`
  SELECT v.*, vr.ease_factor, vr.interval, vr.repetitions, vr.next_review, vr.last_reviewed
  FROM vocabulary v
  LEFT JOIN vocab_reviews vr ON v.id = vr.vocab_id
  WHERE v.language_code = ?
  ORDER BY vr.next_review ASC
`);

const countWords = db.prepare(`
  SELECT COUNT(*) as count FROM vocabulary WHERE language_code = ?
`);

const countDueWords = db.prepare(`
  SELECT COUNT(*) as count
  FROM vocabulary v
  JOIN vocab_reviews vr ON v.id = vr.vocab_id
  WHERE v.language_code = ? AND vr.next_review <= ?
`);

export function addWord(
  languageCode: string,
  word: string,
  translation: string,
  context: string | null = null,
  pronunciation: string | null = null,
  difficulty: string = "A1",
  tags: string[] = []
): VocabWord {
  const result = insertWord.run(
    languageCode,
    word.trim(),
    translation.trim(),
    context?.trim() || null,
    pronunciation?.trim() || null,
    difficulty,
    JSON.stringify(tags)
  );
  const wordId = result.lastInsertRowid as number;

  // Initialize SRS record
  insertReview.run(wordId, 2.5, 0, 0, Date.now(), null);

  return getWordById(wordId);
}

export function getWordById(id: number): VocabWord {
  return getWord.get(id) as VocabWord;
}

export function updateWordById(
  id: number,
  word: string,
  translation: string,
  context: string | null,
  pronunciation: string | null,
  difficulty: string,
  tags: string[]
): void {
  updateWord.run(word.trim(), translation.trim(), context?.trim() || null, pronunciation?.trim() || null, difficulty, JSON.stringify(tags), id);
}

export function deleteWordById(id: number): void {
  deleteWord.run(id);
}

export function getWordsForLanguage(languageCode: string): VocabWord[] {
  return getWords.all(languageCode) as VocabWord[];
}

export function getWordsByDifficultyForLanguage(languageCode: string, difficulty: string): VocabWord[] {
  return getWordsByDifficulty.all(languageCode, difficulty) as VocabWord[];
}

export function searchWordsForLanguage(languageCode: string, query: string): VocabWord[] {
  const pattern = `%${query}%`;
  return searchWords.all(languageCode, pattern, pattern) as VocabWord[];
}

export function getWordCount(languageCode: string): number {
  const result = countWords.get(languageCode) as { count: number };
  return result.count;
}

// SM-2 Algorithm for Spaced Repetition
// Grade: 0=Again, 1=Hard, 3=Good, 5=Easy
export function reviewWord(vocabId: number, grade: 0 | 1 | 3 | 5): VocabReview {
  const review = getReview.get(vocabId) as VocabReview | undefined;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  let easeFactor = review?.ease_factor || 2.5;
  let interval = review?.interval || 0;
  let repetitions = review?.repetitions || 0;

  if (grade >= 3) { // Good or Easy
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else { // Again or Hard
    repetitions = 0;
    interval = 1;
  }

  // Adjust ease factor
  easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextReview = now + interval * dayMs;

  insertReview.run(vocabId, easeFactor, interval, repetitions, nextReview, now);

  return {
    id: 0,
    vocab_id: vocabId,
    ease_factor: easeFactor,
    interval,
    repetitions,
    next_review: nextReview,
    last_reviewed: now,
  };
}

export function getDueWordsForReview(languageCode: string): Array<VocabWord & VocabReview> {
  return getDueReviews.all(languageCode, Date.now()) as Array<VocabWord & VocabReview>;
}

export function getAllWordsWithReviews(languageCode: string): Array<VocabWord & Partial<VocabReview>> {
  return getAllReviews.all(languageCode) as Array<VocabWord & Partial<VocabReview>>;
}

export function getDueCount(languageCode: string): number {
  const result = countDueWords.get(languageCode, Date.now()) as { count: number };
  return result.count;
}

export function importFromCSV(languageCode: string, csvContent: string): { added: number; errors: string[] } {
  const lines = csvContent.trim().split("\n");
  const errors: string[] = [];
  let added = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV (simple: word,translation,context,pronunciation,difficulty,tags)
    const parts = line.split(",").map(p => p.trim().replace(/^"|"$/g, ""));
    if (parts.length < 2) {
      errors.push(`Line ${i + 1}: Need at least word and translation`);
      continue;
    }

    try {
      addWord(
        languageCode,
        parts[0],
        parts[1],
        parts[2] || null,
        parts[3] || null,
        parts[4] || "A1",
        parts[5] ? parts[5].split(";") : []
      );
      added++;
    } catch (e) {
      errors.push(`Line ${i + 1}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }

  return { added, errors };
}

export function exportToCSV(languageCode: string): string {
  const words = getWordsForLanguage(languageCode);
  const header = "word,translation,context,pronunciation,difficulty,tags";
  const rows = words.map(w =>
    [w.word, w.translation, w.context || "", w.pronunciation || "", w.difficulty, JSON.parse(w.tags).join(";")]
      .map(v => `"${v.replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header, ...rows].join("\n");
}