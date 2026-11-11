const DEFAULT_TIMEOUT_MS = 15000;

class AyahApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "AyahApiError";
    this.status = Number(details.status) || 0;
    this.code = details.code || "REQUEST_FAILED";
    this.path = details.path || "";
  }
}

function normalizeApiBase(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  let parsed;
  try { parsed = new URL(raw); }
  catch (_error) { throw new AyahApiError("The Ayah API URL is invalid.", { code:"INVALID_BASE_URL" }); }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new AyahApiError("The Ayah API URL must be an HTTP(S) base URL without credentials, query, or fragment.", { code:"INVALID_BASE_URL" });
  }
  return raw.replace(/\/+$/, "");
}

function buildApiUrl(path, baseUrl) {
  const base = normalizeApiBase(baseUrl);
  if (!base) throw new AyahApiError("The Ayah content server is not configured.", { code:"MISSING_BASE_URL", path:String(path || "") });
  const route = String(path || "");
  if (!route.startsWith("/") || route.startsWith("//") || route.includes("\\") || route.split("/").some(part => part === "." || part === "..")) {
    throw new AyahApiError("The requested Ayah API route is invalid.", { code:"INVALID_PATH", path:route });
  }
  return base + route;
}

async function requestJson(path, options = {}) {
  const {
    baseUrl,
    fetchImpl = typeof fetch === "function" ? fetch : null,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers = {},
    method = "GET",
    body
  } = options;
  if (typeof fetchImpl !== "function") throw new AyahApiError("This environment does not support network requests.", { code:"FETCH_UNAVAILABLE", path });
  const url = buildApiUrl(path, baseUrl);
  let timeoutId;
  let controller;
  let requestSignal = signal;
  if (!signal && typeof AbortController !== "undefined" && Number(timeoutMs) > 0) {
    controller = new AbortController();
    requestSignal = controller.signal;
    timeoutId = setTimeout(() => controller.abort(), Math.min(Number(timeoutMs), 60000));
  }
  try {
    const response = await fetchImpl(url, {
      method,
      headers: { Accept:"application/json", ...headers },
      ...(body === undefined ? {} : { body }),
      ...(requestSignal ? { signal:requestSignal } : {})
    });
    if (response.status === 204) {
      if (!response.ok) throw new AyahApiError("The Ayah server returned HTTP " + response.status + ".", { status:response.status, code:"HTTP_ERROR", path });
      return null;
    }
    let data;
    try { data = await response.json(); }
    catch (_error) { throw new AyahApiError("The Ayah server returned an unreadable response.", { status:response.status, code:"INVALID_JSON", path }); }
    if (!response.ok) {
      throw new AyahApiError(data?.error || "The Ayah server returned HTTP " + response.status + ".", {
        status:response.status, code:"HTTP_ERROR", path
      });
    }
    return data;
  } catch (error) {
    if (error instanceof AyahApiError) throw error;
    if (error?.name === "AbortError") throw error;
    throw new AyahApiError(error?.message || "The Ayah server could not be reached.", { code:"NETWORK_ERROR", path });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

module.exports = { DEFAULT_TIMEOUT_MS, AyahApiError, normalizeApiBase, buildApiUrl, requestJson };
