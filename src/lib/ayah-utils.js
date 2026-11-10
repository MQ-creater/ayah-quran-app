const BACKUP_SCHEMA_VERSION = 1;
const BACKUP_PREFERENCE_KEYS = [
  "practiceCount","practiceHistory","dailyTargets","memorizationPlan","reviewRecords",
  "memorizationProgress","savedIds","favoriteReciterIds","preferredReciterId","preferredReciterName",
  "savedVerseDetails","readerNotes","ayahCollections","lastReadPosition","themeName",
  "learningLanguage","dailyGoal","dailyActivity","remindersEnabled","readerArabicSize",
  "readerShowArabic","readerShowTranslation","readerShowWordByWord","readerArabicScript",
  "readerTranslationFont","readerTranslationLanguage","readerTranslationId","recitationRepeatCount","repeatCount","lastAudioPosition","autoAdvance","surahRepeatCount",
  "arabicLessonProgress","arabicAlphabetProgress","recentSearches"
];
function normalizeVerseKey(value) {
  const match = /^(\d{1,3}):(\d{1,3})$/.exec(String(value || "").trim());
  if (!match) return null;
  const surah = Number(match[1]), ayah = Number(match[2]);
  if (!Number.isInteger(surah) || surah < 1 || surah > 114 || !Number.isInteger(ayah) || ayah < 1 || ayah > 286) return null;
  return surah + ":" + ayah;
}
function readerPageForAyah(value, perPage = 50) {
  const ayah = Math.max(1, Math.floor(Number(value) || 1));
  const size = Math.min(100, Math.max(1, Math.floor(Number(perPage) || 50)));
  return Math.floor((ayah - 1) / size) + 1;
}
function languageCodeFor(language) {
  const codes = { English:"en", Arabic:"ar", "العربية":"ar", Urdu:"ur", "اردو":"ur", Bengali:"bn", "বাংলা":"bn", Turkish:"tr", "Türkçe":"tr", French:"fr", "Français":"fr", "Bahasa Indonesia":"id" };
  return codes[language] || "en";
}
function mergeRecentSearches(existing, query, limit = 8) {
  const term = String(query || "").trim().replace(/\s+/g, " ");
  if (term.length < 2) return Array.isArray(existing) ? existing.slice(0, limit) : [];
  const previous = Array.isArray(existing) ? existing : [];
  return [term, ...previous.filter(item => String(item).toLowerCase() !== term.toLowerCase())].slice(0, Math.max(1, limit));
}
function validateAyahBackup(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { valid:false, error:"Backup must be a JSON object." };
  if (value.app !== "Ayah" || value.schemaVersion !== BACKUP_SCHEMA_VERSION) return { valid:false, error:"This file is not a supported Ayah backup." };
  if (!value.data || typeof value.data !== "object" || Array.isArray(value.data)) return { valid:false, error:"The backup does not contain a valid data section." };
  const data = {};
  for (const key of BACKUP_PREFERENCE_KEYS) if (Object.prototype.hasOwnProperty.call(value.data, key)) data[key] = value.data[key];
  for (const [key, item] of Object.entries(value.data)) if (/^lastAudioPosition_\d+$/.test(key)) data[key] = item;
  if (!Object.keys(data).length) return { valid:false, error:"No recognized Ayah learning data was found in this backup." };
  const objectKeys = ["dailyTargets","memorizationPlan","reviewRecords","memorizationProgress","savedVerseDetails","readerNotes","ayahCollections","dailyActivity","arabicLessonProgress","arabicAlphabetProgress"];
  for (const key of objectKeys) if (data[key] !== undefined && (!data[key] || typeof data[key] !== "object" || Array.isArray(data[key]))) return { valid:false, error:"The " + key + " section in this backup is invalid." };
  if (data.lastReadPosition !== undefined && data.lastReadPosition !== null && (typeof data.lastReadPosition !== "object" || Array.isArray(data.lastReadPosition))) return { valid:false, error:"The saved reading position is invalid." };
  const arrayKeys = ["savedIds","favoriteReciterIds","practiceHistory","recentSearches"];
  for (const key of arrayKeys) if (data[key] !== undefined && !Array.isArray(data[key])) return { valid:false, error:"The " + key + " list in this backup is invalid." };
  if (data.savedIds !== undefined && (data.savedIds.length > 5000 || data.savedIds.some(item => typeof item !== "string" || item.length > 64))) return { valid:false, error:"The bookmark list in this backup is invalid." };
  if (data.favoriteReciterIds !== undefined && (data.favoriteReciterIds.length > 500 || data.favoriteReciterIds.some(item => !["string","number"].includes(typeof item)))) return { valid:false, error:"The favorite reciter list in this backup is invalid." };
  if (data.practiceHistory !== undefined) {
    if (data.practiceHistory.some(item => !item || typeof item !== "object" || Array.isArray(item))) return { valid:false, error:"The practice history in this backup is invalid." };
    data.practiceHistory = data.practiceHistory.slice(0,250);
  }
  if (data.recentSearches !== undefined && (data.recentSearches.length > 8 || data.recentSearches.some(item => typeof item !== "string" || item.length > 100))) return { valid:false, error:"The recent search list in this backup is invalid." };
  if (data.practiceCount !== undefined && (!Number.isInteger(data.practiceCount) || data.practiceCount < 0 || data.practiceCount > 1000000)) return { valid:false, error:"The saved practice count is invalid." };
  if (data.dailyGoal !== undefined && (![5,10,15,20].includes(data.dailyGoal))) return { valid:false, error:"The saved daily learning goal is invalid." };
  if (data.dailyTargets !== undefined && ["reading","memorization"].some(key => data.dailyTargets[key] !== undefined && (!Number.isFinite(data.dailyTargets[key]) || data.dailyTargets[key] < 1 || data.dailyTargets[key] > 100))) return { valid:false, error:"The saved daily targets are invalid." };
  if (data.readerArabicSize !== undefined && (!Number.isFinite(data.readerArabicSize) || data.readerArabicSize < 18 || data.readerArabicSize > 60)) return { valid:false, error:"The saved Arabic text size is invalid." };
  if (data.themeName !== undefined && !["auto","light","dark","sepia"].includes(data.themeName)) return { valid:false, error:"The saved appearance setting is invalid." };
  if (data.readerArabicScript !== undefined && !["Uthmani","IndoPak"].includes(data.readerArabicScript)) return { valid:false, error:"The saved Arabic script setting is invalid." };
  if (data.readerTranslationFont !== undefined && !["Sans","Serif","Monospace"].includes(data.readerTranslationFont)) return { valid:false, error:"The saved translation font is invalid." };
  if (data.readerTranslationId !== undefined && !/^\\d+$/.test(String(data.readerTranslationId))) return { valid:false, error:"The saved translation selection is invalid." };
  for (const key of ["readerShowArabic","readerShowTranslation","readerShowWordByWord","remindersEnabled"]) if (data[key] !== undefined && typeof data[key] !== "boolean") return { valid:false, error:"The " + key + " setting in this backup is invalid." };
  if (data.recitationRepeatCount !== undefined && ![1,3,5].includes(data.recitationRepeatCount)) return { valid:false, error:"The saved ayah repeat setting is invalid." };
  for (const [key, item] of Object.entries(data)) if (/^lastAudioPosition_\\d+$/.test(key) && (!Number.isFinite(item) || item < 0 || item > 86400)) return { valid:false, error:"A saved audio position is invalid." };
  return { valid:true, data };
}
module.exports = { BACKUP_SCHEMA_VERSION, BACKUP_PREFERENCE_KEYS, normalizeVerseKey, readerPageForAyah, languageCodeFor, mergeRecentSearches, validateAyahBackup };
