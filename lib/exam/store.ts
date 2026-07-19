import { MemoryStorage, browserStorage, type StorageLike } from "../platform/storage";
import type { ExamSession, ExamSessionSnapshot } from "../types";
import {
  deleteCompletedTerminalSessionsFromList,
  deleteSessionFromList,
  EXAM_SCHEMA_VERSION,
  isExamSessionSnapshot,
  parseExamSessionSnapshot,
  pruneSessions,
  upsertSessionInList,
} from "./session";

export const EXAM_STORAGE_KEY = "dele-b2:exam:v1";

export interface ExamStorageLoadResult {
  snapshot: ExamSessionSnapshot;
  persistent: boolean;
  recovered: boolean;
}

export type ExamStoreListener = (result: ExamStorageLoadResult) => void;

function emptyExamSnapshot(): ExamSessionSnapshot {
  return { schemaVersion: EXAM_SCHEMA_VERSION, sessions: [] };
}

export class ExamSessionStore {
  private readonly fallback = new MemoryStorage();
  private readonly listeners = new Set<ExamStoreListener>();
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
      if (event.key !== EXAM_STORAGE_KEY) return;
      const snapshot =
        event.newValue === null ? emptyExamSnapshot() : parseExamSessionSnapshot(event.newValue);
      if (!snapshot) return;
      this.emit({ snapshot, persistent: true, recovered: false });
    });
  }

  private useFallback(snapshot = emptyExamSnapshot()): void {
    this.activeStorage = null;
    this.recovered = true;
    this.fallback.setItem(EXAM_STORAGE_KEY, JSON.stringify(snapshot));
  }

  load(): ExamStorageLoadResult {
    const storage = this.resolveStorage();
    if (!storage) {
      const snapshot =
        parseExamSessionSnapshot(this.fallback.getItem(EXAM_STORAGE_KEY) ?? "") ?? emptyExamSnapshot();
      return { snapshot, persistent: false, recovered: this.recovered };
    }

    try {
      const raw = storage.getItem(EXAM_STORAGE_KEY);
      if (raw === null) {
        return { snapshot: emptyExamSnapshot(), persistent: true, recovered: false };
      }
      const snapshot = parseExamSessionSnapshot(raw);
      if (snapshot) {
        return { snapshot, persistent: true, recovered: this.recovered };
      }
      const reset = emptyExamSnapshot();
      storage.setItem(EXAM_STORAGE_KEY, JSON.stringify(reset));
      this.recovered = true;
      return { snapshot: reset, persistent: true, recovered: true };
    } catch {
      this.useFallback();
      return { snapshot: emptyExamSnapshot(), persistent: false, recovered: true };
    }
  }

  save(snapshot: ExamSessionSnapshot): { persistent: boolean } {
    if (!isExamSessionSnapshot(snapshot)) {
      throw new TypeError("Invalid DELE B2 exam session snapshot");
    }
    const serialized = JSON.stringify(snapshot);
    const storage = this.resolveStorage();
    if (storage) {
      try {
        storage.setItem(EXAM_STORAGE_KEY, serialized);
        this.emit({ snapshot, persistent: true, recovered: this.recovered });
        return { persistent: true };
      } catch {
        this.useFallback(snapshot);
      }
    } else {
      this.fallback.setItem(EXAM_STORAGE_KEY, serialized);
    }
    this.emit({ snapshot, persistent: false, recovered: true });
    return { persistent: false };
  }

  /** terminal 우선 병합으로 upsert한 뒤 공통 보존 규칙을 적용한다. */
  upsertSession(session: ExamSession): { persistent: boolean } {
    const { snapshot } = this.load();
    const sessions = pruneSessions(upsertSessionInList(snapshot.sessions, session));
    return this.save({ schemaVersion: EXAM_SCHEMA_VERSION, sessions });
  }

  deleteSession(sessionId: string): { deleted: boolean; persistent: boolean } {
    const loaded = this.load();
    const result = deleteSessionFromList(loaded.snapshot.sessions, sessionId);
    if (!result.deleted) {
      return { deleted: false, persistent: loaded.persistent };
    }
    const saved = this.save({ schemaVersion: EXAM_SCHEMA_VERSION, sessions: result.sessions });
    return { deleted: true, persistent: saved.persistent };
  }

  deleteCompletedTerminalSessions(): { deleted: number; persistent: boolean } {
    const loaded = this.load();
    const result = deleteCompletedTerminalSessionsFromList(loaded.snapshot.sessions);
    if (result.deleted === 0) {
      return { deleted: 0, persistent: loaded.persistent };
    }
    const saved = this.save({ schemaVersion: EXAM_SCHEMA_VERSION, sessions: result.sessions });
    return { deleted: result.deleted, persistent: saved.persistent };
  }

  subscribe(listener: ExamStoreListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(result: ExamStorageLoadResult): void {
    for (const listener of this.listeners) listener(result);
  }
}

export function createExamSessionStore(storage?: StorageLike | null): ExamSessionStore {
  return new ExamSessionStore(storage);
}

let defaultExamSessionStore: ExamSessionStore | undefined;

export function getDefaultExamSessionStore(): ExamSessionStore {
  defaultExamSessionStore ??= createExamSessionStore();
  return defaultExamSessionStore;
}
