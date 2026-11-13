import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const [app,server,config,utilities,apiClient,persistentHook,packageJson] = await Promise.all([
  readFile(new URL("../App.js", import.meta.url), "utf8"),
  readFile(new URL("../server/index.js", import.meta.url), "utf8"),
  readFile(new URL("../app.json", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/ayah-utils.js", import.meta.url), "utf8"),
  readFile(new URL("../src/services/ayah-api.js", import.meta.url), "utf8"),
  readFile(new URL("../src/hooks/use-persistent-state.js", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8")
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
  ["pinned ayah comparison persists locally", app.includes("usePersistentState(\"pinnedCompareKeys\", [])") && app.includes("setPinnedCompareDetails={setPinnedCompareDetails}") && app.includes("Compare pinned ayahs")],
  ["verse sharing is available from the reader", app.includes("Share ayah") && app.includes("Share.share({title:chapter.name_simple")],
  ["study notebook supports multiple collections", app.includes("toggleCollectionMembership(current[key],name)") && app.includes("Add to or remove from collections")],
  ["learning insights include a 30-day activity heatmap", app.includes("Last 30 days") && app.includes("activeMonthDays")],
  ["audio URL normalization restricts external hosts", utilities.includes("audio.qurancdn.com") && utilities.includes("verses.quran.foundation") && utilities.includes("normalizeAudioUrl")],]);

checks.push(...[  ["navigation supports Manzil and Ruku", app.includes("manzil:") && app.includes("ruku:") && app.includes("by-manzil/") && app.includes("by-ruku/")],
  ["random ayah discovery is reachable", app.includes("Random ayah") && app.includes("/verses/random")],
  ["Mushaf line view uses supplied line metadata", app.includes("pageLineMap") && app.includes("word.line_number") && app.includes("Mushaf lines")],
  ["reader pins preserve verse details across pages", app.includes("pinnedCompareDetails") && app.includes("Compare pinned ayahs")],
  ["bookmarks allow an explicitly empty collection list", utilities.includes("if (isArray) return names;")],
  ["verse references check each surah ayah count", utilities.includes("SURAH_AYAH_COUNTS[surah - 1]")],
  ["backup validator covers pinned verse detail data", utilities.includes("pinnedCompareDetails") && utilities.includes("pinnedCompareKeys")],]);

checks.push(...[  ["navigation error messages include Manzil and Ruku", app.includes("manzil:\"Manzil\"") && app.includes("ruku:\"Ruku\"")],
  ["translation reading mode is stored and backed up", app.includes("readerTranslationReadingMode") && utilities.includes('"readerTranslationReadingMode"') && utilities.includes("typeof data[key] !== \"boolean\"")],
  ["Surah information uses the source chapter-info route", app.includes("function SurahInfoSection") && app.includes("/chapters/\"+chapterId+\"/info")],
  ["random ayah requests include translation and supported page limit", app.includes("/verses/random") && app.includes("translation_id:\"131\"") && app.includes("1–604") && server.includes("/api/verses/random")],
  ["reader comparison details are owned by root app state", app.includes("usePersistentState(\"pinnedCompareDetails\", {})") && app.includes("setPinnedCompareDetails={setPinnedCompareDetails}")],]);

checks.push(...[  ["random ayah API rejects malformed verse keys instead of accepting them", server.includes("!/^\\d{1,3}:\\d{1,3}$/.test(String(verse.verse_key||\"\"))")],
  ["all six navigation modes have validation and endpoint mappings", app.includes("manzil:\"Manzil\"") && app.includes("ruku:\"Ruku\"") && server.includes("/api/verses/by-manzil/") && server.includes("/api/verses/by-ruku/")],
  ["Mushaf-aware page browsing requests layout metadata", server.includes("\"line_number\"") && server.includes("\"page_number\"") && app.includes("word.line_number")],]);

checks.push(...[  ["Arabic starter lesson contains twelve reviewed vocabulary entries", app.includes('word: "مِفْتَاحٌ"') && app.includes('word: "مَدْرَسَةٌ"') && app.includes('prompt: "Which word means “a key”?"')],
  ["Arabic alphabet classroom includes all 28 letters", app.includes('letter: "ي"') && app.includes('letter: "ش"') && app.includes("ALL 28 LETTERS")],
  ["Arabic alphabet checkpoint samples twelve different letters", app.includes("const quizLetters = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 27]")],
  ["Home screen contains only one Khatmah shortcut", (app.match(/title="Qur’an completion plan"/g)||[]).length === 1],]);

checks.push(...[  ["Arabic alphabet lesson includes four connected letter forms", app.includes("const ALPHABET_JOINING_FORMS") && app.includes('isolated:"ا"') && app.includes('initial:"بـ"') && app.includes('medial:"ـبـ"') && app.includes('final:"ـب"') && app.includes("connectsNext:false")],]);

checks.push(
  ["chapter audio requests optional word timing segments", server.includes("/chapter_recitations/") && server.includes("?segments=true")],
  ["reader resolves active verse and word timing", app.includes("getActiveAudioTiming(verseTimestamps,chapterAudioStatus?.currentTime)") && app.includes("activeSyncedWordIndex")],
  ["active word styling uses the reader theme", app.includes("Number(word.position) === activeSyncedWordIndex") && app.includes("backgroundColor: PANEL")],
  ["word timing helper validates verse keys and millisecond ranges", utilities.includes("function getActiveAudioTiming") && utilities.includes("timestamp_from") && utilities.includes("timestamp_to") && utilities.includes("normalizeVerseKey(item.verse_key")],
  ["audio timing helper is covered by unit tests", (await readFile(new URL("../scripts/test-ayah-utils.mjs", import.meta.url), "utf8")).includes("resolves the active ayah and word"))
);

checks.push(
  ["recitation speed is stored and applied to both audio players", app.includes('usePersistentState("audioPlaybackRate",1)') && app.includes('setPlaybackRate(rate,"high")') && app.includes("Playback speed")],
  ["audio playback speed is included in validated backups", utilities.includes('"audioPlaybackRate"') && utilities.includes("data.audioPlaybackRate")],
  ["audio playback speed has an allowlisted range", utilities.includes("[0.75,1,1.25,1.5].includes(data.audioPlaybackRate)")],
  ["audio speed preference has positive and negative unit tests", (await readFile(new URL("../scripts/test-ayah-utils.mjs", import.meta.url), "utf8")).includes("accepts supported recitation speeds"))
);


checks.push(
  ["memorization session mounts without an undefined progress reference", app.includes("const [completed, setCompleted] = useState(false);") && !app.slice(app.indexOf("function BuildMemorizationSessionScreen"),app.indexOf("function SmartRevisionScreen")).includes("progress.completed")],
  ["random ayah route reads the provider verse payload before validation", server.includes("const verse=data.verse || data;") && server.includes("if(!verse || !/^\\\\d{1,3}:\\\\d{1,3}$/.test(String(verse.verse_key||\"\")))")],
  ["random ayah route has one provider reference validation", (server.match(/content provider returned an invalid random verse/g)||[]).length === 1]
);


checks.push(
  ["shared API client validates HTTP(S) base URLs", apiClient.includes("function normalizeApiBase") && apiClient.includes('["http:", "https:"]')],
  ["shared API client rejects unsafe relative paths", apiClient.includes("function buildApiUrl") && apiClient.includes('route.startsWith("//")') && apiClient.includes('part === ".."')],
  ["shared API client centralizes JSON and HTTP errors", apiClient.includes("async function requestJson") && apiClient.includes("INVALID_JSON") && apiClient.includes("HTTP_ERROR")],
  ["backend diagnostics uses the shared API client", app.includes('requestJson("/status",{baseUrl:AYAH_API_BASE})')],
  ["Qur’an search uses the shared API client with cancellation", app.includes("requestJson(\"/search?q=\"") && app.includes("signal:controller.signal")],
  ["reciter catalogue and preview use the shared API client", app.includes('requestJson("/audio/reciters?language="') && app.includes('requestJson("/audio/chapters/"+encodeURIComponent(id)')],
  ["Tafsir catalogue and commentary use the shared API client", app.includes('requestJson("/tafsirs?language=en"') && app.includes('requestJson("/tafsirs/" + encodeURIComponent(resourceId)')],
  ["persistent preferences are isolated in a reusable hook", app.includes('from "./src/hooks/use-persistent-state"') && persistentHook.includes("export default function usePersistentState") && persistentHook.includes("AsyncStorage.getItem")],
  ["preference storage namespace remains stable after extraction", app.includes("PREFERENCES_KEY") && persistentHook.includes('export const PREFERENCES_KEY = "@ayah/preferences-v1"')],
  ["unit test command includes all test files", packageJson.includes('node --test scripts/test-*.mjs')]
);

const cloudSyncSource = await readFile(new URL("../src/services/cloud-sync.js", import.meta.url), "utf8");
const cloudSyncTests = await readFile(new URL("../scripts/test-cloud-sync.mjs", import.meta.url), "utf8");
checks.push(
  ["cloud sync payload has a versioned schema and explicit allowlist", cloudSyncSource.includes("CLOUD_SYNC_SCHEMA_VERSION = 1") && cloudSyncSource.includes("SYNCABLE_KEYS")],
  ["cloud sync excludes credentials and personal contact fields", !cloudSyncSource.includes('"accessToken"') && !cloudSyncSource.includes('"email"') && cloudSyncTests.includes('includes("accessToken"), false')],
  ["cloud sync restore checks account ownership", cloudSyncSource.includes("USER_MISMATCH") && cloudSyncSource.includes("expectedUserId")],
  ["cloud sync contract has dedicated unit tests", cloudSyncTests.includes("cloud sync validates schema and prevents cross-account restore"))
);

const offlineSource = await readFile(new URL("../src/services/offline-library.js", import.meta.url), "utf8");
const offlineTests = await readFile(new URL("../scripts/test-offline-library.mjs", import.meta.url), "utf8");
checks.push(
  ["offline library uses a versioned local storage namespace", offlineSource.includes("OFFLINE_SCHEMA_VERSION = 1") && offlineSource.includes("@ayah/offline-surah-v1:")],
  ["offline surah packages require every ayah in the selected chapter", offlineSource.includes("INCOMPLETE_SURAH") && offlineSource.includes("MISSING_VERSE") && offlineSource.includes("DUPLICATE_VERSE")],
  ["offline surah validation checks Arabic text and chapter references", offlineSource.includes("MISSING_ARABIC") && offlineSource.includes("VERSE_MISMATCH")],
  ["offline storage supports listing, retrieval, removal, and clearing", offlineSource.includes("async function list()") && offlineSource.includes("async function get(chapterId)") && offlineSource.includes("async function remove(chapterId)") && offlineSource.includes("async function clear()")],
  ["offline storage tests cover validation and lifecycle", offlineTests.includes("offline storage saves, lists, reads, replaces, and removes selected surahs") && offlineTests.includes("offline storage clears only its own indexed surah packages"))
);

const offlineStorageAdapter = await readFile(new URL("../src/services/offline-library-storage.js", import.meta.url), "utf8");
checks.push(
  ["offline library is connected to device AsyncStorage through an adapter", offlineStorageAdapter.includes('from "@react-native-async-storage/async-storage"') && offlineStorageAdapter.includes("createOfflineStorage") && offlineStorageAdapter.includes("AsyncStorage.setItem")]
);

const offlineScreen = await readFile(new URL("../src/screens/offline-library-screen.js", import.meta.url), "utf8");
checks.push(
  ["offline library screen is reachable from the home screen", app.includes('title="Offline library"') && app.includes('tab === "offline"') && app.includes("OfflineLibraryScreen")],
  ["offline download fetches every page of a selected surah", offlineScreen.includes("Math.ceil(total/pageSize)") && offlineScreen.includes("for(let page=1;page<=pages;page++)")],
  ["offline download requires a selected translation and reports progress", offlineScreen.includes("translationId") && offlineScreen.includes("setProgress({done:Math.min(all.length,total)")],
  ["offline screen manages saved packages and approximate storage", offlineScreen.includes("offlineStorage.list()") && offlineScreen.includes("offlineStorage.remove(id)") && offlineScreen.includes("totalBytes")],
  ["reader can fall back to a matching saved surah when network access fails", app.includes("offlineStorage.get(chapter.id)") && app.includes("saved.translationId") && app.includes("Offline mode")],
  ["offline screen clearly separates text downloads from audio", offlineScreen.includes("Recitation audio is not included"))
);

checks.push(
  ["offline packages require a numeric selected translation", offlineSource.includes("INVALID_TRANSLATION") && offlineSource.includes("MISSING_TRANSLATION")],
  ["offline packages reject a translation that differs from the requested ID", offlineSource.includes("TRANSLATION_MISMATCH") && offlineSource.includes("returned translation does not match"))
);

checks.push(
  ["reader can save up to three named reading bookmarks", app.includes("readingBookmarks = []") && app.includes("onSaveReadingBookmark") && app.includes('title="Reading bookmarks"')],
  ["reading bookmark manager supports resume, rename, and removal", app.includes("function ReadingBookmarksScreen") && app.includes("onRename(item.id,value)") && app.includes("onDelete(item.id)")],
  ["reading bookmarks persist locally and appear on home", app.includes('usePersistentState("readingBookmarks", [])') && app.includes('onNavigate("readingBookmarks")')],
  ["reading bookmarks are included in backup restore and reset", app.includes("setReadingBookmarks(data.readingBookmarks)") && app.includes("setReadingBookmarks([])")],
  ["backup validation limits reading bookmarks to three valid ayah references", utilities.includes('"readingBookmarks"') && utilities.includes("data.readingBookmarks.length > 3") && utilities.includes("normalizeVerseKey(String(item.chapterId)+\":\"+String(item.ayah))")],
  ["reading bookmark backup tests cover limits and malformed data", (await readFile(new URL("../scripts/test-ayah-utils.mjs", import.meta.url), "utf8")).includes("validates up to three named reading bookmarks in backups")]
);

checks.push(
  ["recitation practice uses Expo audio recording and playback hooks", app.includes("useAudioRecorder") && app.includes("useAudioRecorderState") && app.includes("useAudioPlayer(null)")],
  ["microphone permission is requested only when recording starts", app.includes("AudioModule.requestRecordingPermissionsAsync()") && app.includes("const startRecording = async")],
  ["recitation recording has a bounded 90-second duration", app.includes("MAX_DURATION_MS = 90000") && app.includes("recorderState.durationMillis)>=MAX_DURATION_MS")],
  ["recorded practice can be replayed and discarded", app.includes("player.replace(recordingUri)") && app.includes("Delete this recording")],
  ["recitation practice is explicitly local and does not claim AI evaluation", app.includes("not uploaded or shared") && app.includes("does not verify the words or judge Tajweed")],
  ["recitation practice can open from home and a selected ayah", app.includes('title="Recitation practice"') && app.includes("onOpenRecorder?.(key,chapter.name_simple)")],
  ["microphone permission copy and background recording setting are explicit", config.includes("microphonePermission") && config.includes("enableBackgroundRecording") && config.includes("false")]
);

for (const [name, passed] of checks) {
  assert.equal(passed, true, "Failed check: " + name);
}
console.log("Ayah project checks passed: " + checks.length);
