import { describe, expect, it } from "vitest";
import { createAttemptStore, PROGRESS_STORAGE_KEY } from "../lib/storage";
import type { ProgressSnapshot } from "../lib/types";

class FakeStorage {
  values = new Map<string, string>();
  throwOnGet = false;
  throwOnSet = false;

  getItem(key: string): string | null {
    if (this.throwOnGet) throw new DOMException("blocked", "SecurityError");
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.throwOnSet) throw new DOMException("full", "QuotaExceededError");
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const snapshot: ProgressSnapshot = {
  schemaVersion: 1,
  attempts: {
    "reading-1": {
      kind: "reading",
      itemId: "reading-1",
      selectedAnswer: "b",
      correct: true,
      flagged: false,
      attemptCount: 1,
      lastAttemptedAt: 100,
    },
    "listen-1": {
      kind: "listening",
      itemId: "listen-1",
      selectedAnswer: "a",
      correct: false,
      flagged: true,
      attemptCount: 2,
      lastAttemptedAt: 200,
    },
  },
};

describe("AttemptStore", () => {
  it("saves and loads a valid versioned snapshot", () => {
    const store = createAttemptStore(new FakeStorage());
    expect(store.save(snapshot).persistent).toBe(true);
    expect(store.load().snapshot).toEqual(snapshot);
  });

  it("resets malformed JSON while keeping usable local storage", () => {
    const storage = new FakeStorage();
    storage.values.set(PROGRESS_STORAGE_KEY, "{oops");
    const result = createAttemptStore(storage).load();

    expect(result).toMatchObject({ persistent: true, recovered: true });
    expect(result.snapshot.attempts).toEqual({});
    expect(JSON.parse(storage.values.get(PROGRESS_STORAGE_KEY)!)).toEqual({
      schemaVersion: 1,
      attempts: {},
    });
  });

  it("resets a snapshot from an unsupported schema version", () => {
    const storage = new FakeStorage();
    storage.values.set(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 2, attempts: {} }),
    );
    expect(createAttemptStore(storage).load().snapshot).toEqual({
      schemaVersion: 1,
      attempts: {},
    });
  });

  it("falls back to memory when storage access is denied", () => {
    const storage = new FakeStorage();
    storage.throwOnGet = true;
    const store = createAttemptStore(storage);
    expect(store.load().persistent).toBe(false);
    expect(store.save(snapshot).persistent).toBe(false);
    expect(store.load().snapshot).toEqual(snapshot);
  });

  it("keeps the pending save in memory when quota is exceeded", () => {
    const storage = new FakeStorage();
    storage.throwOnSet = true;
    const store = createAttemptStore(storage);
    expect(store.save(snapshot).persistent).toBe(false);
    expect(store.load().snapshot).toEqual(snapshot);
  });

  it("rejects attempts whose record key and itemId disagree", () => {
    const bad = {
      ...snapshot,
      attempts: { wrong: snapshot.attempts["reading-1"] },
    };
    expect(() => createAttemptStore(new FakeStorage()).save(bad)).toThrow(TypeError);
  });
});
