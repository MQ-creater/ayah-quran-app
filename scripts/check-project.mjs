import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const [app,server,config,utilities] = await Promise.all([
  readFile(new URL("../App.js", import.meta.url), "utf8"),
  readFile(new URL("../server/index.js", import.meta.url), "utf8"),
  readFile(new URL("../app.json", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/ayah-utils.js", import.meta.url), "utf8")
]);

const checks = [
  ["safe JSON preference loading", app.includes("setValue(JSON.parse(raw))") && !app.includes("const saved = JSON.parse(raw)")],
  ["explicit reader completion tracking", app.includes('onMarkAyahRead={key=>recordDailyActivity("readingAyahs",[key])') && !app.includes("onRecordReading?.(incoming.map")],
  ["stable verse references under filters", app.includes("verses.map((verse,index)=>({verse,index,key:verse.verse_key")],
  ["bounded practice history", app.includes("PRACTICE_HISTORY_LIMIT") && app.includes(".slice(0,PRACTICE_HISTORY_LIMIT)")],
  ["learning insights", app.includes("function LearningInsightsScreen")],
  ["local data backup and reset", app.includes("function DataPrivacyScreen") && app.includes("Share.share") && app.includes("Clear local Ayah data")],
  ["adjustable daily targets", app.includes('usePersistentState("dailyTargets",{reading:5,memorization:1})')],
  ["ayah range queue and stop control", app.includes("Play selected range") && app.includes("Stop ayah queue")],
  ["recall mode", app.includes("Hide Arabic · Recall") && app.includes("showArabic && !recallMode")],
  ["backend connection diagnostics", app.includes("function BackendStatusScreen") && app.includes('fetch(base+"/status")')],
  ["production CORS allowlist", server.includes("ALLOWED_ORIGINS must contain") && server.includes("allowedOrigins.includes(origin)")],
  ["bounded provider request timeouts", server.includes("AbortSignal.timeout(15000)")],
  ["server status endpoint", server.includes('app.get("/api/status"')],
  ["mobile bundle contains no provider secret variable", !app.includes("QF_CLIENT_SECRET")],
  ["copyable backup fallback", app.includes("backupPreview") && app.includes("<Text selectable")],
  ["reader audio players coordinate", app.includes("chapterPlayer.pause();setActiveSyncedVerseKey") && app.includes("wordPlayer.pause();setActiveAudioKey(null)")],
  ["clean grouped home navigation", app.includes("MEMORIZE & REVIEW") && app.includes("READ & STUDY QUR’AN") && app.includes("APP & DATA")],
  ["session history preserves surah references", app.includes("chapterName:selectedChapter?.name_simple") && app.includes("ayahReference:passage.reference")],
  ["backend diagnostics screen is reachable from home", app.includes('title="Connection status"') && app.includes('tab === "backend"')],
  ["backup import uses a schema validator", app.includes("validateAyahBackup(parsed)") && app.includes("Validate and restore backup")],
  ["continue reading restores saved ayah", app.includes("setSearchInitialAyah(Number(lastReadPosition.ayah||1))")],
  ["reader translation preferences persist", app.includes('usePersistentState("readerTranslationId", "131")') && app.includes('usePersistentState("readerTranslationLanguage", "en")')],
  ["search handles direct ayah references", app.includes("normalizeVerseKey(term)") && app.includes("readerPageForAyah(ayah)")],
  ["search history is persisted", app.includes('usePersistentState("recentSearches",[])') && app.includes("Recent searches")],
  ["Arabic vocabulary starter expanded", app.includes("مَسْجِدٌ") && app.includes("مَاءٌ")],
  ["Arabic alphabet classroom expanded", app.includes("LETTER CLASSROOM · FIRST 12 LETTERS")],
  ["Arabic learning progress persists", app.includes('usePersistentState("arabicLessonProgress"') && app.includes('usePersistentState("arabicAlphabetProgress"')],
  ["server caches provider reads", server.includes("RESPONSE_CACHE_LIMIT") && server.includes("cacheKey")],
  ["search endpoint has additional rate limit", server.includes("searchRateLimit") && server.includes("limit:20")],
  ["verse pagination is bounded", server.includes("page > 500") && server.includes("perPage > 50")],
  ["provider errors are mapped to gateway errors", server.includes("response.status === 429 ? 503 : 502")],
  ["shared utilities use Metro-compatible JavaScript module", app.includes('import ayahUtils from "./src/lib/ayah-utils"')],
  ["recent search replay uses the selected chip query", app.includes('String(requestedTerm || "").trim()')],
  ["Arabic lesson completion resumes after reopening", app.includes("useState(Boolean(progress.completed))")],
  ["alphabet progress stores a count, not an index", app.includes("highestLetter:Math.max(Number(current.highestLetter||0),value+1)")],
  ["restore resets new local learning progress", app.includes("setArabicLessonProgress({highestWord:0") && app.includes("setRecentSearches([])")],
  ["backup validator rejects malformed preference types", app.includes("validateAyahBackup(parsed)") && app.includes("Backup not recognized")],
  ["Auto appearance follows the device", config.includes('"userInterfaceStyle": "automatic"')],
  ["shared utility exports the backup validator", utilities.includes("module.exports") && utilities.includes("validateAyahBackup")]
]; 

checks.push(...[  ["Mushaf page and Juz navigation APIs", server.includes("/api/verses/by-page/:pageNumber") && server.includes("/api/verses/by-juz/:juzNumber") && server.includes("/verses/by_page/") && server.includes("/verses/by_juz/")],
  ["related hadith endpoint uses separate least-privilege token", server.includes("/api/hadith/:surah/:ayah") && server.includes("content.hadith.read") && server.includes("cachedHadithToken")],
  ["reader has on-demand related hadith study", app.includes("function RelatedHadithSection") && app.includes("Related hadith and sources") && app.includes("/hadith/")],
  ["Qur’an navigation screen supports Juz and Mushaf page", app.includes("function QuranNavigationScreen") && app.includes("Browse Qur’an sections") && app.includes("by-page/") && app.includes("by-juz/") && app.includes("by-hizb/") && app.includes("by-rub-al-hizb/")],
  ["Khatmah plan is reachable from home", app.includes("function KhatmahPlanScreen") && app.includes("Qur’an completion plan") && app.includes("tab === \"khatmah\"")],
  ["reader supports two provider translations", app.includes("normalizeTranslationIds(translationId, compareTranslationId)") && app.includes("Compare with a second translation")],
  ["pinned ayah comparison persists locally", app.includes("usePersistentState(\"pinnedCompareKeys\",[])") && app.includes("Compare pinned ayahs")],
  ["verse sharing is available from the reader", app.includes("Share ayah") && app.includes("Share.share({title:chapter.name_simple")],
  ["study notebook supports multiple collections", app.includes("toggleCollectionMembership(current[key],name)") && app.includes("Add to or remove from collections")],
  ["learning insights include a 30-day activity heatmap", app.includes("Last 30 days") && app.includes("activeMonthDays")],
  ["audio URL normalization restricts external hosts", utilities.includes("audio.qurancdn.com") && utilities.includes("verses.quran.foundation") && utilities.includes("normalizeAudioUrl")],]);

checks.push(...[  ["navigation supports Manzil and Ruku", app.includes("manzil:") && app.includes("ruku:") && app.includes("by-manzil/") && app.includes("by-ruku/")],
  ["random ayah discovery is reachable", app.includes("Random ayah") && app.includes("/random-ayah")],
  ["Mushaf line view uses supplied line metadata", app.includes("pageLineMap") && app.includes("word.line_number") && app.includes("Mushaf lines")],
  ["reader pins preserve verse details across pages", app.includes("pinnedCompareDetails") && app.includes("Compare pinned ayahs")],
  ["bookmarks allow an explicitly empty collection list", utilities.includes("if (isArray) return names;")],
  ["verse references check each surah ayah count", utilities.includes("SURAH_AYAH_COUNTS[surah - 1]")],
  ["backup validator covers pinned verse detail data", utilities.includes("pinnedCompareDetails") && utilities.includes("pinnedCompareKeys")],]);

for (const [name, passed] of checks) {
  assert.equal(passed, true, "Failed check: " + name);
}
console.log("Ayah project checks passed: " + checks.length);
