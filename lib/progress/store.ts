import { setAttemptFlag } from "../grading";
import { MemoryStorage, browserStorage, type StorageLike } from "../platform/storage";
import type { AttemptState, ProgressSnapshot } from "../types";
import {
  PROGRESS_SCHEMA_VERSION,
  buildSnapshot,
  consumePendingFlags,
  isAttemptState,
  isProgressSnapshot,
  parseProgressSnapshot,
} from "./snapshot";

export const PROGRESS_STORAGE_KEY = "dele-b2:v1";

export interface StorageLoadResult {
  snapshot: ProgressSnapshot;
  persistent: boolean;
  recovered: boolean;
}

export interface StorageSaveResult {
  persistent: boolean;
}

export type AttemptStoreListener = (result: StorageLoadResult) => void;

function emptySnapshot(): ProgressSnapshot {
  return { schemaVersion: PROGRESS_SCHEMA_VERSION, attempts: {} };
}

export class AttemptStore {
  private readonly fallback = new MemoryStorage();
  private readonly listeners = new Set<AttemptStoreListener>();
  private readonly storageOverride: StorageLike | null | undefined;
  private activeStorage: StorageLike | null | undefined;
  private recovered = false;
  private listeningForBrowserStorage = false;

  constructor(storage?: StorageLike | null) {
    this.storageOverride = storage;
  }

  private resolveStorage(): StorageLike | null {
    if (this.activeStorage !== undefined) return this.activeStorage;
    this.activeStorage =
      this.storageOverride === undefined ? browserStorage() : this.storageOverride;
    this.installBrowserStorageListener();
    return this.activeStorage;
  }

  private installBrowserStorageListener(): void {
    if (
      this.listeningForBrowserStorage ||
      this.storageOverride !== undefined ||
      typeof window === "undefined"
    ) {
      return;
    }
    this.listeningForBrowserStorage = true;
    window.addEventListener("storage", (event) => {
      if (event.key !== PROGRESS_STORAGE_KEY) return;
      const snapshot =
        event.newValue === null
          ? emptySnapshot()
          : parseProgressSnapshot(event.newValue);
      if (!snapshot) return;
      this.emit({ snapshot, persistent: true, recovered: false });
    });
  }

  private useFallback(snapshot = emptySnapshot()): void {
    this.activeStorage = null;
    this.recovered = true;
    this.fallback.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(snapshot));
  }

  load(): StorageLoadResult {
    const storage = this.resolveStorage();
    if (!storage) {
      const snapshot =
        parseProgressSnapshot(this.fallback.getItem(PROGRESS_STORAGE_KEY) ?? "") ??
        emptySnapshot();
      return { snapshot, persistent: false, recovered: this.recovered };
    }

    try {
      const raw = storage.getItem(PROGRESS_STORAGE_KEY);
      if (raw === null) {
        return { snapshot: emptySnapshot(), persistent: true, recovered: false };
      }
      const snapshot = parseProgressSnapshot(raw);
      if (snapshot) {
        return { snapshot, persistent: true, recovered: this.recovered };
      }

      const reset = emptySnapshot();
      storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(reset));
      this.recovered = true;
      return { snapshot: reset, persistent: true, recovered: true };
    } catch {
      this.useFallback();
      return { snapshot: emptySnapshot(), persistent: false, recovered: true };
    }
  }

  save(snapshot: ProgressSnapshot): StorageSaveResult {
    if (!isProgressSnapshot(snapshot)) {
      throw new TypeError("Invalid DELE B2 progress snapshot");
    }

    const serialized = JSON.stringify(snapshot);
    const storage = this.resolveStorage();
    if (storage) {
      try {
        storage.setItem(PROGRESS_STORAGE_KEY, serialized);
        this.emit({ snapshot, persistent: true, recovered: this.recovered });
        return { persistent: true };
      } catch {
        this.useFallback(snapshot);
      }
    } else {
      this.fallback.setItem(PROGRESS_STORAGE_KEY, serialized);
    }

    this.emit({ snapshot, persistent: false, recovered: true });
    return { persistent: false };
  }

  updateAttempt(attempt: AttemptState): StorageSaveResult {
    if (!isAttemptState(attempt)) {
      throw new TypeError("Invalid DELE B2 attempt");
    }
    const { snapshot } = this.load();
    const consumed = consumePendingFlags(
      { ...snapshot.attempts, [attempt.itemId]: attempt },
      snapshot.pendingFlags,
      new Set([attempt.itemId]),
    );
    return this.save(buildSnapshot(consumed.attempts, consumed.pendingFlags));
  }

  setPendingFlag(
    itemId: string,
    flagged: boolean,
    now = Date.now(),
  ): StorageSaveResult {
    const { snapshot } = this.load();
    const attempt = snapshot.attempts[itemId];
    if (attempt) {
      return this.updateAttempt(setAttemptFlag(attempt, flagged));
    }
    const pendingFlags = { ...(snapshot.pendingFlags ?? {}) };
    if (flagged) {
      pendingFlags[itemId] = now;
    } else {
      delete pendingFlags[itemId];
    }
    return this.save(buildSnapshot(snapshot.attempts, pendingFlags));
  }

  removeAttempt(itemId: string): StorageSaveResult {
    const { snapshot } = this.load();
    const attempts = { ...snapshot.attempts };
    delete attempts[itemId];
    let pendingFlags = snapshot.pendingFlags;
    if (pendingFlags && pendingFlags[itemId] !== undefined) {
      pendingFlags = { ...pendingFlags };
      delete pendingFlags[itemId];
    }
    return this.save(buildSnapshot(attempts, pendingFlags));
  }

  clear(): StorageSaveResult {
    const snapshot = emptySnapshot();
    const storage = this.resolveStorage();
    if (storage) {
      try {
        if (storage.removeItem) {
          storage.removeItem(PROGRESS_STORAGE_KEY);
        } else {
          storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(snapshot));
        }
        this.emit({ snapshot, persistent: true, recovered: false });
        return { persistent: true };
      } catch {
        this.useFallback(snapshot);
      }
    }
    this.fallback.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(snapshot));
    this.emit({ snapshot, persistent: false, recovered: this.recovered });
    return { persistent: false };
  }

  subscribe(listener: AttemptStoreListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  isPersistent(): boolean {
    return this.resolveStorage() !== null;
  }

  private emit(result: StorageLoadResult): void {
    for (const listener of this.listeners) listener(result);
  }
}

export function createAttemptStore(storage?: StorageLike | null): AttemptStore {
  return new AttemptStore(storage);
}

let defaultAttemptStore: AttemptStore | undefined;

export function getDefaultAttemptStore(): AttemptStore {
  defaultAttemptStore ??= createAttemptStore();
  return defaultAttemptStore;
}
