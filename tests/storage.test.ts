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

  it("validates open attempts with rubricScores", () => {
    const store = createAttemptStore(new FakeStorage());
    const validWithRubric = {
      ...snapshot,
      attempts: {
        "write-1": {
          kind: "open",
          itemId: "write-1",
          completed: true,
          selfScore: 2,
          rubricScores: { adequacy: 2, coherence: 2, accuracy: 2, range: 2 },
          flagged: false,
          attemptCount: 1,
          lastAttemptedAt: 100,
        }
      }
    } as const;
    expect(() => store.save(validWithRubric as unknown as ProgressSnapshot)).not.toThrow();

    const invalidRubric = {
      ...snapshot,
      attempts: {
        "write-1": {
          kind: "open",
          itemId: "write-1",
          completed: true,
          selfScore: 2,
          rubricScores: { adequacy: 2, coherence: 2, accuracy: 2 }, // Missing range
          flagged: false,
          attemptCount: 1,
          lastAttemptedAt: 100,
        }
      }
    } as const;
    expect(() => store.save(invalidRubric as unknown as ProgressSnapshot)).toThrow(TypeError);
  });
});

import { mergeSnapshots, importProgress } from "../lib/storage";

describe("importProgress & mergeSnapshots", () => {
  it("merges incoming snapshots, preferring newer timestamps", () => {
    const current: ProgressSnapshot = {
      schemaVersion: 1,
      attempts: {
        "item-1": { kind: "reading", itemId: "item-1", attemptCount: 1, lastAttemptedAt: 100, correct: true, flagged: false, selectedAnswer: "a" }
      }
    };
    const incoming: ProgressSnapshot = {
      schemaVersion: 1,
      attempts: {
        "item-1": { kind: "reading", itemId: "item-1", attemptCount: 2, lastAttemptedAt: 50, correct: false, flagged: true, selectedAnswer: "b" },
        "item-2": { kind: "open", itemId: "item-2", attemptCount: 1, lastAttemptedAt: 200, completed: false, draft: "hello", flagged: false }
      }
    };
    
    const merged = mergeSnapshots(current, incoming);
    
    // item-1 should keep the current one because 100 >= 50
    expect(merged.attempts["item-1"].attemptCount).toBe(1);
    // item-2 should be added
    expect(merged.attempts["item-2"]).toBeDefined();
    if (merged.attempts["item-2"].kind === "open") {
      expect(merged.attempts["item-2"].draft).toBe("hello");
    }
  });

  it("updates store when imported", () => {
    const store = createAttemptStore(new FakeStorage());
    store.save(snapshot);
    const jsonStr = JSON.stringify({
      schemaVersion: 1,
      attempts: {
        "reading-1": { ...snapshot.attempts["reading-1"], attemptCount: 5, lastAttemptedAt: 999 }
      }
    });
    
    expect(importProgress(store, jsonStr)).toEqual({
      stats: { added: 0, updated: 1, skipped: 0 },
      persistent: true,
      localRecovered: false,
    });
    expect(store.load().snapshot.attempts["reading-1"].attemptCount).toBe(5);
  });

  it("returns merge stats for added, updated and skipped attempts", () => {
    const store = createAttemptStore(new FakeStorage());
    store.save({
      schemaVersion: 1,
      attempts: {
        "keep-newer": { kind: "reading", itemId: "keep-newer", attemptCount: 3, lastAttemptedAt: 900, correct: true, flagged: false, selectedAnswer: "a" },
        "replace-older": { kind: "reading", itemId: "replace-older", attemptCount: 1, lastAttemptedAt: 100, correct: false, flagged: false, selectedAnswer: "b" },
      },
    });
    const incoming = JSON.stringify({
      schemaVersion: 1,
      attempts: {
        "keep-newer": { kind: "reading", itemId: "keep-newer", attemptCount: 1, lastAttemptedAt: 100, correct: false, flagged: false, selectedAnswer: "c" },
        "replace-older": { kind: "reading", itemId: "replace-older", attemptCount: 2, lastAttemptedAt: 500, correct: true, flagged: false, selectedAnswer: "a" },
        "brand-new": { kind: "listening", itemId: "brand-new", attemptCount: 1, lastAttemptedAt: 300, correct: true, flagged: false, selectedAnswer: "b" },
      },
    });

    expect(importProgress(store, incoming)).toEqual({
      stats: { added: 1, updated: 1, skipped: 1 },
      persistent: true,
      localRecovered: false,
    });
    const merged = store.load().snapshot.attempts;
    expect(merged["keep-newer"].attemptCount).toBe(3);
    expect(merged["replace-older"].attemptCount).toBe(2);
    expect(merged["brand-new"]).toBeDefined();
  });

  it("returns null for invalid payloads", () => {
    const store = createAttemptStore(new FakeStorage());
    expect(importProgress(store, "not json")).toBeNull();
    expect(importProgress(store, JSON.stringify({ schemaVersion: 99, attempts: {} }))).toBeNull();
  });

  it("reports when an imported snapshot only persists in memory", () => {
    const storage = new FakeStorage();
    storage.throwOnSet = true;
    const store = createAttemptStore(storage);

    expect(importProgress(store, JSON.stringify(snapshot))).toEqual({
      stats: { added: 2, updated: 0, skipped: 0 },
      persistent: false,
      localRecovered: false,
    });
    expect(store.load().snapshot).toEqual(snapshot);
  });

  it("reports when malformed local progress was recovered before the import", () => {
    const storage = new FakeStorage();
    storage.values.set(PROGRESS_STORAGE_KEY, "{oops");
    const store = createAttemptStore(storage);

    expect(importProgress(store, JSON.stringify(snapshot))).toEqual({
      stats: { added: 2, updated: 0, skipped: 0 },
      persistent: true,
      localRecovered: true,
    });
    expect(store.load().snapshot).toEqual(snapshot);
  });
});
