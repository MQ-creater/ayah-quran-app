"use strict";

const OFFLINE_SCHEMA_VERSION = 1;
const OFFLINE_INDEX_KEY = "@ayah/offline-surahs-v1";
const OFFLINE_SURAH_PREFIX = "@ayah/offline-surah-v1:";

class OfflineLibraryError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "OfflineLibraryError";
    this.code = code;
  }
}

function safeId(value) {
  const id = String(value == null ? "" : value);
  if (!/^([1-9]|[1-9][0-9]|1[01][0-9]|11[0-4])$/.test(id)) {
    throw new OfflineLibraryError("Choose a valid surah number.", "INVALID_SURAH");
  }
  return id;
}

function normalizeVerse(verse, chapterId) {
  if (!verse || typeof verse !== "object" || Array.isArray(verse)) {
    throw new OfflineLibraryError("Offline Qur’an data contains an invalid ayah.", "INVALID_VERSE");
  }
  const key = String(verse.verse_key || "");
  const match = key.match(/^([1-9][0-9]{0,2}):([1-9][0-9]{0,2})$/);
  if (!match || match[1] !== chapterId) {
    throw new OfflineLibraryError("An ayah reference does not match the selected surah.", "VERSE_MISMATCH");
  }
  const arabic = String(verse.text_uthmani || verse.text_qpc_hafs || verse.text_indopak_nastaleeq || "").trim();
  if (!arabic) {
    throw new OfflineLibraryError("An ayah is missing verified Arabic text.", "MISSING_ARABIC");
  }
  return {
    verse_key: key,
    text_uthmani: String(verse.text_uthmani || verse.text_qpc_hafs || verse.text_indopak_nastaleeq),
    translation: verse.translations?.[0]?.text ? String(verse.translations[0].text) : "",
    translationId: verse.translations?.[0]?.resource_id == null ? null : String(verse.translations[0].resource_id)
  };
}

function createOfflineSurah({ chapter, verses, translationId, savedAt } = {}) {
  const chapterId = safeId(chapter?.id);
  const expectedCount = Number(chapter?.verses_count);
  if (!Number.isInteger(expectedCount) || expectedCount < 1 || expectedCount > 300) {
    throw new OfflineLibraryError("The surah verse count is invalid.", "INVALID_COUNT");
  }
  if (!Array.isArray(verses) || verses.length !== expectedCount) {
    throw new OfflineLibraryError("The surah is incomplete and cannot be saved offline.", "INCOMPLETE_SURAH");
  }
  const normalized = verses.map(verse => normalizeVerse(verse, chapterId));
  const seen = new Set(normalized.map(verse => verse.verse_key));
  if (seen.size !== expectedCount) {
    throw new OfflineLibraryError("The surah contains duplicate ayah references.", "DUPLICATE_VERSE");
  }
  for (let number = 1; number <= expectedCount; number += 1) {
    if (!seen.has(chapterId + ":" + number)) {
      throw new OfflineLibraryError("The surah is missing ayah " + number + ".", "MISSING_VERSE");
    }
  }
  const timestamp = savedAt === undefined ? new Date().toISOString() : savedAt;
  if (typeof timestamp !== "string" || !Number.isFinite(Date.parse(timestamp))) {
    throw new OfflineLibraryError("The download date is invalid.", "INVALID_DATE");
  }
  return {
    schemaVersion: OFFLINE_SCHEMA_VERSION,
    chapter: {
      id: Number(chapterId),
      name: String(chapter.name_simple || chapter.name || ("Surah " + chapterId)),
      nameArabic: String(chapter.name_arabic || "")
    },
    translationId: translationId == null ? null : String(translationId),
    savedAt: new Date(timestamp).toISOString(),
    verses: normalized
  };
}

function validateOfflineSurah(value, expectedChapterId) {
  if (!value || value.schemaVersion !== OFFLINE_SCHEMA_VERSION || !value.chapter) {
    throw new OfflineLibraryError("This offline download has an unsupported format.", "INVALID_DOWNLOAD");
  }
  const chapterId = safeId(value.chapter.id);
  if (expectedChapterId != null && chapterId !== safeId(expectedChapterId)) {
    throw new OfflineLibraryError("The offline download does not match this surah.", "SURAH_MISMATCH");
  }
  return createOfflineSurah({
    chapter: { ...value.chapter, id: chapterId, verses_count: value.verses?.length },
    verses: value.verses,
    translationId: value.translationId,
    savedAt: value.savedAt
  });
}

function createOfflineStorage({ getItem, setItem, removeItem } = {}) {
  if (![getItem, setItem, removeItem].every(fn => typeof fn === "function")) {
    throw new OfflineLibraryError("A compatible local storage adapter is required.", "INVALID_STORAGE");
  }
  async function readIndex() {
    try {
      const raw = await getItem(OFFLINE_INDEX_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.schemaVersion !== OFFLINE_SCHEMA_VERSION || !parsed.surahs || typeof parsed.surahs !== "object" || Array.isArray(parsed.surahs)) return {};
      return parsed.surahs;
    } catch (_) {
      return {};
    }
  }
  async function list() {
    const index = await readIndex();
    return Object.values(index).filter(item => item && Number.isInteger(Number(item.chapterId))).sort((a,b) => Number(a.chapterId)-Number(b.chapterId));
  }
  async function save(download) {
    const clean = validateOfflineSurah(download);
    const id = String(clean.chapter.id);
    const serialized = JSON.stringify(clean);
    const index = await readIndex();
    await setItem(OFFLINE_SURAH_PREFIX + id, serialized);
    index[id] = {
      chapterId: clean.chapter.id,
      name: clean.chapter.name,
      ayahCount: clean.verses.length,
      translationId: clean.translationId,
      savedAt: clean.savedAt,
      bytes: typeof TextEncoder === "function" ? new TextEncoder().encode(serialized).length : serialized.length
    };
    await setItem(OFFLINE_INDEX_KEY, JSON.stringify({ schemaVersion: OFFLINE_SCHEMA_VERSION, surahs: index }));
    return index[id];
  }
  async function get(chapterId) {
    const id = safeId(chapterId);
    const raw = await getItem(OFFLINE_SURAH_PREFIX + id);
    if (!raw) return null;
    try { return validateOfflineSurah(JSON.parse(raw), id); }
    catch (_) { await remove(id); return null; }
  }
  async function remove(chapterId) {
    const id = safeId(chapterId);
    await removeItem(OFFLINE_SURAH_PREFIX + id);
    const index = await readIndex();
    delete index[id];
    await setItem(OFFLINE_INDEX_KEY, JSON.stringify({ schemaVersion: OFFLINE_SCHEMA_VERSION, surahs: index }));
    return true;
  }
  async function clear() {
    const entries = await list();
    for (const item of entries) await remove(item.chapterId);
    await removeItem(OFFLINE_INDEX_KEY);
  }
  return { list, save, get, remove, clear };
}

module.exports = {
  OFFLINE_SCHEMA_VERSION,
  OFFLINE_INDEX_KEY,
  OFFLINE_SURAH_PREFIX,
  OfflineLibraryError,
  createOfflineSurah,
  validateOfflineSurah,
  createOfflineStorage
};
