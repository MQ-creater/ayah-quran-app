"use strict";

const CLOUD_SYNC_SCHEMA_VERSION = 1;

// Only learning data intended to follow a signed-in learner across devices.
// Authentication tokens, email addresses, device settings, and billing data
// must never be placed in this payload.
const SYNCABLE_KEYS = Object.freeze([
  "savedIds",
  "savedVerseDetails",
  "memorizationProgress",
  "reviewRecords",
  "memorizationPlan",
  "dailyActivity",
  "readerNotes",
  "ayahCollections",
  "lastReadPosition",
  "arabicLessonProgress",
  "arabicAlphabetProgress"
]);

class CloudSyncError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "CloudSyncError";
    this.code = code;
  }
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function selectSyncableData(data) {
  if (!isPlainObject(data)) {
    throw new CloudSyncError("Learning data must be an object.", "INVALID_DATA");
  }
  const selected = {};
  for (const key of SYNCABLE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      selected[key] = data[key];
    }
  }
  return selected;
}

function createCloudSyncEnvelope({ userId, deviceId, updatedAt, data } = {}) {
  if (typeof userId !== "string" || !userId.trim()) {
    throw new CloudSyncError("A verified account ID is required.", "INVALID_USER");
  }
  if (typeof deviceId !== "string" || !deviceId.trim()) {
    throw new CloudSyncError("A device ID is required.", "INVALID_DEVICE");
  }
  const timestamp = updatedAt === undefined ? new Date().toISOString() : updatedAt;
  if (typeof timestamp !== "string" || !Number.isFinite(Date.parse(timestamp))) {
    throw new CloudSyncError("A valid ISO date is required.", "INVALID_TIMESTAMP");
  }
  return Object.freeze({
    schemaVersion: CLOUD_SYNC_SCHEMA_VERSION,
    userId: userId.trim(),
    deviceId: deviceId.trim(),
    updatedAt: new Date(timestamp).toISOString(),
    data: selectSyncableData(data)
  });
}

function validateCloudSyncEnvelope(value, expectedUserId) {
  if (!isPlainObject(value) || value.schemaVersion !== CLOUD_SYNC_SCHEMA_VERSION) {
    throw new CloudSyncError("Unsupported cloud sync data format.", "INVALID_ENVELOPE");
  }
  if (typeof expectedUserId !== "string" || !expectedUserId.trim() || value.userId !== expectedUserId.trim()) {
    throw new CloudSyncError("Cloud data does not belong to the signed-in account.", "USER_MISMATCH");
  }
  if (typeof value.deviceId !== "string" || !value.deviceId.trim() ||
      typeof value.updatedAt !== "string" || !Number.isFinite(Date.parse(value.updatedAt))) {
    throw new CloudSyncError("Cloud sync metadata is invalid.", "INVALID_METADATA");
  }
  return {
    schemaVersion: CLOUD_SYNC_SCHEMA_VERSION,
    userId: value.userId,
    deviceId: value.deviceId,
    updatedAt: new Date(value.updatedAt).toISOString(),
    data: selectSyncableData(value.data)
  };
}

module.exports = {
  CLOUD_SYNC_SCHEMA_VERSION,
  SYNCABLE_KEYS,
  CloudSyncError,
  createCloudSyncEnvelope,
  validateCloudSyncEnvelope,
  selectSyncableData
};
