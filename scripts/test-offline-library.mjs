import test from "node:test";
import assert from "node:assert/strict";
import offline from "../src/services/offline-library.js";

const chapter = { id: 1, name_simple: "Al-Fatihah", name_arabic: "الفاتحة", verses_count: 2 };
const verses = [
  { verse_key: "1:1", text_uthmani: "بِسْمِ اللَّهِ", translations: [{ resource_id: 131, text: "In the name of Allah." }] },
  { verse_key: "1:2", text_uthmani: "الْحَمْدُ لِلَّهِ", translations: [{ resource_id: 131, text: "All praise is for Allah." }] }
];

test("offline surah accepts a complete ordered or unordered set of ayahs", () => {
  const saved = offline.createOfflineSurah({ chapter, verses: [...verses].reverse(), translationId: 131 });
  assert.equal(saved.verses.length, 2);
  assert.equal(saved.chapter.name, "Al-Fatihah");
  assert.equal(saved.verses[0].verse_key, "1:2");
});

test("offline surah refuses incomplete, duplicate, or mismatched ayahs", () => {
  assert.throws(() => offline.createOfflineSurah({ chapter, verses: verses.slice(0, 1), translationId: 131 }), error => error.code === "INCOMPLETE_SURAH");
  assert.throws(() => offline.createOfflineSurah({ chapter, verses: [verses[0], verses[0]], translationId: 131 }), error => error.code === "DUPLICATE_VERSE");
  assert.throws(() => offline.createOfflineSurah({ chapter, verses: [verses[0], { ...verses[1], verse_key: "2:2" }], translationId: 131 }), error => error.code === "VERSE_MISMATCH");
});

test("offline surah requires Arabic text and a valid chapter number", () => {
  assert.throws(() => offline.createOfflineSurah({ chapter: { ...chapter, id: 115 }, verses }), error => error.code === "INVALID_SURAH");
  assert.throws(() => offline.createOfflineSurah({ chapter: { ...chapter, id: 119 }, verses }), error => error.code === "INVALID_SURAH");
  assert.throws(() => offline.createOfflineSurah({ chapter, verses: verses.map(v => ({ ...v, text_uthmani: "" })), translationId: 131 }), error => error.code === "MISSING_ARABIC");
});


test("offline surah requires every selected translation and rejects a different translation ID", () => {
  assert.throws(() => offline.createOfflineSurah({ chapter, verses, translationId: "not-a-number" }), error => error.code === "INVALID_TRANSLATION");
  assert.throws(() => offline.createOfflineSurah({ chapter, verses: verses.map(v => ({ ...v, translations: [] })), translationId: 131 }), error => error.code === "MISSING_TRANSLATION");
  assert.throws(() => offline.createOfflineSurah({ chapter, verses: verses.map(v => ({ ...v, translations: [{ resource_id: 999, text: "Other translation" }] })), translationId: 131 }), error => error.code === "TRANSLATION_MISMATCH");
});

test("offline download validation binds a saved package to its surah", () => {
  const saved = offline.createOfflineSurah({ chapter, verses, translationId: 131 });
  assert.equal(offline.validateOfflineSurah(saved, 1).verses.length, 2);
  assert.throws(() => offline.validateOfflineSurah(saved, 2), error => error.code === "SURAH_MISMATCH");
  assert.throws(() => offline.validateOfflineSurah({ schemaVersion: 99 }, 1), error => error.code === "INVALID_DOWNLOAD");
});

test("offline storage saves, lists, reads, replaces, and removes selected surahs", async () => {
  const map = new Map();
  const storage = offline.createOfflineStorage({
    getItem: async key => map.has(key) ? map.get(key) : null,
    setItem: async (key, value) => map.set(key, value),
    removeItem: async key => map.delete(key)
  });
  await storage.save(offline.createOfflineSurah({ chapter, verses }));
  assert.equal((await storage.list()).length, 1);
  assert.equal((await storage.get(1)).verses.length, 2);
  await storage.remove(1);
  assert.equal((await storage.get(1)), null);
  assert.equal((await storage.list()).length, 0);
});

test("offline storage clears only its own indexed surah packages", async () => {
  const map = new Map([["unrelated", "keep"]]);
  const storage = offline.createOfflineStorage({
    getItem: async key => map.has(key) ? map.get(key) : null,
    setItem: async (key, value) => map.set(key, value),
    removeItem: async key => map.delete(key)
  });
  await storage.save(offline.createOfflineSurah({ chapter, verses }));
  await storage.clear();
  assert.equal(map.get("unrelated"), "keep");
  assert.equal((await storage.list()).length, 0);
});

test("offline storage requires a compatible adapter", () => {
  assert.throws(() => offline.createOfflineStorage({}), error => error.code === "INVALID_STORAGE");
});
