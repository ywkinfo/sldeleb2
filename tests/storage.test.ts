import { describe, expect, it } from "vitest";
import { PROGRESS_STORAGE_KEY, createAttemptStore } from "../lib/progress/store";
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

describe("pendingFlags (제출 전 별표)", () => {
  it("stores a pending flag for an unanswered item and removes it on unflag", () => {
    const store = createAttemptStore(new FakeStorage());
    expect(store.setPendingFlag("r-new-01", true, 500).persistent).toBe(true);
    expect(store.load().snapshot.pendingFlags).toEqual({ "r-new-01": 500 });

    store.setPendingFlag("r-new-01", false);
    // 빈 맵은 필드 자체를 생략한다.
    expect(store.load().snapshot.pendingFlags).toBeUndefined();
  });

  it("delegates to the attempt flag when an attempt already exists", () => {
    const store = createAttemptStore(new FakeStorage());
    store.save(snapshot);
    store.setPendingFlag("reading-1", true);
    const loaded = store.load().snapshot;
    expect(loaded.attempts["reading-1"].flagged).toBe(true);
    expect(loaded.pendingFlags).toBeUndefined();

    store.setPendingFlag("reading-1", false);
    expect(store.load().snapshot.attempts["reading-1"].flagged).toBe(false);
  });

  it("absorbs a pending flag into the first saved attempt (draft autosave included)", () => {
    const store = createAttemptStore(new FakeStorage());
    store.setPendingFlag("w-draft-01", true, 500);
    store.updateAttempt({
      kind: "open",
      itemId: "w-draft-01",
      completed: false,
      draft: "borrador",
      flagged: false,
      attemptCount: 1,
      lastAttemptedAt: 900,
    });
    const loaded = store.load().snapshot;
    expect(loaded.attempts["w-draft-01"].flagged).toBe(true);
    expect(loaded.pendingFlags).toBeUndefined();
  });

  it("clears the pending flag when a review row is removed", () => {
    const store = createAttemptStore(new FakeStorage());
    store.setPendingFlag("r-only-star", true, 500);
    store.removeAttempt("r-only-star");
    expect(store.load().snapshot.pendingFlags).toBeUndefined();
  });

  it("drops only corrupted pendingFlags entries and keeps attempts intact", () => {
    const storage = new FakeStorage();
    storage.values.set(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        ...snapshot,
        pendingFlags: { good: 700, bad: "not-a-number", negative: -1, fractional: 1.5 },
      }),
    );
    const result = createAttemptStore(storage).load();
    expect(result.recovered).toBe(false);
    expect(result.snapshot.attempts).toEqual(snapshot.attempts);
    expect(result.snapshot.pendingFlags).toEqual({ good: 700 });
  });

  it("strips a wholly malformed pendingFlags field without resetting attempts", () => {
    const storage = new FakeStorage();
    storage.values.set(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ ...snapshot, pendingFlags: ["r-1"] }),
    );
    const result = createAttemptStore(storage).load();
    expect(result.recovered).toBe(false);
    expect(result.snapshot.attempts).toEqual(snapshot.attempts);
    expect(result.snapshot.pendingFlags).toBeUndefined();
  });

  it("normalizes an attempt/pending overlap at load time (no duplicate review rows)", () => {
    const storage = new FakeStorage();
    storage.values.set(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ ...snapshot, pendingFlags: { "reading-1": 700, "other-item": 800 } }),
    );
    const loaded = createAttemptStore(storage).load().snapshot;
    expect(loaded.attempts["reading-1"].flagged).toBe(true);
    expect(loaded.pendingFlags).toEqual({ "other-item": 800 });
  });

  it("loads a legacy snapshot without pendingFlags unchanged", () => {
    const storage = new FakeStorage();
    storage.values.set(PROGRESS_STORAGE_KEY, JSON.stringify(snapshot));
    expect(createAttemptStore(storage).load().snapshot).toEqual(snapshot);
  });

  it("rejects saving a snapshot whose pendingFlags values are not timestamps", () => {
    const store = createAttemptStore(new FakeStorage());
    const bad = { ...snapshot, pendingFlags: { x: Number.NaN } };
    expect(() => store.save(bad as unknown as ProgressSnapshot)).toThrow(TypeError);
  });
});

import { mergeSnapshots } from "../lib/progress/snapshot";
import { importProgress } from "../lib/progress/transfer";

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
      stats: { added: 0, updated: 1, skipped: 0, flagsChanged: 0 },
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
      stats: { added: 1, updated: 1, skipped: 1, flagsChanged: 0 },
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
      stats: { added: 2, updated: 0, skipped: 0, flagsChanged: 1 },
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
      stats: { added: 2, updated: 0, skipped: 0, flagsChanged: 1 },
      persistent: true,
      localRecovered: true,
    });
    expect(store.load().snapshot).toEqual(snapshot);
  });

  it("merges pendingFlags by newest timestamp and omits the field when empty", () => {
    const current: ProgressSnapshot = {
      schemaVersion: 1,
      attempts: {},
      pendingFlags: { shared: 100, local: 300 },
    };
    const incoming: ProgressSnapshot = {
      schemaVersion: 1,
      attempts: {},
      pendingFlags: { shared: 200, imported: 400 },
    };
    expect(mergeSnapshots(current, incoming).pendingFlags).toEqual({
      shared: 200,
      local: 300,
      imported: 400,
    });
    expect(mergeSnapshots({ schemaVersion: 1, attempts: {} }, { schemaVersion: 1, attempts: {} }).pendingFlags).toBeUndefined();
  });

  it("absorbs a pending flag when the merged snapshot has an attempt for the item", () => {
    const current: ProgressSnapshot = {
      schemaVersion: 1,
      attempts: {},
      pendingFlags: { "reading-1": 700 },
    };
    const merged = mergeSnapshots(current, snapshot);
    expect(merged.attempts["reading-1"].flagged).toBe(true);
    expect(merged.pendingFlags).toBeUndefined();
  });

  it("does not let an older pending flag re-flag a newer unflagged attempt", () => {
    const current: ProgressSnapshot = {
      schemaVersion: 1,
      attempts: {
        "reading-1": { ...snapshot.attempts["reading-1"], lastAttemptedAt: 900, flagged: false },
      },
    };
    const staleBackup: ProgressSnapshot = {
      schemaVersion: 1,
      attempts: {},
      pendingFlags: { "reading-1": 700 },
    };
    const merged = mergeSnapshots(current, staleBackup);
    expect(merged.attempts["reading-1"].flagged).toBe(false);
    expect(merged.pendingFlags).toBeUndefined();
  });

  it("preserves the local flag on an otherwise identical equal-timestamp import", () => {
    const store = createAttemptStore(new FakeStorage());
    store.save({
      schemaVersion: 1,
      attempts: {
        "reading-1": { ...snapshot.attempts["reading-1"], flagged: false },
      },
    });
    const incoming = JSON.stringify({
      schemaVersion: 1,
      attempts: {
        "reading-1": { ...snapshot.attempts["reading-1"], flagged: true },
      },
    });

    expect(importProgress(store, incoming)?.stats).toEqual({
      added: 0,
      updated: 0,
      skipped: 1,
      flagsChanged: 0,
    });
    expect(store.load().snapshot.attempts["reading-1"].flagged).toBe(false);
  });

  it("reports a flag-only import as a visible change", () => {
    const store = createAttemptStore(new FakeStorage());
    const result = importProgress(store, JSON.stringify({
      schemaVersion: 1,
      attempts: {},
      pendingFlags: { "star-only": 500 },
    }));
    expect(result?.stats).toEqual({
      added: 0,
      updated: 0,
      skipped: 0,
      flagsChanged: 1,
    });
  });
});
