import test from "node:test";
import assert from "node:assert/strict";
import ayahUtils from "../src/lib/ayah-utils.js";
const { normalizeVerseKey, readerPageForAyah, languageCodeFor, mergeRecentSearches, validateAyahBackup, normalizeAudioUrl, normalizeTranslationIds, normalizeCollectionNames, toggleCollectionMembership, createKhatmahPlan, summarizeKhatmahProgress, QURAN_TOTAL_AYAHS } = ayahUtils;

test("normalizes valid verse references and rejects invalid ones",()=>{
  assert.equal(normalizeVerseKey("002:255"),"2:255");
  assert.equal(normalizeVerseKey("115:1"),null);
  assert.equal(normalizeVerseKey("2:0"),null);
  assert.equal(normalizeVerseKey("not-a-reference"),null);
});
test("maps ayah numbers to 50-verse reader pages",()=>{
  assert.equal(readerPageForAyah(1),1);
  assert.equal(readerPageForAyah(50),1);
  assert.equal(readerPageForAyah(51),2);
  assert.equal(readerPageForAyah(286),6);
});
test("maps app languages to provider language codes",()=>{
  assert.equal(languageCodeFor("English"),"en");
  assert.equal(languageCodeFor("اردو"),"ur");
  assert.equal(languageCodeFor("Bahasa Indonesia"),"id");
  assert.equal(languageCodeFor("unknown"),"en");
});
test("keeps recent searches unique and newest first",()=>{
  assert.deepEqual(mergeRecentSearches(["mercy","patience"],"  Mercy  "),["Mercy","patience"]);
  assert.deepEqual(mergeRecentSearches([],"a"),[]);
});
test("validates Ayah backups and filters unknown keys",()=>{
  const result=validateAyahBackup({app:"Ayah",schemaVersion:1,data:{savedIds:["2:255"],themeName:"dark",readerTranslationId:"131",recitationRepeatCount:3,lastAudioPosition_114:128,privateToken:"never-import"}});
  assert.equal(result.valid,true);
  assert.deepEqual(result.data,{savedIds:["2:255"],themeName:"dark",readerTranslationId:"131",recitationRepeatCount:3,lastAudioPosition_114:128});
  assert.equal(validateAyahBackup({app:"Other",schemaVersion:1,data:{savedIds:[]}}).valid,false);
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{savedIds:"wrong"}}).valid,false);
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{readerTranslationId:"not-a-number"}}).valid,false);
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{memorizationProgress:[]}}).valid,false);
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{lastAudioPosition_2:999999}}).valid,false);
});

test("normalizes a primary and comparison translation without duplicates",()=>{
  assert.equal(normalizeTranslationIds("131","20"),"131,20");
  assert.equal(normalizeTranslationIds("131","131"),"131");
  assert.equal(normalizeTranslationIds("bad","20"),"20");
  assert.equal(normalizeTranslationIds("131;DROP",""),"");
});
test("supports legacy and multiple bookmark collections",()=>{
  assert.deepEqual(normalizeCollectionNames("Study"),["Study"]);
  assert.deepEqual(normalizeCollectionNames(["Favorites","Study","Study"]),["Favorites","Study"]);
  assert.deepEqual(toggleCollectionMembership(["Favorites"],"Study"),["Favorites","Study"]);
  assert.deepEqual(toggleCollectionMembership(["Favorites","Study"],"Study"),["Favorites"]);
});
test("creates and summarizes a date-based Qur’an completion plan",()=>{
  const start=new Date("2026-11-09T12:00:00");
  const plan=createKhatmahPlan(30,start);
  assert.equal(plan.totalAyahs,QURAN_TOTAL_AYAHS);
  assert.equal(plan.dailyAyahTarget,Math.ceil(QURAN_TOTAL_AYAHS/30));
  const summary=summarizeKhatmahProgress({
    "2026-11-09":{readingAyahs:["1:1","1:2","1:2","invalid"]},
    "2026-11-08":{readingAyahs:["1:3"]}
  },plan,start);
  assert.equal(summary.completedAyahs,2);
  assert.equal(summary.readToday,2);
  assert.equal(summary.elapsedDays,1);
  assert.equal(summary.percent,0);
});
test("rejects invalid khatmah and comparison preferences during backup restore",()=>{
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{compareTranslationId:"x"}}).valid,false);
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{khatmahPlan:{durationDays:999,startDateKey:"bad"}}}).valid,false);
});

test("normalizes approved audio URLs and rejects unsafe or unknown hosts",()=>{
  assert.equal(normalizeAudioUrl("wbw/001_001_001.mp3"),"https://audio.qurancdn.com/wbw/001_001_001.mp3");
  assert.equal(normalizeAudioUrl("https://verses.quran.foundation/Alafasy/mp3/001001.mp3"),"https://verses.quran.foundation/Alafasy/mp3/001001.mp3");
  assert.equal(normalizeAudioUrl("javascript:alert(1)"),"");
  assert.equal(normalizeAudioUrl("//example.com/audio.mp3"),"");
  assert.equal(normalizeAudioUrl("https://example.com/audio.mp3"),"");
});
test("validates persisted pinned verse comparisons",()=>{
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{pinnedCompareKeys:["2:255","3:18"]}}).valid,true);
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{pinnedCompareKeys:["2:255","bad"]}}).valid,false);
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{pinnedCompareKeys:["1:1","1:2","1:3"]}}).valid,false);
});
