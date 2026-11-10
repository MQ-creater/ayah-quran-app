export const BACKUP_SCHEMA_VERSION = 1;

export const BACKUP_PREFERENCE_KEYS = [
  "practiceCount","practiceHistory","dailyTargets","memorizationPlan","reviewRecords",
  "memorizationProgress","savedIds","favoriteReciterIds","preferredReciterId","preferredReciterName",
  "savedVerseDetails","readerNotes","ayahCollections","lastReadPosition","themeName",
  "learningLanguage","dailyGoal","dailyActivity","remindersEnabled","readerArabicSize",
  "readerShowArabic","readerShowTranslation","readerShowWordByWord","readerArabicScript",
  "readerTranslationFont","readerTranslationLanguage","readerTranslationId","recitationRepeatCount","repeatCount","lastAudioPosition","autoAdvance","surahRepeatCount",
  "arabicLessonProgress","arabicAlphabetProgress","recentSearches"
];

export function normalizeVerseKey(value) {
  const match = /^(\d{1,3}):(\d{1,3})$/.exec(String(value || "").trim());
  if (!match) return null;
  const surah = Number(match[1]);
  const ayah = Number(match[2]);
  if (!Number.isInteger(surah) || surah < 1 || surah > 114 || !Number.isInteger(ayah) || ayah < 1 || ayah > 286) return null;
  return surah + ":" + ayah;
}

export function readerPageForAyah(value, perPage = 50) {
  const ayah = Math.max(1, Math.floor(Number(value) || 1));
  const size = Math.min(100, Math.max(1, Math.floor(Number(perPage) || 50)));
  return Math.floor((ayah - 1) / size) + 1;
}

export function languageCodeFor(language) {
  const codes = { English:"en", Arabic:"ar", "العربية":"ar", Urdu:"ur", "اردو":"ur", Bengali:"bn", "বাংলা":"bn", Turkish:"tr", "Türkçe":"tr", French:"fr", "Français":"fr", "Bahasa Indonesia":"id" };
  return codes[language] || "en";
}

export function mergeRecentSearches(existing, query, limit = 8) {
  const term = String(query || "").trim().replace(/\s+/g, " ");
  if (term.length < 2) return Array.isArray(existing) ? existing.slice(0, limit) : [];
  const previous = Array.isArray(existing) ? existing : [];
  return [term, ...previous.filter(item => String(item).toLowerCase() !== term.toLowerCase())].slice(0, Math.max(1, limit));
}

export function validateAyahBackup(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { valid:false, error:"Backup must be a JSON object." };
  if (value.app !== "Ayah" || value.schemaVersion !== BACKUP_SCHEMA_VERSION) return { valid:false, error:"This file is not a supported Ayah backup." };
  if (!value.data || typeof value.data !== "object" || Array.isArray(value.data)) return { valid:false, error:"The backup does not contain a valid data section." };
  const data = {};
  for (const key of BACKUP_PREFERENCE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(value.data, key)) data[key] = value.data[key];
  }
  for (const [key, item] of Object.entries(value.data)) {
    if (/^lastAudioPosition_\d+$/.test(key)) data[key] = item;
  }
  if (!Object.keys(data).length) return { valid:false, error:"No recognized Ayah learning data was found in this backup." };
  if (data.savedIds !== undefined && (!Array.isArray(data.savedIds) || data.savedIds.some(item => typeof item !== "string"))) return { valid:false, error:"The bookmark list in this backup is invalid." };
  if (data.practiceHistory !== undefined && !Array.isArray(data.practiceHistory)) return { valid:false, error:"The practice history in this backup is invalid." };
  if (data.themeName !== undefined && !["auto","light","dark","sepia"].includes(data.themeName)) return { valid:false, error:"The saved appearance setting is invalid." };
  return { valid:true, data };
}
