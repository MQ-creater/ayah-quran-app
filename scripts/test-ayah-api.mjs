import test from "node:test";
import assert from "node:assert/strict";
import ayahApi from "../src/services/ayah-api.js";

const { AyahApiError, normalizeApiBase, buildApiUrl, requestJson } = ayahApi;

test("normalizes configured API base URLs", () => {
  assert.equal(normalizeApiBase(" https://api.example.test/api/// "), "https://api.example.test/api");
  assert.equal(normalizeApiBase(""), "");
});

test("rejects unsafe or malformed API base URLs", () => {
  for (const value of ["not a url", "ftp://api.example.test", "https://user:pass@example.test/api", "https://example.test/api?token=x"]) {
    assert.throws(() => normalizeApiBase(value), error => error instanceof AyahApiError && error.code === "INVALID_BASE_URL");
  }
});

test("builds API URLs without accepting traversal or protocol-relative paths", () => {
  assert.equal(buildApiUrl("/chapters?page=2", "https://api.example.test/api/"), "https://api.example.test/api/chapters?page=2");
  for (const path of ["chapters", "//evil.example", "/../private", "/a/./b", "/a\\\\b"]) {
    assert.throws(() => buildApiUrl(path, "https://api.example.test/api"), error => error.code === "INVALID_PATH");
  }
});

test("requestJson returns decoded JSON and sends safe defaults", async () => {
  let observed;
  const result = await requestJson("/chapters", {
    baseUrl:"https://api.example.test/api",
    fetchImpl:async (url, options) => {
      observed = {url,options};
      return {ok:true,status:200,json:async()=>({chapters:[{id:1}]})};
    }
  });
  assert.deepEqual(result, {chapters:[{id:1}]});
  assert.equal(observed.url, "https://api.example.test/api/chapters");
  assert.equal(observed.options.method, "GET");
  assert.equal(observed.options.headers.Accept, "application/json");
});

test("requestJson surfaces server error messages and status codes", async () => {
  await assert.rejects(
    requestJson("/search", {
      baseUrl:"https://api.example.test/api",
      fetchImpl:async()=>({ok:false,status:429,json:async()=>({error:"Please slow down."})})
    }),
    error => error instanceof AyahApiError && error.status === 429 && error.message === "Please slow down."
  );
});

test("requestJson rejects non-JSON responses with a clear error", async () => {
  await assert.rejects(
    requestJson("/status", {
      baseUrl:"https://api.example.test/api",
      fetchImpl:async()=>({ok:true,status:200,json:async()=>{throw new Error("invalid json");}})
    }),
    error => error instanceof AyahApiError && error.code === "INVALID_JSON"
  );
});

test("requestJson preserves caller cancellation", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    requestJson("/chapters", {
      baseUrl:"https://api.example.test/api",
      signal:controller.signal,
      fetchImpl:async(_url,options)=>{assert.equal(options.signal,controller.signal);const error=new Error("aborted");error.name="AbortError";throw error;}
    }),
    error => error.name === "AbortError"
  );
});
