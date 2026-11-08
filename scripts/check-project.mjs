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
  ["mobile bundle contains no provider secret variable", !app.includes("QF_CLIENT_SECRET")]
];

for (const [name, passed] of checks) {
  assert.equal(passed, true, "Failed check: " + name);
}
console.log("Ayah project checks passed: " + checks.length);
