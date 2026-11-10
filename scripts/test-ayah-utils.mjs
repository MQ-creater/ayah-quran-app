import test from "node:test";
import assert from "node:assert/strict";
import { normalizeVerseKey, readerPageForAyah, languageCodeFor, mergeRecentSearches, validateAyahBackup } from "../src/lib/ayah-utils.mjs";

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
  const result=validateAyahBackup({app:"Ayah",schemaVersion:1,data:{savedIds:["2:255"],themeName:"dark",privateToken:"never-import"}});
  assert.equal(result.valid,true);
  assert.deepEqual(result.data,{savedIds:["2:255"],themeName:"dark"});
  assert.equal(validateAyahBackup({app:"Other",schemaVersion:1,data:{savedIds:[]}}).valid,false);
  assert.equal(validateAyahBackup({app:"Ayah",schemaVersion:1,data:{savedIds:"wrong"}}).valid,false);
});
