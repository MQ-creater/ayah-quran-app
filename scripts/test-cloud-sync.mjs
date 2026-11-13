import test from "node:test";
import assert from "node:assert/strict";
import cloudSync from "../src/services/cloud-sync.js";

const { CloudSyncError, createCloudSyncEnvelope, validateCloudSyncEnvelope, selectSyncableData, SYNCABLE_KEYS } = cloudSync;

test("cloud sync envelopes include only approved learning data", () => {
  const envelope = createCloudSyncEnvelope({
    userId: "account-1",
    deviceId: "device-a",
    updatedAt: "2026-11-13T20:00:00.000Z",
    data: { savedIds: ["1:1"], readerNotes: { "1:1": "Study" }, accessToken: "never-sync", email: "private@example.test" }
  });
  assert.deepEqual(Object.keys(envelope.data).sort(), ["readerNotes", "savedIds"]);
  assert.equal("accessToken" in envelope.data, false);
  assert.equal("email" in envelope.data, false);
});

test("cloud sync requires an account, device, and valid timestamp", () => {
  assert.throws(() => createCloudSyncEnvelope({ deviceId: "d", data: {} }), error => error instanceof CloudSyncError && error.code === "INVALID_USER");
  assert.throws(() => createCloudSyncEnvelope({ userId: "u", data: {} }), error => error instanceof CloudSyncError && error.code === "INVALID_DEVICE");
  assert.throws(() => createCloudSyncEnvelope({ userId: "u", deviceId: "d", updatedAt: "later", data: {} }), error => error.code === "INVALID_TIMESTAMP");
});

test("cloud sync rejects malformed data containers", () => {
  assert.throws(() => selectSyncableData([]), error => error.code === "INVALID_DATA");
  assert.throws(() => selectSyncableData(null), error => error.code === "INVALID_DATA");
});

test("cloud sync validates schema and prevents cross-account restore", () => {
  const envelope = createCloudSyncEnvelope({ userId: "u1", deviceId: "d1", data: { memorizationProgress: { "1:1": "learning" } } });
  assert.deepEqual(validateCloudSyncEnvelope(envelope, "u1").data, envelope.data);
  assert.throws(() => validateCloudSyncEnvelope(envelope, "u2"), error => error.code === "USER_MISMATCH");
  assert.throws(() => validateCloudSyncEnvelope({ ...envelope, schemaVersion: 99 }, "u1"), error => error.code === "INVALID_ENVELOPE");
});

test("cloud sync allowlist is explicit and versioned", () => {
  assert.ok(SYNCABLE_KEYS.includes("memorizationProgress"));
  assert.ok(SYNCABLE_KEYS.includes("ayahCollections"));
  assert.equal(SYNCABLE_KEYS.includes("email"), false);
  assert.equal(SYNCABLE_KEYS.includes("accessToken"), false);
});
