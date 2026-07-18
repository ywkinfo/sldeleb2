import type { AttemptState, ProgressSnapshot, RubricScores } from "./types";
import { setAttemptFlag } from "./grading";
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

/** 빈 pendingFlags는 필드 자체를 생략해 저장 형태를 정규화한다. */
function buildSnapshot(
  attempts: Record<string, AttemptState>,
  pendingFlags?: Record<string, number>,
): ProgressSnapshot {
  return pendingFlags && Object.keys(pendingFlags).length > 0
    ? { schemaVersion: PROGRESS_SCHEMA_VERSION, attempts, pendingFlags }
    : { schemaVersion: PROGRESS_SCHEMA_VERSION, attempts };
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

  if (snapshot.pendingFlags !== undefined && !isPendingFlagsMap(snapshot.pendingFlags)) {
    return false;
  }

  return Object.entries(snapshot.attempts as Record<string, unknown>).every(
    ([itemId, attempt]) =>
      isAttemptState(attempt) && (attempt as AttemptState).itemId === itemId,
  );
}

function isPendingFlagsMap(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value as Record<string, unknown>).every(
    ([itemId, flaggedAt]) => itemId.length > 0 && isFiniteNonNegativeInteger(flaggedAt),
  );
}

/** 손상된 엔트리만 버리고 정상 엔트리는 보존한다. 남는 게 없으면 undefined. */
function sanitizePendingFlags(value: unknown): Record<string, number> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const result: Record<string, number> = {};
  for (const [itemId, flaggedAt] of Object.entries(value as Record<string, unknown>)) {
    if (itemId.length > 0 && isFiniteNonNegativeInteger(flaggedAt)) {
      result[itemId] = flaggedAt;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function sameRubricScores(a: RubricScores | undefined, b: RubricScores | undefined): boolean {
  if (a === undefined || b === undefined) return a === b;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return Array.from(keys).every(
    (key) =>
      (a as unknown as Record<string, number>)[key] ===
      (b as unknown as Record<string, number>)[key],
  );
}

/** 같은 시각의 백업·projection이 사용자가 나중에 바꾼 flag만 되돌리지 않게 비교한다. */
export function sameAttemptIgnoringFlag(a: AttemptState, b: AttemptState): boolean {
  if (a.kind !== b.kind || a.itemId !== b.itemId) return false;
  if (a.attemptCount !== b.attemptCount || a.lastAttemptedAt !== b.lastAttemptedAt) return false;
  if (a.kind === "reading" && b.kind === "reading") {
    return a.selectedAnswer === b.selectedAnswer && a.correct === b.correct;
  }
  if (a.kind === "listening" && b.kind === "listening") {
    return a.selectedAnswer === b.selectedAnswer && a.correct === b.correct;
  }
  if (a.kind === "open" && b.kind === "open") {
    return (
      a.completed === b.completed &&
      a.draft === b.draft &&
      a.selfScore === b.selfScore &&
      sameRubricScores(a.rubricScores, b.rubricScores)
    );
  }
  return false;
}

function shouldReplaceAttempt(existing: AttemptState | undefined, incoming: AttemptState): boolean {
  if (!existing || incoming.lastAttemptedAt > existing.lastAttemptedAt) return true;
  return (
    incoming.lastAttemptedAt === existing.lastAttemptedAt &&
    !sameAttemptIgnoringFlag(existing, incoming)
  );
}

/**
 * attempt가 존재하는 문항의 대기 별표를 흡수하고 엔트리를 제거한다(복습
 * 대기열 중복 방지). 복구·백업 병합에서는 별표 시각이 attempt보다 최신일
 * 때만 승격해 오래된 백업이 해제 상태를 되살리지 않는다. 같은 작업에서
 * 첫 attempt를 만드는 호출자는 forcePromoteItemIds로 명시해 제출 전 별표를
 * 보존한다. changed는 엔트리 제거 또는 승격이 있었음을 뜻한다.
 */
export function consumePendingFlags(
  attempts: Record<string, AttemptState>,
  pendingFlags: Record<string, number> | undefined,
  forcePromoteItemIds?: ReadonlySet<string>,
): { attempts: Record<string, AttemptState>; pendingFlags?: Record<string, number>; changed: boolean } {
  if (!pendingFlags) return { attempts, changed: false };
  let nextAttempts = attempts;
  let remaining: Record<string, number> | undefined;
  let changed = false;
  for (const [itemId, flaggedAt] of Object.entries(pendingFlags)) {
    const attempt = attempts[itemId];
    if (!attempt) {
      (remaining ??= {})[itemId] = flaggedAt;
      continue;
    }
    changed = true;
    const shouldPromote =
      forcePromoteItemIds?.has(itemId) === true || flaggedAt > attempt.lastAttemptedAt;
    if (shouldPromote && !attempt.flagged) {
      if (nextAttempts === attempts) nextAttempts = { ...attempts };
      nextAttempts[itemId] = { ...attempt, flagged: true };
    }
  }
  return { attempts: nextAttempts, pendingFlags: remaining, changed };
}

/** JSON 파싱 여부와 무관하게 동일한 관대한 pendingFlags 정화를 적용한다. */
export function coerceProgressSnapshot(value: unknown): ProgressSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  // attempts 손상은 종전대로 스냅샷 전체 실패(리셋 대상)로 취급하되,
  // pendingFlags 손상은 엔트리 단위로 정화해 attempts를 지킨다.
  const base: unknown = {
    schemaVersion: candidate.schemaVersion,
    attempts: candidate.attempts,
  };
  if (!isProgressSnapshot(base)) return null;
  const { attempts } = base as ProgressSnapshot;
  // attempt와 겹치는 대기 별표는 로드 시점에 흡수해 정규화한다.
  const consumed = consumePendingFlags(attempts, sanitizePendingFlags(candidate.pendingFlags));
  return buildSnapshot(consumed.attempts, consumed.pendingFlags);
}

export function parseProgressSnapshot(raw: string): ProgressSnapshot | null {
  try {
    return coerceProgressSnapshot(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function mergeSnapshots(current: ProgressSnapshot, incoming: ProgressSnapshot): ProgressSnapshot {
  const mergedAttempts = { ...current.attempts };
  for (const [itemId, attempt] of Object.entries(incoming.attempts)) {
    const existing = mergedAttempts[itemId];
    if (shouldReplaceAttempt(existing, attempt)) {
      mergedAttempts[itemId] = attempt;
    }
  }
  // 대기 별표는 최근 시각 우선으로 합친 뒤, 병합된 attempt가 있는 문항은 흡수한다.
  const mergedFlags: Record<string, number> = { ...(current.pendingFlags ?? {}) };
  for (const [itemId, flaggedAt] of Object.entries(incoming.pendingFlags ?? {})) {
    const existing = mergedFlags[itemId];
    if (existing === undefined || flaggedAt > existing) {
      mergedFlags[itemId] = flaggedAt;
    }
  }
  const consumed = consumePendingFlags(
    mergedAttempts,
    Object.keys(mergedFlags).length > 0 ? mergedFlags : undefined,
  );
  return buildSnapshot(consumed.attempts, consumed.pendingFlags);
}

export function exportProgress(store: AttemptStore): string {
  return JSON.stringify(store.load().snapshot);
}

export interface ImportStats {
  added: number;
  updated: number;
  skipped: number;
  /** 병합 전후 effective flag 상태가 달라진 문항 수. */
  flagsChanged?: number;
}

export interface ImportProgressResult {
  stats: ImportStats;
  persistent: boolean;
  /** 병합 직전 로컬 저장소의 손상 또는 접근 실패를 복구했는지 여부. */
  localRecovered: boolean;
}

export function importProgress(store: AttemptStore, jsonStr: string): ImportProgressResult | null {
  const incoming = parseProgressSnapshot(jsonStr);
  if (!incoming) return null;
  const loaded = store.load();
  const current = loaded.snapshot;

  const merged = mergeSnapshots(current, incoming);
  const stats: ImportStats = { added: 0, updated: 0, skipped: 0, flagsChanged: 0 };
  for (const [itemId, attempt] of Object.entries(incoming.attempts)) {
    const existing = current.attempts[itemId];
    if (!existing) stats.added += 1;
    else if (shouldReplaceAttempt(existing, attempt)) stats.updated += 1;
    else stats.skipped += 1;
  }
  const flagItemIds = new Set([
    ...Object.keys(current.attempts),
    ...Object.keys(current.pendingFlags ?? {}),
    ...Object.keys(merged.attempts),
    ...Object.keys(merged.pendingFlags ?? {}),
  ]);
  for (const itemId of flagItemIds) {
    const currentFlagged =
      current.attempts[itemId]?.flagged ?? current.pendingFlags?.[itemId] !== undefined;
    const mergedFlagged =
      merged.attempts[itemId]?.flagged ?? merged.pendingFlags?.[itemId] !== undefined;
    if (currentFlagged !== mergedFlagged) {
      stats.flagsChanged = (stats.flagsChanged ?? 0) + 1;
    }
  }

  const saved = store.save(merged);
  return {
    stats,
    persistent: saved.persistent,
    localRecovered: loaded.recovered,
  };
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
    // 제출 전 별표는 첫 attempt 저장 시(쓰기 초안 자동저장 포함) 같은 save로
    // 흡수한다 — 별표와 attempt가 서로 다른 행으로 남지 않는다.
    const consumed = consumePendingFlags(
      { ...snapshot.attempts, [attempt.itemId]: attempt },
      snapshot.pendingFlags,
      new Set([attempt.itemId]),
    );
    return this.save(buildSnapshot(consumed.attempts, consumed.pendingFlags));
  }

  /**
   * 답 제출 전 별표 토글. attempt가 이미 있으면 순수 헬퍼(setAttemptFlag)로
   * attempt.flagged를 바꾸는 updateAttempt 호출이고, 없으면 pendingFlags
   * 엔트리만 추가·제거한다.
   */
  setPendingFlag(itemId: string, flagged: boolean, now = Date.now()): StorageSaveResult {
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
    // 복습 대기열의 "기록 삭제"가 미풀이 별표 행도 지울 수 있도록 함께 정리한다.
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
