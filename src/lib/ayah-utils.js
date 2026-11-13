const BACKUP_SCHEMA_VERSION = 1;
const BACKUP_PREFERENCE_KEYS = [
  "practiceCount","practiceHistory","dailyTargets","memorizationPlan","reviewRecords",
  "memorizationProgress","savedIds","favoriteReciterIds","preferredReciterId","preferredReciterName",
  "savedVerseDetails","readerNotes","ayahCollections","lastReadPosition","readingBookmarks","themeName",
  "learningLanguage","dailyGoal","dailyActivity","remindersEnabled","readerArabicSize",
  "readerShowArabic","readerShowTranslation","readerShowWordByWord","readerArabicScript",
  "readerTranslationFont","readerTranslationLanguage","readerTranslationId","readerTranslationReadingMode","pinnedCompareKeys","pinnedCompareDetails","recitationRepeatCount","repeatCount","lastAudioPosition","autoAdvance","surahRepeatCount",
  "arabicLessonProgress","arabicAlphabetProgress","recentSearches","compareTranslationId","khatmahPlan","audioPlaybackRate"
];
function normalizeVerseKey(value) {
  const match = /^(\d{1,3}):(\d{1,3})$/.exec(String(value || "").trim());
  if (!match) return null;
  const surah = Number(match[1]), ayah = Number(match[2]);
  if (!Number.isInteger(surah) || surah < 1 || surah > 114 || !Number.isInteger(ayah) || ayah < 1 || ayah > SURAH_AYAH_COUNTS[surah - 1]) return null;
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
  if (data.readingBookmarks !== undefined && (data.readingBookmarks.length > 3 || data.readingBookmarks.some(item => !item || typeof item !== "object" || Array.isArray(item) || typeof item.id !== "string" || typeof item.title !== "string" || item.title.length > 30 || !Number.isInteger(Number(item.chapterId)) || Number(item.chapterId) < 1 || Number(item.chapterId) > 114 || !normalizeVerseKey(String(item.chapterId)+":"+String(item.ayah)) || !item.chapter || typeof item.chapter !== "object" || Array.isArray(item.chapter) || Number(item.chapter.id) !== Number(item.chapterId) || item.id !== String(item.chapterId)+":"+String(item.ayah)))) return { valid:false, error:"The reading bookmarks are invalid." };
  const arrayKeys = ["savedIds","favoriteReciterIds","practiceHistory","recentSearches","readingBookmarks"];
  for (const key of arrayKeys) if (data[key] !== undefined && !Array.isArray(data[key])) return { valid:false, error:"The " + key + " list in this backup is invalid." };
  if (data.pinnedCompareKeys !== undefined && (!Array.isArray(data.pinnedCompareKeys) || data.pinnedCompareKeys.length > 2 || data.pinnedCompareKeys.some(value => !normalizeVerseKey(value)))) return { valid:false, error:"The pinned verse comparison list is invalid." };
  if (data.pinnedCompareDetails !== undefined && (!data.pinnedCompareDetails || typeof data.pinnedCompareDetails !== "object" || Array.isArray(data.pinnedCompareDetails) || !Array.isArray(data.pinnedCompareKeys) || Object.keys(data.pinnedCompareDetails).length > 2 || Object.entries(data.pinnedCompareDetails).some(([key,value]) => !normalizeVerseKey(key) || !data.pinnedCompareKeys.includes(normalizeVerseKey(key)) || !value || typeof value !== "object" || (value.arabic !== undefined && typeof value.arabic !== "string") || (value.translation !== undefined && typeof value.translation !== "string") || (value.comparisonTranslation !== undefined && typeof value.comparisonTranslation !== "string") || (value.comparisonName !== undefined && typeof value.comparisonName !== "string") || (value.reference !== undefined && typeof value.reference !== "string")))) return { valid:false, error:"The pinned verse comparison details are invalid." };
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
  for (const key of ["readerShowArabic","readerShowTranslation","readerShowWordByWord","readerTranslationReadingMode","remindersEnabled"]) if (data[key] !== undefined && typeof data[key] !== "boolean") return { valid:false, error:"The " + key + " setting in this backup is invalid." };
  if (data.recitationRepeatCount !== undefined && ![1,3,5].includes(data.recitationRepeatCount)) return { valid:false, error:"The saved ayah repeat setting is invalid." };
  if (data.audioPlaybackRate !== undefined && ![0.75,1,1.25,1.5].includes(data.audioPlaybackRate)) return { valid:false, error:"The saved audio playback speed is invalid." };
  for (const [key, item] of Object.entries(data)) if (/^lastAudioPosition_\d+$/.test(key) && (!Number.isFinite(item) || item < 0 || item > 86400)) return { valid:false, error:"A saved audio position is invalid." };
  return { valid:true, data };
}

const QURAN_TOTAL_AYAHS = 6236;
const SURAH_AYAH_COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

function getActiveAudioTiming(timestamps, currentTimeSeconds) {
  if (!Array.isArray(timestamps)) return null;
  const seconds = Number(currentTimeSeconds);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  const nowMs = seconds * 1000;
  for (const item of timestamps) {
    if (!item || typeof item !== "object") continue;
    const start = Number(item.timestamp_from);
    const end = Number(item.timestamp_to);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start || nowMs < start || nowMs >= end) continue;
    const verseKey = normalizeVerseKey(item.verse_key || item.verseKey || item.key);
    if (!verseKey) continue;
    let wordIndex = null;
    if (Array.isArray(item.segments)) {
      for (const segment of item.segments) {
        const index = Array.isArray(segment) ? Number(segment[0]) : Number(segment?.word_index ?? segment?.wordIndex);
        const wordStart = Array.isArray(segment) ? Number(segment[1]) : Number(segment?.start_ms ?? segment?.start);
        const wordEnd = Array.isArray(segment) ? Number(segment[2]) : Number(segment?.end_ms ?? segment?.end);
        if (Number.isInteger(index) && index > 0 && Number.isFinite(wordStart) && Number.isFinite(wordEnd) && wordEnd > wordStart && nowMs >= wordStart && nowMs < wordEnd) {
          wordIndex = index;
          break;
        }
      }
    }
    return { verseKey, wordIndex };
  }
  return null;
}

function normalizeAudioUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https:\/\/(?:audio\.qurancdn\.com|verses\.quran\.foundation)\//i.test(raw)) return raw;
  if (/^(javascript|data):/i.test(raw) || raw.startsWith("//")) return "";
  return "https://audio.qurancdn.com/" + raw.replace(/^\/+/, "");
}

function normalizeTranslationIds(primary, secondary) {
  const first = String(primary ?? "").trim();
  if (!/^\d+$/.test(first)) return "";
  const second = String(secondary ?? "").trim();
  return /^\d+$/.test(second) && second !== first ? first + "," + second : first;
}
function normalizeCollectionNames(value, defaultFavorites = true) {
  const isArray = Array.isArray(value);
  const values = isArray ? value : typeof value === "string" && value.trim() ? [value] : [];
  const names = [...new Set(values.map(item => String(item || "").trim()).filter(item => item.length > 0 && item.length <= 32))];
  if (isArray) return names;
  return names.length ? names : defaultFavorites ? ["Favorites"] : [];
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
  if (!match) return NaN;
  const year=Number(match[1]), month=Number(match[2]), day=Number(match[3]);
  const timestamp=Date.UTC(year,month-1,day);
  const normalized=new Date(timestamp);
  return normalized.getUTCFullYear()===year && normalized.getUTCMonth()===month-1 && normalized.getUTCDate()===day ? timestamp : NaN;
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

module.exports = { SURAH_AYAH_COUNTS, QURAN_TOTAL_AYAHS, getActiveAudioTiming, createKhatmahPlan, summarizeKhatmahProgress, normalizeAudioUrl, normalizeTranslationIds, normalizeCollectionNames, toggleCollectionMembership, BACKUP_SCHEMA_VERSION, BACKUP_PREFERENCE_KEYS, normalizeVerseKey, readerPageForAyah, languageCodeFor, mergeRecentSearches, validateAyahBackup };
