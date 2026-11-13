import test from "node:test";
import assert from "node:assert/strict";
import ayahUtils from "../src/lib/ayah-utils.js";
const { getActiveAudioTiming, normalizeVerseKey, readerPageForAyah, languageCodeFor, mergeRecentSearches, validateAyahBackup, normalizeAudioUrl, SURAH_AYAH_COUNTS, normalizeTranslationIds, normalizeCollectionNames, toggleCollectionMembership, createKhatmahPlan, summarizeKhatmahProgress, QURAN_TOTAL_AYAHS } = ayahUtils;

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

test("validates the exact ayah limit for every surah",()=>{
  assert.equal(SURAH_AYAH_COUNTS.length,114);
  assert.equal(SURAH_AYAH_COUNTS.reduce((sum,count)=>sum+count,0),6236);
  assert.equal(normalizeVerseKey("1:7"),"1:7");
  assert.equal(normalizeVerseKey("1:8"),null);
  assert.equal(normalizeVerseKey("2:286"),"2:286");
  assert.equal(normalizeVerseKey("2:287"),null);
  assert.equal(normalizeVerseKey("114:6"),"114:6");
  assert.equal(normalizeVerseKey("114:7"),null);
});
test("removing the last bookmark collection keeps the ayah unassigned",()=>{
  assert.deepEqual(toggleCollectionMembership(["Favorites"],"Favorites"),[]);
  assert.deepEqual(normalizeCollectionNames([]),[]);
  assert.deepEqual(normalizeCollectionNames(undefined),["Favorites"]);
});
test("does not silently promote a secondary translation to primary",()=>{
  assert.equal(normalizeTranslationIds("bad","20"),"");
  assert.equal(normalizeTranslationIds("131","20"),"131,20");
  assert.equal(normalizeTranslationIds("131","131"),"131");
});
test("validates pinned comparison detail backups",()=>{
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{pinnedCompareDetails:{"2:255":{arabic:"test",translation:"meaning"}}}}).valid,true);
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{pinnedCompareDetails:{"bad":{arabic:"test"}}}}).valid,false);
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{pinnedCompareDetails:{"2:255":"text"}}}).valid,false);
});

test("rejects impossible calendar dates in reading plans",()=>{
  const malformed={durationDays:30,startDateKey:"2026-02-31"};
  assert.equal(summarizeKhatmahProgress({},malformed),null);
  const valid=createKhatmahPlan(30,new Date("2026-02-28T12:00:00"));
  assert.equal(summarizeKhatmahProgress({},valid,new Date("2026-03-01T12:00:00")).elapsedDays,2);
});
test("translation reading mode is accepted as a boolean backup setting",()=>{
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{readerTranslationReadingMode:true}}).valid,true);
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{readerTranslationReadingMode:"yes"}}).valid,false);
});
test("rejects pinned comparison detail that is not in the pin list",()=>{
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{pinnedCompareKeys:["2:255"],pinnedCompareDetails:{"3:18":{arabic:"text"}}}}).valid,false);
});


test("resolves the active ayah and word from chapter audio timing segments",()=>{
  const timestamps=[{
    verse_key:"2:255",
    timestamp_from:1000,
    timestamp_to:5000,
    segments:[[1,1000,2200],[2,2200,3500],[3,3500,5000]]
  }];
  assert.deepEqual(getActiveAudioTiming(timestamps,1.5),{verseKey:"2:255",wordIndex:1});
  assert.deepEqual(getActiveAudioTiming(timestamps,2.2),{verseKey:"2:255",wordIndex:2});
  assert.deepEqual(getActiveAudioTiming(timestamps,4.9),{verseKey:"2:255",wordIndex:3});
  assert.equal(getActiveAudioTiming(timestamps,5),null);
});

test("supports object-shaped word timing segments and safely ignores malformed timings",()=>{
  const timestamps=[
    {verse_key:"invalid",timestamp_from:0,timestamp_to:5000,segments:[[1,0,5000]]},
    {verse_key:"1:1",timestamp_from:0,timestamp_to:5000,segments:[{word_index:2,start_ms:1000,end_ms:3000}]}
  ];
  assert.deepEqual(getActiveAudioTiming(timestamps,2),{verseKey:"1:1",wordIndex:2});
  assert.equal(getActiveAudioTiming(timestamps,NaN),null);
  assert.equal(getActiveAudioTiming([],2),null);
  assert.equal(getActiveAudioTiming([{verse_key:"1:1",timestamp_from:4,timestamp_to:2}],1),null);
});

test("does not treat legacy negative or zero-length timestamp windows as active",()=>{
  assert.equal(getActiveAudioTiming([{verse_key:"1:1",timestamp_from:1000,timestamp_to:1000,segments:[[1,1000,1000]]}],1),null);
  assert.equal(getActiveAudioTiming([{verse_key:"1:1",timestamp_from:1000,timestamp_to:-1000}],0.5),null);
});


test("accepts supported recitation speeds and rejects unsafe backup values",()=>{
  for (const rate of [0.75,1,1.25,1.5]) {
    const result=validateAyahBackup({app:"Ayah",schemaVersion:1,data:{audioPlaybackRate:rate}});
    assert.equal(result.valid,true);
    assert.equal(result.data.audioPlaybackRate,rate);
  }
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{audioPlaybackRate:3}}).valid,false);
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{audioPlaybackRate:"fast"}}).valid,false);
});

test("validates up to three named reading bookmarks in backups",()=>{
  const valid=[{id:"2:255",title:"Morning reading",chapterId:"2",ayah:255},{id:"18:10",title:"Review",chapterId:"18",ayah:10}];
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{readingBookmarks:valid}}).valid,true);
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{readingBookmarks:[...valid,...valid.slice(0,2)]}}).valid,false);
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{readingBookmarks:[{...valid[0],id:"3:18"}]}}).valid,false);
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{readingBookmarks:[{...valid[0],title:"x".repeat(31)}]}}).valid,false);
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{readingBookmarks:"not-an-array"}}).valid,false);
});
