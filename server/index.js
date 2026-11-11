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
let cachedHadithToken = null;
let hadithTokenExpiresAt = 0;
const responseCache = new Map();
const RESPONSE_CACHE_LIMIT = 180;
const RESPONSE_CACHE_TTL_MS = 60_000;

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

async function getAccessToken(includeTafsir = false, includeHadith = false) {
  if (!clientId || !clientSecret) {
    throw new Error("Quran Foundation server credentials are not configured.");
  }
  if (includeTafsir && cachedTafsirToken && Date.now() < tafsirTokenExpiresAt - 60_000) return cachedTafsirToken;
  if (includeHadith && cachedHadithToken && Date.now() < hadithTokenExpiresAt - 60_000) return cachedHadithToken;
  if (!includeTafsir && !includeHadith && cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;

  const credentials = Buffer.from(clientId + ":" + clientSecret).toString("base64");
  let response;
  try {
    response = await fetch(qf.auth + "/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: "Basic " + credentials,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: includeTafsir ? "content.tafsirs.read" : includeHadith ? "content.hadith.read" : "content.quran.read content.translations.read content.audio.read"
      }),
      signal: AbortSignal.timeout(15000)
    });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") error.status = 504;
    throw error;
  }
  if (!response.ok) { const error=new Error("Quran Foundation authentication failed.");error.status=502;throw error; }
  const data = await response.json();
  if (!data.access_token) throw new Error("The content provider returned no access token.");
  const expiry = Date.now() + Number(data.expires_in || 3600) * 1000;
  if (includeTafsir) { cachedTafsirToken = data.access_token; tafsirTokenExpiresAt = expiry; return cachedTafsirToken; }
  if (includeHadith) { cachedHadithToken = data.access_token; hadithTokenExpiresAt = expiry; return cachedHadithToken; }
  cachedToken = data.access_token;
  tokenExpiresAt = expiry;
  return cachedToken;
}

async function qfGet(path, includeTafsir = false, includeHadith = false) {
  const cacheKey = (includeTafsir ? "tafsir:" : includeHadith ? "hadith:" : "content:") + path;
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  if (cached) responseCache.delete(cacheKey);
  const token = await getAccessToken(includeTafsir, includeHadith);
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
    error.status = response.status === 429 ? 503 : 502;
    error.providerStatus = response.status;
    throw error;
  }
  const data = await response.json();
  responseCache.set(cacheKey,{data,expiresAt:Date.now()+RESPONSE_CACHE_TTL_MS});
  if(responseCache.size>RESPONSE_CACHE_LIMIT){const oldest=responseCache.keys().next().value;responseCache.delete(oldest);}
  return data;
}

app.get("/health", (_req, res) => res.json({ ok: true, service: "ayah-content-api", providerConfigured: Boolean(clientId && clientSecret), environment }));

app.get("/api/status", (_req, res) => res.json({
  service: "ayah-content-api",
  apiVersion: 1,
  responseCacheTtlSeconds: RESPONSE_CACHE_TTL_MS / 1000,
  environment,
  providerConfigured: Boolean(clientId && clientSecret),
  endpoints: ["chapters", "verses", "translations", "search", "chapter-audio", "tafsir", "hadith", "mushaf-pages", "juz", "hizb", "rub-al-hizb", "manzil", "ruku", "random-verse"]
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
    const data = await qfGet("/chapter_recitations/" + reciterId + "/" + chapterId + "?segments=true");
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


const searchRateLimit = rateLimit({ windowMs:60_000, limit:20, standardHeaders:"draft-7", legacyHeaders:false });
app.get("/api/search", searchRateLimit, async (req, res) => {
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


function buildVerseBrowseParams(req) {
  const page = Number(req.query.page || 1);
  const perPage = Number(req.query.per_page || 50);
  const translationIds = String(req.query.translation_id || translationId).split(",").map(value => value.trim());
  const language = String(req.query.language || "en").toLowerCase();
  const script = String(req.query.script || "uthmani");
  if (!Number.isInteger(page) || page < 1 || page > 100) return { error:"Result page must be a whole number from 1 to 100." };
  if (!Number.isInteger(perPage) || perPage < 1 || perPage > 50) return { error:"Page size must be a whole number from 1 to 50." };
  if (translationIds.length < 1 || translationIds.length > 2 || translationIds.some(value => !/^\d+$/.test(value)) || new Set(translationIds).size !== translationIds.length) return { error:"Choose one or two valid translation IDs." };
  if (!/^[a-z]{2}$/.test(language)) return { error:"Language must be a two-letter language code." };
  if (!["uthmani","indopak"].includes(script)) return { error:"Choose a supported Arabic script." };
  const arabicField = script === "indopak" ? "text_indopak_nastaleeq" : "text_qpc_hafs";
  return {
    params: new URLSearchParams({
      language,
      words:"true",
      word_fields:[arabicField,"text_uthmani","transliteration","translation","audio_url","position","char_type_name","line_number","page_number","text_indopak_nastaleeq"].join(","),
      translations:translationIds.join(","),
      fields:arabicField,
      page:String(page),
      per_page:String(perPage)
    })
  };
}


app.get("/api/hadith/:surah/:ayah", async (req,res) => {
  const surah = Number(req.params.surah);
  const ayah = Number(req.params.ayah);
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 4);
  const language = String(req.query.language || "en").toLowerCase();
  if (!Number.isInteger(surah) || surah < 1 || surah > 114 || !Number.isInteger(ayah) || ayah < 1 || ayah > 286) return res.status(400).json({ error:"Enter a valid surah and ayah reference." });
  if (!Number.isInteger(page) || page < 1 || page > 100 || !Number.isInteger(limit) || limit < 1 || limit > 5) return res.status(400).json({ error:"Hadith page must be 1–100 and limit must be 1–5." });
  if (!["en","ar"].includes(language)) return res.status(400).json({ error:"Related hadith can currently be requested in English or Arabic." });
  try {
    const params = new URLSearchParams({ language, page:String(page), limit:String(limit) });
    const data = await qfGet("/hadiths/by_ayah/" + surah + ":" + ayah + "?" + params.toString(),false,true);
    res.json({ hadiths:Array.isArray(data.hadiths)?data.hadiths:[], page:data.page||page, limit:data.limit||limit, has_more:Boolean(data.has_more), language:data.language||language, direction:data.direction||"ltr" });
  } catch (error) {
    console.error("Related hadith request failed:",error.message);
    const message = error.providerStatus === 403 ? "Related hadith access is not enabled for the Quran Foundation credentials. Request the content.hadith.read permission." : "Related hadith are temporarily unavailable.";
    res.status(error.status || 503).json({ error:message });
  }
});



app.get("/api/verses/by-manzil/:manzilNumber", async (req,res) => {
  const manzilNumber=Number(req.params.manzilNumber);
  if(!Number.isInteger(manzilNumber)||manzilNumber<1||manzilNumber>7)return res.status(400).json({error:"Manzil number must be a whole number from 1 to 7."});
  const built=buildVerseBrowseParams(req);
  if(built.error)return res.status(400).json({error:built.error});
  try{
    const data=await qfGet("/verses/by_manzil/"+manzilNumber+"?"+built.params.toString());
    res.json({verses:data.verses||[],pagination:data.pagination||null,navigation:{type:"manzil",manzilNumber}});
  }catch(error){
    console.error("Manzil request failed:",error.message);
    res.status(error.status||503).json({error:"This Manzil is temporarily unavailable."});
  }
});

app.get("/api/verses/by-ruku/:rukuNumber", async (req,res) => {
  const rukuNumber=Number(req.params.rukuNumber);
  if(!Number.isInteger(rukuNumber)||rukuNumber<1||rukuNumber>558)return res.status(400).json({error:"Ruku number must be a whole number from 1 to 558."});
  const built=buildVerseBrowseParams(req);
  if(built.error)return res.status(400).json({error:built.error});
  try{
    const data=await qfGet("/verses/by_ruku/"+rukuNumber+"?"+built.params.toString());
    res.json({verses:data.verses||[],pagination:data.pagination||null,navigation:{type:"ruku",rukuNumber}});
  }catch(error){
    console.error("Ruku request failed:",error.message);
    res.status(error.status||503).json({error:"This Ruku is temporarily unavailable."});
  }
});

app.get("/api/verses/random", async (req,res) => {
  const filterNames=["chapter_number","page_number","juz_number","hizb_number","rub_el_hizb_number","ruku_number","manzil_number"];
  const selected=filterNames.filter(name=>req.query[name]!==undefined);
  if(selected.length>1)return res.status(400).json({error:"Choose at most one section filter for a random ayah."});
  const bounds={chapter_number:[1,114],page_number:[1,604],juz_number:[1,30],hizb_number:[1,60],rub_el_hizb_number:[1,240],ruku_number:[1,558],manzil_number:[1,7]};
  for(const name of selected){
    const value=Number(req.query[name]);
    const [minimum,maximum]=bounds[name];
    if(!Number.isInteger(value)||value<minimum||value>maximum)return res.status(400).json({error:"Invalid "+name.replace(/_number$/,"").replace(/_/g," ")+" range."});
  }
  const language=String(req.query.language||"en").toLowerCase();
  const script=String(req.query.script||"uthmani");
  const ids=String(req.query.translation_id||translationId).split(",").map(value=>value.trim());
  if(!/^[a-z]{2}$/.test(language))return res.status(400).json({error:"Language must be a two-letter code."});
  if(!["uthmani","indopak"].includes(script))return res.status(400).json({error:"Choose a supported Arabic script."});
  if(ids.length<1||ids.length>2||ids.some(value=>!/^\d+$/.test(value))||new Set(ids).size!==ids.length)return res.status(400).json({error:"Choose one or two valid translations."});
  const arabicField=script==="indopak"?"text_indopak_nastaleeq":"text_qpc_hafs";
  const params=new URLSearchParams({language,words:"true",translations:ids.join(","),word_fields:[arabicField,"text_uthmani","text_indopak_nastaleeq","transliteration","translation","audio_url","position","char_type_name"].join(","),fields:[arabicField,"text_uthmani","text_indopak_nastaleeq","juz_number","hizb_number","rub_el_hizb_number","page_number","ruku_number","manzil_number"].join(",")});
  for(const name of selected)params.set(name,String(Number(req.query[name])));
  try{
    const data=await qfGet("/verses/random?"+params.toString());
    const verse=data.verse || data;
    if(!verse || !/^\d{1,3}:\d{1,3}$/.test(String(verse.verse_key||"")))return res.status(502).json({error:"The content provider returned an invalid random verse."});
    res.json({verse});
  }catch(error){
    console.error("Random ayah request failed:",error.message);
    res.status(error.status||503).json({error:"A random ayah is temporarily unavailable."});
  }
});

app.get("/api/verses/by-hizb/:hizbNumber", async (req,res) => {
  const hizbNumber=Number(req.params.hizbNumber);
  if(!Number.isInteger(hizbNumber)||hizbNumber<1||hizbNumber>60)return res.status(400).json({error:"Hizb number must be a whole number from 1 to 60."});
  const built=buildVerseBrowseParams(req);
  if(built.error)return res.status(400).json({error:built.error});
  try{
    const data=await qfGet("/verses/by_hizb/"+hizbNumber+"?"+built.params.toString());
    res.json({verses:data.verses||[],pagination:data.pagination||null,navigation:{type:"hizb",hizbNumber}});
  }catch(error){
    console.error("Hizb request failed:",error.message);
    res.status(error.status||503).json({error:"This Hizb is temporarily unavailable."});
  }
});

app.get("/api/verses/by-rub-al-hizb/:rubNumber", async (req,res) => {
  const rubNumber=Number(req.params.rubNumber);
  if(!Number.isInteger(rubNumber)||rubNumber<1||rubNumber>240)return res.status(400).json({error:"Rub al-Hizb number must be a whole number from 1 to 240."});
  const built=buildVerseBrowseParams(req);
  if(built.error)return res.status(400).json({error:built.error});
  try{
    const data=await qfGet("/verses/by_rub_el_hizb_number/"+rubNumber+"?"+built.params.toString());
    res.json({verses:data.verses||[],pagination:data.pagination||null,navigation:{type:"rub-el-hizb",rubNumber}});
  }catch(error){
    console.error("Rub al-Hizb request failed:",error.message);
    res.status(error.status||503).json({error:"This Rub al-Hizb is temporarily unavailable."});
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


app.get("/api/verses/by-page/:pageNumber", async (req, res) => {
  const pageNumber = Number(req.params.pageNumber);
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 700) return res.status(400).json({ error:"Mushaf page must be a whole number from 1 to 700." });
  const built = buildVerseBrowseParams(req);
  if (built.error) return res.status(400).json({ error:built.error });
  const mushaf = req.query.mushaf === undefined ? "" : String(req.query.mushaf);
  if (mushaf && (!/^\d+$/.test(mushaf) || Number(mushaf) < 1 || Number(mushaf) > 99)) return res.status(400).json({ error:"Mushaf ID must be a positive whole number." });
  if (mushaf) built.params.set("mushaf",mushaf);
  try {
    const data = await qfGet("/verses/by_page/" + pageNumber + "?" + built.params.toString());
    res.json({ verses:data.verses || [], pagination:data.pagination || null, navigation:{ type:"page", pageNumber, mushaf:mushaf || null } });
  } catch (error) {
    console.error("Mushaf page request failed:",error.message);
    res.status(error.status || 503).json({ error:"This Mushaf page is temporarily unavailable." });
  }
});

app.get("/api/verses/by-juz/:juzNumber", async (req, res) => {
  const juzNumber = Number(req.params.juzNumber);
  if (!Number.isInteger(juzNumber) || juzNumber < 1 || juzNumber > 30) return res.status(400).json({ error:"Juz number must be a whole number from 1 to 30." });
  const built = buildVerseBrowseParams(req);
  if (built.error) return res.status(400).json({ error:built.error });
  try {
    const data = await qfGet("/verses/by_juz/" + juzNumber + "?" + built.params.toString());
    res.json({ verses:data.verses || [], pagination:data.pagination || null, navigation:{ type:"juz", juzNumber } });
  } catch (error) {
    console.error("Juz request failed:",error.message);
    res.status(error.status || 503).json({ error:"This Juz is temporarily unavailable." });
  }
});


app.get("/api/chapters/:id/info", async (req,res) => {
  const chapterId=Number(req.params.id);
  const language=String(req.query.language||"en").toLowerCase();
  const includeResources=String(req.query.include_resources||"true")==="true";
  const resourceId=req.query.resource_id===undefined?"":String(req.query.resource_id);
  if(!Number.isInteger(chapterId)||chapterId<1||chapterId>114)return res.status(400).json({error:"Surah number must be a whole number from 1 to 114."});
  if(!/^[a-z]{2}$/.test(language))return res.status(400).json({error:"Language must be a two-letter language code."});
  if(resourceId.length>100||!(/^(?:[a-z0-9-]+|\\d+)$/i.test(resourceId)||resourceId===""))return res.status(400).json({error:"Chapter information source is invalid."});
  const params=new URLSearchParams({language,include_resources:String(includeResources)});
  if(resourceId)params.set("resource_id",resourceId);
  try{
    const data=await qfGet("/chapters/"+chapterId+"/info?"+params.toString());
    res.json({chapter_info:data.chapter_info||null,resources:Array.isArray(data.resources)?data.resources:[]});
  }catch(error){
    console.error("Chapter information request failed:",error.message);
    res.status(error.status||503).json({error:"Surah introduction is temporarily unavailable."});
  }
});

app.get("/api/chapters/:id/verses", async (req, res) => {
  const chapterId = Number(req.params.id);
  const page = Number(req.query.page || 1);
  const perPage = Number(req.query.per_page || 50);
  if (!Number.isInteger(page) || page < 1 || page > 500) return res.status(400).json({ error: "Page must be a whole number from 1 to 500." });
  if (!Number.isInteger(perPage) || perPage < 1 || perPage > 50) return res.status(400).json({ error: "Page size must be a whole number from 1 to 50." });
  const requestedTranslations = String(req.query.translation_id || translationId).split(",").map(value => value.trim());
  if (!Number.isInteger(chapterId) || chapterId < 1 || chapterId > 114) {
    return res.status(400).json({ error: "Chapter number must be between 1 and 114." });
  }
  if (requestedTranslations.length < 1 || requestedTranslations.length > 2 || requestedTranslations.some(value => !/^\d+$/.test(value)) || new Set(requestedTranslations).size !== requestedTranslations.length) {
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
      word_fields: [arabicField, "text_uthmani", "transliteration", "translation", "audio_url", "position", "char_type_name", "line_number", "page_number", "text_indopak_nastaleeq"].join(","),
      translations: requestedTranslations.join(","),
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
