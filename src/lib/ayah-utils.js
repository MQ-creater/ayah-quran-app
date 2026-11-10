const BACKUP_SCHEMA_VERSION = 1;
const BACKUP_PREFERENCE_KEYS = [
  "practiceCount","practiceHistory","dailyTargets","memorizationPlan","reviewRecords",
  "memorizationProgress","savedIds","favoriteReciterIds","preferredReciterId","preferredReciterName",
  "savedVerseDetails","readerNotes","ayahCollections","lastReadPosition","themeName",
  "learningLanguage","dailyGoal","dailyActivity","remindersEnabled","readerArabicSize",
  "readerShowArabic","readerShowTranslation","readerShowWordByWord","readerArabicScript",
  "readerTranslationFont","readerTranslationLanguage","readerTranslationId","pinnedCompareKeys","recitationRepeatCount","repeatCount","lastAudioPosition","autoAdvance","surahRepeatCount",
  "arabicLessonProgress","arabicAlphabetProgress","recentSearches","compareTranslationId","khatmahPlan"
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
  if (data.pinnedCompareKeys !== undefined && (!Array.isArray(data.pinnedCompareKeys) || data.pinnedCompareKeys.length > 2 || data.pinnedCompareKeys.some(value => !normalizeVerseKey(value)))) return { valid:false, error:"The pinned verse comparison list is invalid." };
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
  if (data.readerTranslationId !== undefined && !/^\d+$/.test(String(data.readerTranslationId))) return { valid:false, error:"The saved translation selection is invalid." };
  if (data.compareTranslationId !== undefined && data.compareTranslationId !== "" && !/^\d{1,12}$/.test(String(data.compareTranslationId))) return { valid:false, error:"The comparison translation selection is invalid." };
  if (data.khatmahPlan !== undefined && data.khatmahPlan !== null && (!data.khatmahPlan || typeof data.khatmahPlan !== "object" || ![30,60,90].includes(Number(data.khatmahPlan.durationDays)) || !/^\d{4}-\d{2}-\d{2}$/.test(String(data.khatmahPlan.startDateKey || "")))) return { valid:false, error:"The saved Qur’an completion plan is invalid." };
  for (const key of ["readerShowArabic","readerShowTranslation","readerShowWordByWord","remindersEnabled"]) if (data[key] !== undefined && typeof data[key] !== "boolean") return { valid:false, error:"The " + key + " setting in this backup is invalid." };
  if (data.recitationRepeatCount !== undefined && ![1,3,5].includes(data.recitationRepeatCount)) return { valid:false, error:"The saved ayah repeat setting is invalid." };
  for (const [key, item] of Object.entries(data)) if (/^lastAudioPosition_\d+$/.test(key) && (!Number.isFinite(item) || item < 0 || item > 86400)) return { valid:false, error:"A saved audio position is invalid." };
  return { valid:true, data };
}

const QURAN_TOTAL_AYAHS = 6236;

function normalizeAudioUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^(javascript|data):/i.test(raw) || raw.startsWith("//")) return "";
  return "https://audio.qurancdn.com/" + raw.replace(/^\/+/, "");
}

function normalizeTranslationIds(primary, secondary) {
  const values = [primary, secondary].map(value => String(value ?? "").trim()).filter(value => /^\d+$/.test(value));
  return [...new Set(values)].slice(0, 2).join(",");
}
function normalizeCollectionNames(value, defaultFavorites = true) {
  const values = Array.isArray(value) ? value : typeof value === "string" && value.trim() ? [value] : [];
  const names = [...new Set(values.map(item => String(item || "").trim()).filter(item => item.length > 0 && item.length <= 32))];
  return names.length || !defaultFavorites ? names : ["Favorites"];
}
function toggleCollectionMembership(existing, name) {
  const target = String(name || "").trim();
  if (!target || target.length > 32) return normalizeCollectionNames(existing);
  const current = normalizeCollectionNames(existing);
  return current.includes(target) ? current.filter(item => item !== target) : [...current, target];
}
function dateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}
function dateKeyToUtc(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  return match ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : NaN;
}
function createKhatmahPlan(durationDays = 30, startDate = new Date()) {
  const duration = [30, 60, 90].includes(Number(durationDays)) ? Number(durationDays) : 30;
  return {
    version: 1,
    durationDays: duration,
    totalAyahs: QURAN_TOTAL_AYAHS,
    dailyAyahTarget: Math.ceil(QURAN_TOTAL_AYAHS / duration),
    startDateKey: dateKey(startDate),
    createdAt: (startDate instanceof Date ? startDate : new Date(startDate)).toISOString()
  };
}
function summarizeKhatmahProgress(activity, plan, today = new Date()) {
  if (!plan || ![30, 60, 90].includes(Number(plan.durationDays))) return null;
  const start = dateKeyToUtc(plan.startDateKey);
  const current = dateKeyToUtc(dateKey(today));
  if (!Number.isFinite(start) || !Number.isFinite(current)) return null;
  const duration = Number(plan.durationDays);
  const elapsedDays = Math.max(0, Math.min(duration, Math.floor((current - start) / 86400000) + 1));
  const completed = new Set();
  for (const [key, day] of Object.entries(activity || {})) {
    if (dateKeyToUtc(key) < start || !day || !Array.isArray(day.readingAyahs)) continue;
    for (const reference of day.readingAyahs) {
      const normalized = normalizeVerseKey(reference);
      if (normalized) completed.add(normalized);
    }
  }
  const completedAyahs = Math.min(QURAN_TOTAL_AYAHS, completed.size);
  const todayKey = dateKey(today);
  const todayRead = new Set((activity?.[todayKey]?.readingAyahs || []).map(normalizeVerseKey).filter(Boolean)).size;
  const target = Math.min(Number(plan.dailyAyahTarget) || Math.ceil(QURAN_TOTAL_AYAHS / duration), QURAN_TOTAL_AYAHS - completedAyahs);
  const dueByToday = Math.min(QURAN_TOTAL_AYAHS, Math.ceil(QURAN_TOTAL_AYAHS * elapsedDays / duration));
  return {
    totalAyahs: QURAN_TOTAL_AYAHS,
    completedAyahs,
    remainingAyahs: Math.max(0, QURAN_TOTAL_AYAHS - completedAyahs),
    elapsedDays,
    daysRemaining: Math.max(0, duration - elapsedDays),
    dailyAyahTarget: target,
    readToday: todayRead,
    remainingToday: Math.max(0, target - todayRead),
    dueByToday,
    aheadOrBehind: completedAyahs - dueByToday,
    percent: Math.round(completedAyahs / QURAN_TOTAL_AYAHS * 100)
  };
}

module.exports = { QURAN_TOTAL_AYAHS, createKhatmahPlan, summarizeKhatmahProgress, normalizeAudioUrl, normalizeTranslationIds, normalizeCollectionNames, toggleCollectionMembership, BACKUP_SCHEMA_VERSION, BACKUP_PREFERENCE_KEYS, normalizeVerseKey, readerPageForAyah, languageCodeFor, mergeRecentSearches, validateAyahBackup };
