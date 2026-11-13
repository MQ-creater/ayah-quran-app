const { normalizeVerseKey } = require("./ayah-utils");

const DAY_MS = 24 * 60 * 60 * 1000;
const RATINGS = ["again", "hard", "good", "easy"];

function toDate(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function isoOrEmpty(value) {
  const date = toDate(value);
  return date ? date.toISOString() : "";
}

function dateKey(value) {
  const date = toDate(value);
  if (!date) return "";
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}

function isWordKey(value) {
  const match = /^(\d{1,3}):(\d{1,3}):(\d{1,3})$/.exec(String(value || ""));
  if (!match) return false;
  const surah = Number(match[1]);
  const ayah = Number(match[2]);
  const position = Number(match[3]);
  return surah >= 1 && surah <= 114 && normalizeVerseKey(surah + ":" + ayah) !== null && position >= 1 && position <= 100;
}

function normalizeRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const intervalDays = Number(value.intervalDays);
  const easeFactor = Number(value.easeFactor);
  const repetitions = Number(value.repetitions);
  const attempts = Number(value.attempts);
  const dueAt = isoOrEmpty(value.dueAt);
  if (!dueAt || !RATINGS.includes(value.lastRating)) return null;
  if (!Number.isFinite(intervalDays) || intervalDays < 1 || intervalDays > 365) return null;
  if (!Number.isFinite(easeFactor) || easeFactor < 1.3 || easeFactor > 3) return null;
  if (!Number.isInteger(repetitions) || repetitions < 0 || repetitions > 1000) return null;
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 100000) return null;
  const lastReviewedAt = isoOrEmpty(value.lastReviewedAt);
  if (!lastReviewedAt) return null;
  return { intervalDays, easeFactor, repetitions, attempts, lastRating: value.lastRating, lastReviewedAt, dueAt };
}

function normalizeVocabularyReviewRecords(value, savedWordKeys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const allowed = Array.isArray(savedWordKeys) ? new Set(savedWordKeys.filter(isWordKey)) : null;
  const result = {};
  for (const [key, raw] of Object.entries(value).slice(0, 300)) {
    if (!isWordKey(key) || (allowed && !allowed.has(key))) continue;
    const record = normalizeRecord(raw);
    if (record) result[key] = record;
  }
  return result;
}

function scheduleVocabularyReview(previousRecords, wordKey, rating, reviewedAt = new Date()) {
  if (!isWordKey(wordKey)) throw new TypeError("A valid saved-word key is required.");
  if (!RATINGS.includes(rating)) throw new TypeError("Choose again, hard, good, or easy.");
  const now = toDate(reviewedAt);
  if (!now) throw new TypeError("The review date is invalid.");
  const previous = normalizeVocabularyReviewRecords(previousRecords)[wordKey] || null;
  const oldInterval = previous?.intervalDays || 0;
  const oldEase = previous?.easeFactor || 2.5;
  const oldRepetitions = previous?.repetitions || 0;
  let intervalDays;
  let repetitions;
  let easeFactor = oldEase;

  if (rating === "again") {
    intervalDays = 1;
    repetitions = 0;
    easeFactor = Math.max(1.3, oldEase - 0.2);
  } else if (rating === "hard") {
    intervalDays = oldRepetitions === 0 ? 1 : Math.max(2, Math.ceil(oldInterval * 1.2));
    repetitions = oldRepetitions + 1;
    easeFactor = Math.max(1.3, oldEase - 0.15);
  } else if (rating === "good") {
    intervalDays = oldRepetitions === 0 ? 1 : oldRepetitions === 1 ? 3 : Math.min(365, Math.max(1, Math.round(oldInterval * oldEase)));
    repetitions = oldRepetitions + 1;
  } else {
    intervalDays = oldRepetitions === 0 ? 3 : oldRepetitions === 1 ? 6 : Math.min(365, Math.max(1, Math.round(oldInterval * oldEase * 1.3)));
    repetitions = oldRepetitions + 1;
    easeFactor = Math.min(3, oldEase + 0.15);
  }

  intervalDays = Math.max(1, Math.min(365, Math.round(intervalDays)));
  const dueAt = new Date(now.getTime() + intervalDays * DAY_MS).toISOString();
  const record = {
    intervalDays,
    easeFactor: Number(easeFactor.toFixed(2)),
    repetitions,
    attempts: (previous?.attempts || 0) + 1,
    lastRating: rating,
    lastReviewedAt: now.toISOString(),
    dueAt
  };
  return normalizeVocabularyReviewRecords({ ...previousRecords, [wordKey]: record });
}

function getVocabularyReviewQueue(savedWords, reviewRecords, now = new Date()) {
  const current = toDate(now);
  if (!current || !Array.isArray(savedWords)) return [];
  const records = normalizeVocabularyReviewRecords(reviewRecords);
  return savedWords
    .filter(word => word && typeof word.key === "string" && isWordKey(word.key) && typeof word.meaning === "string" && word.meaning.trim())
    .map(word => {
      const review = records[word.key] || null;
      const dueAt = review ? review.dueAt : "";
      return { ...word, review, dueAt, isNew: !review };
    })
    .filter(word => !word.dueAt || new Date(word.dueAt).getTime() <= current.getTime())
    .sort((a, b) => {
      if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
      return (a.dueAt ? new Date(a.dueAt).getTime() : 0) - (b.dueAt ? new Date(b.dueAt).getTime() : 0);
    });
}

function summarizeVocabularyReview(savedWords, reviewRecords, now = new Date()) {
  const current = toDate(now);
  if (!current || !Array.isArray(savedWords)) return { total: 0, due: 0, newWords: 0, scheduled: 0, reviewedToday: 0 };
  const records = normalizeVocabularyReviewRecords(reviewRecords);
  const words = savedWords.filter(word => word && typeof word.key === "string" && isWordKey(word.key) && typeof word.meaning === "string" && word.meaning.trim());
  let newWords = 0;
  let scheduled = 0;
  let reviewedToday = 0;
  for (const word of words) {
    const record = records[word.key];
    if (!record) { newWords++; continue; }
    if (dateKey(record.lastReviewedAt) === dateKey(current)) reviewedToday++;
    if (new Date(record.dueAt).getTime() > current.getTime()) scheduled++;
  }
  return {
    total: words.length,
    due: getVocabularyReviewQueue(words, records, current).length,
    newWords,
    scheduled,
    reviewedToday
  };
}

module.exports = {
  RATINGS,
  isWordKey,
  normalizeVocabularyReviewRecords,
  scheduleVocabularyReview,
  getVocabularyReviewQueue,
  summarizeVocabularyReview
};
