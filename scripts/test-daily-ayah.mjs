import test from "node:test";
import assert from "node:assert/strict";
import ayahUtils from "../src/lib/ayah-utils.js";

const { normalizeDailyAyah } = ayahUtils;

test("normalizes a source-backed daily ayah and removes translation markup", () => {
  const result = normalizeDailyAyah({
    verse_key: "2:255",
    text_qpc_hafs: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ",
    translations: [{ text: "<p>Allah—there is no deity except Him.&nbsp;</p>" }]
  }, "2026-11-24");

  assert.deepEqual(result, {
    date: "2026-11-24",
    reference: "2:255",
    arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ",
    translation: "Allah—there is no deity except Him."
  });
});

test("uses the Uthmani source text when QPC Hafs text is absent", () => {
  const result = normalizeDailyAyah({
    verse_key: "1:1",
    text_uthmani: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    translations: [{ text: "In the name of Allah, the Most Compassionate, Most Merciful." }]
  }, "2026-11-24");

  assert.equal(result?.reference, "1:1");
  assert.equal(result?.arabic, "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ");
});

test("rejects invalid references, invalid dates, and incomplete daily ayahs", () => {
  const valid = {
    verse_key: "2:255",
    text_qpc_hafs: "آيَةٌ",
    translations: [{ text: "A verse." }]
  };

  assert.equal(normalizeDailyAyah({ ...valid, verse_key: "2:999" }, "2026-11-24"), null);
  assert.equal(normalizeDailyAyah({ ...valid, verse_key: "0:1" }, "2026-11-24"), null);
  assert.equal(normalizeDailyAyah({ ...valid, text_qpc_hafs: "" }, "2026-11-24"), null);
  assert.equal(normalizeDailyAyah({ ...valid, translations: [] }, "2026-11-24"), null);
  assert.equal(normalizeDailyAyah(valid, "2026-02-30"), null);
  assert.equal(normalizeDailyAyah(valid, "not-a-date"), null);
});
