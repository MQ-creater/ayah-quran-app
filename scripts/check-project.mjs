import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const [app,server] = await Promise.all([
  readFile(new URL("../App.js", import.meta.url), "utf8"),
  readFile(new URL("../server/index.js", import.meta.url), "utf8")
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
  ["backend diagnostics screen is reachable from home", app.includes('title="Connection status"') && app.includes('tab === "backend"')]

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
  ["provider errors are mapped to gateway errors", server.includes("response.status === 429 ? 503 : 502")]
]; 

for (const [name, passed] of checks) {
  assert.equal(passed, true, "Failed check: " + name);
}
console.log("Ayah project checks passed: " + checks.length);
