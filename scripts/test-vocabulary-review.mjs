import test from "node:test";
import assert from "node:assert/strict";
import vocabularyReview from "../src/lib/vocabulary-review.js";

const {
  isWordKey,
  normalizeVocabularyReviewRecords,
  scheduleVocabularyReview,
  getVocabularyReviewQueue,
  summarizeVocabularyReview
} = vocabularyReview;

const saved = [
  { key: "1:1:1", reference: "1:1", arabic: "بِسْمِ", meaning: "In the name" },
  { key: "1:1:2", reference: "1:1", arabic: "اللَّهِ", meaning: "Allah" },
  { key: "1:2:1", reference: "1:2", arabic: "الْحَمْدُ", meaning: "All praise" },
  { key: "1:2:2", reference: "1:2", arabic: "لِلَّهِ", meaning: "" }
];

test("accepts bounded verse-word keys only", () => {
  assert.equal(isWordKey("1:1:1"), true);
  assert.equal(isWordKey("114:6:100"), true);
  assert.equal(isWordKey("115:1:1"), false);
  assert.equal(isWordKey("1:1:0"), false);
  assert.equal(isWordKey("1:1:101"), false);
  assert.equal(isWordKey("1:999:1"), false);
});

test("normalizes only valid review records and can restrict them to saved words", () => {
  const valid = {
    intervalDays: 3, easeFactor: 2.5, repetitions: 2, attempts: 2,
    lastRating: "good", lastReviewedAt: "2026-11-13T12:00:00.000Z",
    dueAt: "2026-11-16T12:00:00.000Z"
  };
  const result = normalizeVocabularyReviewRecords({
    "1:1:1": valid,
    "1:1:2": { ...valid, intervalDays: 0 },
    "9:9:9": valid,
    "not-a-word": valid
  }, ["1:1:1", "1:1:2"]);
  assert.deepEqual(Object.keys(result), ["1:1:1"]);
  assert.equal(result["1:1:1"].intervalDays, 3);
});

test("new words are due immediately and words without meanings are excluded", () => {
  const queue = getVocabularyReviewQueue(saved, {}, new Date("2026-11-13T12:00:00.000Z"));
  assert.deepEqual(queue.map(word => word.key), ["1:1:1", "1:1:2", "1:2:1"]);
  assert.equal(queue[0].isNew, true);
});

test("ratings schedule predictable review intervals", () => {
  const now = new Date("2026-11-13T12:00:00.000Z");
  const again = scheduleVocabularyReview({}, "1:1:1", "again", now)["1:1:1"];
  const hard = scheduleVocabularyReview({}, "1:1:1", "hard", now)["1:1:1"];
  const good = scheduleVocabularyReview({}, "1:1:1", "good", now)["1:1:1"];
  const easy = scheduleVocabularyReview({}, "1:1:1", "easy", now)["1:1:1"];
  assert.equal(again.intervalDays, 1);
  assert.equal(hard.intervalDays, 1);
  assert.equal(good.intervalDays, 1);
  assert.equal(easy.intervalDays, 3);
  assert.equal(new Date(easy.dueAt).toISOString(), "2026-11-16T12:00:00.000Z");
});

test("good and easy ratings grow intervals without exceeding one year", () => {
  const now = new Date("2026-11-13T12:00:00.000Z");
  let records = scheduleVocabularyReview({}, "1:1:1", "good", now);
  records = scheduleVocabularyReview(records, "1:1:1", "good", now);
  assert.equal(records["1:1:1"].intervalDays, 3);
  records = scheduleVocabularyReview(records, "1:1:1", "easy", now);
  assert.equal(records["1:1:1"].intervalDays, 8);
  assert.equal(records["1:1:1"].attempts, 3);
  assert.equal(records["1:1:1"].repetitions, 3);
});

test("again resets repetition progress and lowers ease without going below the floor", () => {
  const now = new Date("2026-11-13T12:00:00.000Z");
  let records = scheduleVocabularyReview({}, "1:1:1", "easy", now);
  records = scheduleVocabularyReview(records, "1:1:1", "again", now);
  assert.equal(records["1:1:1"].repetitions, 0);
  assert.equal(records["1:1:1"].intervalDays, 1);
  assert.equal(records["1:1:1"].easeFactor, 2.45);
});

test("review queue keeps future words out and orders new words first", () => {
  const now = new Date("2026-11-13T12:00:00.000Z");
  const records = scheduleVocabularyReview({}, "1:1:2", "easy", now);
  const queue = getVocabularyReviewQueue(saved, records, now);
  assert.deepEqual(queue.map(word => word.key), ["1:1:1", "1:2:1"]);
});

test("summary reports due, scheduled, new, and reviewed-today counts", () => {
  const now = new Date("2026-11-13T12:00:00.000Z");
  let records = scheduleVocabularyReview({}, "1:1:1", "easy", now);
  records = scheduleVocabularyReview(records, "1:1:2", "good", now);
  const summary = summarizeVocabularyReview(saved, records, now);
  assert.deepEqual(summary, { total: 3, due: 1, newWords: 1, scheduled: 1, reviewedToday: 2 });
});

test("invalid rating and invalid date fail clearly", () => {
  assert.throws(() => scheduleVocabularyReview({}, "1:1:1", "unknown"), /Choose again, hard, good, or easy/);
  assert.throws(() => scheduleVocabularyReview({}, "bad", "good"), /valid saved-word key/);
  assert.throws(() => scheduleVocabularyReview({}, "1:1:1", "good", "not-a-date"), /review date is invalid/);
});
