import type { AttemptState, ProgressSnapshot } from "./types";
import { isValidRubric } from "./rubric";

export const PROGRESS_STORAGE_KEY = "dele-b2:v1";
export const THEME_STORAGE_KEY = "dele-b2:theme:v1";
export const PROGRESS_SCHEMA_VERSION = 1 as const;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

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

function isFiniteNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
  );
}

export function isAttemptState(value: unknown): value is AttemptState {
  if (!value || typeof value !== "object") return false;
  const attempt = value as Record<string, unknown>;
  if (
    typeof attempt.itemId !== "string" ||
    attempt.itemId.length === 0 ||
    typeof attempt.flagged !== "boolean" ||
    !isFiniteNonNegativeInteger(attempt.attemptCount) ||
    !isFiniteNonNegativeInteger(attempt.lastAttemptedAt)
  ) {
    return false;
  }

  if (attempt.kind === "reading" || attempt.kind === "listening") {
    return (
      typeof attempt.selectedAnswer === "string" &&
      typeof attempt.correct === "boolean"
    );
  }

  if (attempt.kind !== "open" || typeof attempt.completed !== "boolean") {
    return false;
  }

  if (attempt.draft !== undefined && typeof attempt.draft !== "string") {
    return false;
  }

  if (!attempt.completed) {
    return attempt.selfScore === undefined && attempt.rubricScores === undefined;
  }
  if (attempt.selfScore !== 1 && attempt.selfScore !== 2 && attempt.selfScore !== 3) {
    return false;
  }
  if (attempt.rubricScores !== undefined) {
    return isValidRubric("writing", attempt.rubricScores) || isValidRubric("speaking", attempt.rubricScores);
  }
  return true;
}

export function isProgressSnapshot(value: unknown): value is ProgressSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Record<string, unknown>;
  if (
    snapshot.schemaVersion !== PROGRESS_SCHEMA_VERSION ||
    !snapshot.attempts ||
    typeof snapshot.attempts !== "object" ||
    Array.isArray(snapshot.attempts)
  ) {
    return false;
  }

  return Object.entries(snapshot.attempts as Record<string, unknown>).every(
    ([itemId, attempt]) =>
      isAttemptState(attempt) && (attempt as AttemptState).itemId === itemId,
  );
}

export function parseProgressSnapshot(raw: string): ProgressSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isProgressSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function mergeSnapshots(current: ProgressSnapshot, incoming: ProgressSnapshot): ProgressSnapshot {
  const mergedAttempts = { ...current.attempts };
  for (const [itemId, attempt] of Object.entries(incoming.attempts)) {
    const existing = mergedAttempts[itemId];
    if (!existing || attempt.lastAttemptedAt >= existing.lastAttemptedAt) {
      mergedAttempts[itemId] = attempt;
    }
  }
  return { schemaVersion: PROGRESS_SCHEMA_VERSION, attempts: mergedAttempts };
}

export function exportProgress(store: AttemptStore): string {
  return JSON.stringify(store.load().snapshot);
}

export function importProgress(store: AttemptStore, jsonStr: string): boolean {
  const incoming = parseProgressSnapshot(jsonStr);
  if (!incoming) return false;
  const current = store.load().snapshot;
  const merged = mergeSnapshots(current, incoming);
  store.save(merged);
  return true;
}

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function browserStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
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
    return this.save({
      ...snapshot,
      attempts: { ...snapshot.attempts, [attempt.itemId]: attempt },
    });
  }

  removeAttempt(itemId: string): StorageSaveResult {
    const { snapshot } = this.load();
    const attempts = { ...snapshot.attempts };
    delete attempts[itemId];
    return this.save({ ...snapshot, attempts });
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
