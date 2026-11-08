import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();
const port = Number(process.env.PORT || 3001);
const environment = process.env.QF_ENV || "prelive";
const clientId = process.env.QF_CLIENT_ID;
const clientSecret = process.env.QF_CLIENT_SECRET;
const translationId = String(process.env.QF_TRANSLATION_ID || "131");

const environments = {
  prelive: {
    auth: "https://prelive-oauth2.quran.foundation",
    api: "https://apis-prelive.quran.foundation"
  },
  production: {
    auth: "https://oauth2.quran.foundation",
    api: "https://apis.quran.foundation"
  }
};

if (!environments[environment]) {
  throw new Error("QF_ENV must be prelive or production.");
}

const qf = environments[environment];
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean);
if (isProduction && allowedOrigins.length === 0) {
  throw new Error("ALLOWED_ORIGINS must contain the deployed app origins when NODE_ENV=production.");
}
let cachedToken = null;
let tokenExpiresAt = 0;
let cachedTafsirToken = null;
let tafsirTokenExpiresAt = 0;

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || (!isProduction && allowedOrigins.length === 0)) {
      return callback(null, true);
    }
    return callback(new Error("Origin is not allowed."));
  }
}));
app.use(express.json({ limit: "20kb" }));
app.use("/api/", rateLimit({
  windowMs: 60 * 1000,
  limit: 90,
  standardHeaders: "draft-7",
  legacyHeaders: false
}));

async function getAccessToken(includeTafsir = false) {
  if (!clientId || !clientSecret) {
    throw new Error("Quran Foundation server credentials are not configured.");
  }
  if (includeTafsir && cachedTafsirToken && Date.now() < tafsirTokenExpiresAt - 60_000) return cachedTafsirToken;
  if (!includeTafsir && cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;

  const credentials = Buffer.from(clientId + ":" + clientSecret).toString("base64");
  const response = await fetch(qf.auth + "/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + credentials,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: includeTafsir ? "content.tafsirs.read" : "content.quran.read content.translations.read content.audio.read"
    }),
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) { const error=new Error("Quran Foundation authentication failed.");error.status=502;throw error; }
  const data = await response.json();
  if (!data.access_token) throw new Error("The content provider returned no access token.");
  const expiry = Date.now() + Number(data.expires_in || 3600) * 1000;
  if (includeTafsir) { cachedTafsirToken = data.access_token; tafsirTokenExpiresAt = expiry; return cachedTafsirToken; }
  cachedToken = data.access_token;
  tokenExpiresAt = expiry;
  return cachedToken;
}

async function qfGet(path, includeTafsir = false) {
  const token = await getAccessToken(includeTafsir);
  let response;
  try {
    response = await fetch(qf.api + "/content/api/v4" + path, {
      headers: { "x-auth-token": token, "x-client-id": clientId },
      signal: AbortSignal.timeout(15000)
    });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") error.status = 504;
    throw error;
  }
  if (!response.ok) {
    const error = new Error("The Qur’an content provider request failed.");
    error.status = response.status;
    throw error;
  }
  return response.json();
}

app.get("/health", (_req, res) => res.json({ ok: true, service: "ayah-content-api", providerConfigured: Boolean(clientId && clientSecret), environment }));

app.get("/api/status", (_req, res) => res.json({
  service: "ayah-content-api",
  environment,
  providerConfigured: Boolean(clientId && clientSecret),
  endpoints: ["chapters", "verses", "translations", "search", "chapter-audio", "tafsir"]
}));

app.get("/api/audio/reciters", async (req, res) => {
  try {
    const language = String(req.query.language || "en").toLowerCase();
    if (!/^[a-z]{2}$/.test(language)) return res.status(400).json({ error: "Invalid language." });
    const data = await qfGet("/resources/chapter_reciters?language=" + encodeURIComponent(language));
    res.json({ reciters: data.reciters || [] });
  } catch (error) {
    console.error("Audio reciters request failed:", error.message);
    res.status(error.status || 503).json({ error: "Reciters are temporarily unavailable." });
  }
});

app.get("/api/audio/chapters/:reciterId/:chapterId", async (req, res) => {
  const reciterId = Number(req.params.reciterId);
  const chapterId = Number(req.params.chapterId);
  if (!Number.isInteger(reciterId) || reciterId < 1 || !Number.isInteger(chapterId) || chapterId < 1 || chapterId > 114) {
    return res.status(400).json({ error: "Invalid reciter or chapter selection." });
  }
  try {
    const data = await qfGet("/chapter_recitations/" + reciterId + "/" + chapterId);
    const file = data.audio_file || data;
    if (!file.audio_url) return res.status(404).json({ error: "Audio is not available for this selection." });
    res.json({ audio: { url: file.audio_url, format: file.format || "mp3", chapter_id: chapterId, timestamps: file.timestamps || [] } });
  } catch (error) {
    console.error("Chapter audio request failed:", error.message);
    res.status(error.status || 503).json({ error: "Chapter audio is temporarily unavailable." });
  }
});

app.get("/api/translations", async (req, res) => {
  const language = String(req.query.language || "en").toLowerCase();
  if (!/^[a-z]{2}$/.test(language)) {
    return res.status(400).json({ error: "Language must be a two-letter language code." });
  }
  try {
    const data = await qfGet("/resources/translations?language=" + encodeURIComponent(language));
    res.json({ translations: data.translations || [] });
  } catch (error) {
    console.error("Translation resources request failed:", error.message);
    res.status(error.status || 503).json({ error: "Translation choices are temporarily unavailable." });
  }
});

app.get("/api/tafsirs", async (req, res) => {
  const language = String(req.query.language || "en").toLowerCase();
  if (!/^[a-z]{2}$/.test(language)) {
    return res.status(400).json({ error: "Language must be a two-letter language code." });
  }
  try {
    const data = await qfGet("/resources/tafsirs?language=" + encodeURIComponent(language), true);
    res.json({ tafsirs: data.tafsirs || [] });
  } catch (error) {
    console.error("Tafsir resources request failed:", error.message);
    res.status(error.status || 503).json({ error: "Tafsir sources are temporarily unavailable. Confirm that the server app has the content.tafsirs.read permission." });
  }
});

app.get("/api/tafsirs/:resourceId/ayah/:surah/:ayah", async (req, res) => {
  const resourceId = Number(req.params.resourceId);
  const surah = Number(req.params.surah);
  const ayah = Number(req.params.ayah);
  if (!Number.isInteger(resourceId) || resourceId < 1 ||
      !Number.isInteger(surah) || surah < 1 || surah > 114 ||
      !Number.isInteger(ayah) || ayah < 1 || ayah > 286) {
    return res.status(400).json({ error: "Choose a valid Tafsir source and ayah reference." });
  }
  try {
    const data = await qfGet("/tafsirs/" + resourceId + "/by_ayah/" + surah + ":" + ayah, true);
    if (!data.tafsir || typeof data.tafsir.text !== "string" || !data.tafsir.text.trim()) {
      return res.status(404).json({ error: "No commentary was returned for this source and ayah." });
    }
    res.json({ tafsir: data.tafsir });
  } catch (error) {
    console.error("Tafsir passage request failed:", error.message);
    res.status(error.status || 503).json({ error: "This Tafsir passage is temporarily unavailable. Check the source permissions and try again." });
  }
});


app.get("/api/search", async (req, res) => {
  const query = String(req.query.q || "").trim();
  const language = String(req.query.language || "en").toLowerCase();
  const size = Math.min(30, Math.max(1, Number(req.query.size) || 20));
  if (query.length < 2 || query.length > 100) return res.status(400).json({ error: "Search text must be between 2 and 100 characters." });
  if (!/^[a-z]{2}$/.test(language)) return res.status(400).json({ error: "Language must be a two-letter language code." });
  try {
    const params = new URLSearchParams({ q: query, size: String(size), page: "1", language });
    const data = await qfGet("/search?" + params.toString());
    const raw = data.search?.results || data.results || [];
    const results = raw.map(item => ({
      verse_key: String(item.verse_key || item.verse?.verse_key || ""),
      chapter_id: Number(item.chapter_id || item.verse?.chapter_id || String(item.verse_key || "").split(":")[0]),
      verse_number: Number(item.verse_number || item.verse?.verse_number || String(item.verse_key || "").split(":")[1]),
      arabic: item.text || item.text_uthmani || item.verse?.text_uthmani || "",
      translation: item.translations?.[0]?.text || item.translation?.text || item.translation || ""
    })).filter(item => item.chapter_id >= 1 && item.chapter_id <= 114 && item.verse_number >= 1);
    res.json({ query, total_results: data.search?.total_results ?? data.total_results ?? results.length, results });
  } catch (error) {
    console.error("Qur’an search request failed:", error.message);
    res.status(error.status || 503).json({ error: "Search is temporarily unavailable." });
  }
});

app.get("/api/chapters", async (_req, res) => {
  try {
    const data = await qfGet("/chapters?language=en");
    res.json({ chapters: data.chapters || [] });
  } catch (error) {
    console.error("Chapter request failed:", error.message);
    res.status(error.status || 503).json({ error: "The surah list is temporarily unavailable." });
  }
});

app.get("/api/chapters/:id/verses", async (req, res) => {
  const chapterId = Number(req.params.id);
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = Math.min(50, Math.max(1, Number(req.query.per_page) || 50));
  const requestedTranslation = String(req.query.translation_id || translationId);
  if (!Number.isInteger(chapterId) || chapterId < 1 || chapterId > 114) {
    return res.status(400).json({ error: "Chapter number must be between 1 and 114." });
  }
  if (!/^\d+$/.test(requestedTranslation)) {
    return res.status(400).json({ error: "Invalid translation selection." });
  }
  const requestedScript = String(req.query.script || "uthmani");
  if (!["uthmani", "indopak"].includes(requestedScript)) {
    return res.status(400).json({ error: "Invalid Arabic script selection." });
  }
  try {
    const requestedLanguage = String(req.query.language || "en").toLowerCase();
    if (!/^[a-z]{2}$/.test(requestedLanguage)) {
      return res.status(400).json({ error: "Invalid word-by-word language selection." });
    }
    const arabicField = requestedScript === "indopak" ? "text_indopak_nastaleeq" : "text_qpc_hafs";
    const params = new URLSearchParams({
      language: requestedLanguage,
      words: "true",
      word_fields: [arabicField, "text_uthmani", "transliteration", "translation", "audio_url", "position", "char_type_name"].join(","),
      translations: requestedTranslation,
      fields: requestedScript === "indopak" ? "text_indopak_nastaleeq" : "text_qpc_hafs",
      page: String(page),
      per_page: String(perPage)
    });
    const data = await qfGet("/verses/by_chapter/" + chapterId + "?" + params.toString());
    res.json({ verses: data.verses || [], pagination: data.pagination || null });
  } catch (error) {
    console.error("Verse request failed:", error.message);
    res.status(error.status || 503).json({ error: "This surah is temporarily unavailable." });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log("Ayah content API listening on port " + port + " (" + environment + ")");
});
