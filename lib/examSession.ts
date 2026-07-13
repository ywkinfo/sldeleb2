import type {
  AttemptState,
  ExamBlueprint,
  ExamPlayback,
  ExamResult,
  ExamResultItem,
  ExamSectionSnapshot,
  ExamSession,
  ExamSessionSnapshot,
  FinalizedExamSession,
  InProgressExamSession,
  ListeningMCQItem,
  ListeningScript,
  PracticeItem,
  PracticeSet,
  ProgressSnapshot,
  ReadingMCQItem,
  Task,
} from "./types";
import { orderItemsBySet } from "./sets";
import { gradeMcqAttempt } from "./grading";
import { isAttemptState, type AttemptStore, type StorageLike } from "./storage";

export const EXAM_STORAGE_KEY = "dele-b2:exam:v1";
export const EXAM_SCHEMA_VERSION = 1 as const;
export const MAX_PLAYBACKS_PER_SCRIPT = 2;
/** terminal 세션 보존 상한. in-progress·projection pending은 절대 삭제하지 않는다. */
export const MAX_TERMINAL_SESSIONS = 50;

export type ExamMcqItem = ReadingMCQItem | ListeningMCQItem;

export interface ResolvedExamItem {
  item: ExamMcqItem;
  task: Task;
  /** 듣기 문항의 음원·대본. 콘텐츠에서 사라졌으면 undefined(채점에는 불필요). */
  script?: ListeningScript;
}

export interface ExamContentCollections {
  practiceSets: readonly PracticeSet[];
  practiceItems: readonly PracticeItem[];
  listeningScripts: readonly ListeningScript[];
}

// ---- 구성 스냅샷과 해석 ----

/** 세션 시작 시 블루프린트를 구성 스냅샷으로 고정한다. */
export function snapshotBlueprint(
  blueprint: ExamBlueprint,
  collections: ExamContentCollections,
): ExamSectionSnapshot[] {
  return blueprint.sections.map((section) => {
    const set = collections.practiceSets.find((candidate) => candidate.id === section.setId);
    const items = set ? orderItemsBySet(set, collections.practiceItems) : [];
    const scriptIds: string[] = [];
    for (const item of items) {
      if (item.kind === "mcq" && item.skill === "listening" && !scriptIds.includes(item.scriptId)) {
        scriptIds.push(item.scriptId);
      }
    }
    return {
      task: section.task,
      setId: section.setId,
      itemIds: items.map((item) => item.id),
      scriptIds,
    };
  });
}

/**
 * 세션의 스냅샷을 현재 콘텐츠로 해석한다. 배포로 콘텐츠가 바뀌어 문항이
 * 사라졌으면 missingItemIds로 보고한다(해당 문항은 미응답 처리).
 */
export function resolveSections(
  sections: readonly ExamSectionSnapshot[],
  collections: Pick<ExamContentCollections, "practiceItems" | "listeningScripts">,
): { resolved: ResolvedExamItem[]; missingItemIds: string[] } {
  const itemById = new Map(collections.practiceItems.map((item) => [item.id, item]));
  const scriptById = new Map(collections.listeningScripts.map((script) => [script.id, script]));
  const resolved: ResolvedExamItem[] = [];
  const missingItemIds: string[] = [];

  for (const section of sections) {
    for (const itemId of section.itemIds) {
      const item = itemById.get(itemId);
      if (!item || item.kind !== "mcq") {
        missingItemIds.push(itemId);
        continue;
      }
      resolved.push({
        item,
        task: section.task,
        script: item.skill === "listening" ? scriptById.get(item.scriptId) : undefined,
      });
    }
  }
  return { resolved, missingItemIds };
}

// ---- 세션 생성과 전이 (순수 함수) ----

export function createExamSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `exam-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createExamSession(
  blueprint: ExamBlueprint,
  sections: ExamSectionSnapshot[],
  now: number,
  id = createExamSessionId(),
): InProgressExamSession {
  return {
    id,
    blueprintId: blueprint.id,
    blueprintVersion: blueprint.version,
    sections,
    startedAt: now,
    deadlineAt: now + blueprint.timeLimitMin * 60_000,
    status: "in-progress",
    answers: {},
    flaggedItemIds: [],
    playbacks: {},
  };
}

/** deadlineAt이 유일한 진실 — terminal이거나 deadline이 지났으면 변경 불가. */
export function canMutateSession(session: ExamSession, now: number): session is InProgressExamSession {
  return session.status === "in-progress" && now < session.deadlineAt;
}

function sessionHasItem(session: ExamSession, itemId: string): boolean {
  return session.sections.some((section) => section.itemIds.includes(itemId));
}

export function answerExamItem(session: ExamSession, itemId: string, answer: string, now: number): ExamSession {
  if (!canMutateSession(session, now) || !sessionHasItem(session, itemId)) return session;
  return { ...session, answers: { ...session.answers, [itemId]: answer } };
}

export function toggleExamFlag(session: ExamSession, itemId: string, now: number): ExamSession {
  if (!canMutateSession(session, now) || !sessionHasItem(session, itemId)) return session;
  const flagged = session.flaggedItemIds.includes(itemId);
  return {
    ...session,
    flaggedItemIds: flagged
      ? session.flaggedItemIds.filter((id) => id !== itemId)
      : [...session.flaggedItemIds, itemId],
  };
}

// ---- 오디오 재생 슬롯 ----

function playbackFor(session: ExamSession, scriptId: string): ExamPlayback {
  return session.playbacks[scriptId] ?? { used: 0, active: false };
}

export function canPlayScript(session: ExamSession, scriptId: string, now: number): boolean {
  if (!canMutateSession(session, now)) return false;
  const playback = playbackFor(session, scriptId);
  return playback.active || playback.used < MAX_PLAYBACKS_PER_SCRIPT;
}

/** 실제 재생 시작 시 슬롯 예약. pause/resume은 active 슬롯을 그대로 쓴다. */
export function reservePlayback(session: ExamSession, scriptId: string, now: number): ExamSession {
  if (!canMutateSession(session, now)) return session;
  const playback = playbackFor(session, scriptId);
  if (playback.active || playback.used >= MAX_PLAYBACKS_PER_SCRIPT) return session;
  return {
    ...session,
    playbacks: { ...session.playbacks, [scriptId]: { used: playback.used + 1, active: true } },
  };
}

/** ended — 예약된 슬롯 완료. */
export function completePlayback(session: ExamSession, scriptId: string, now: number): ExamSession {
  if (!canMutateSession(session, now)) return session;
  const playback = playbackFor(session, scriptId);
  if (!playback.active) return session;
  return {
    ...session,
    playbacks: { ...session.playbacks, [scriptId]: { used: playback.used, active: false } },
  };
}

/**
 * 세션 복원(새로고침) 시 active 슬롯을 닫는다. 끝까지 듣지 않고 새로고침을
 * 반복해 같은 슬롯을 재사용하는 우회를 막는다 — 이탈하면 그 회차를 잃는다.
 */
export function closeActivePlaybacks(session: ExamSession, now: number): ExamSession {
  if (!canMutateSession(session, now)) return session;
  const activeIds = Object.keys(session.playbacks).filter((scriptId) => session.playbacks[scriptId].active);
  if (activeIds.length === 0) return session;
  const playbacks = { ...session.playbacks };
  for (const scriptId of activeIds) {
    playbacks[scriptId] = { used: playbacks[scriptId].used, active: false };
  }
  return { ...session, playbacks };
}

/** 재생 실패·media error — 예약된 슬롯 환불. */
export function refundPlayback(session: ExamSession, scriptId: string, now: number): ExamSession {
  if (!canMutateSession(session, now)) return session;
  const playback = playbackFor(session, scriptId);
  if (!playback.active) return session;
  return {
    ...session,
    playbacks: { ...session.playbacks, [scriptId]: { used: Math.max(0, playback.used - 1), active: false } },
  };
}

// ---- 최종화 (단일 finalize) ----

/**
 * 세션 최종화. terminal 재호출은 no-op. now >= deadlineAt이면 사유와 무관하게
 * expired, "expire" 요청이 deadline 전에 도착하면(타이머 오차) 아무것도 하지
 * 않는다. projection payload는 이 시점에 1회만 계산되어 세션에 저장된다.
 */
export function finalizeExamSession(
  session: ExamSession,
  resolved: readonly ResolvedExamItem[],
  previousAttempts: Record<string, AttemptState>,
  now: number,
  requestedReason: "submit" | "expire",
): ExamSession {
  if (session.status !== "in-progress") return session;
  const pastDeadline = now >= session.deadlineAt;
  if (requestedReason === "expire" && !pastDeadline) return session;
  const status = pastDeadline ? "expired" : "submitted";

  const resolvedById = new Map(resolved.map((entry) => [entry.item.id, entry]));
  const items: ExamResultItem[] = [];
  const byTask: ExamResult["byTask"] = {};
  const projectionAttempts: AttemptState[] = [];
  let correct = 0;
  let total = 0;

  for (const section of session.sections) {
    const taskTally = (byTask[section.task] ??= { correct: 0, total: 0 });
    for (const itemId of section.itemIds) {
      total += 1;
      taskTally.total += 1;
      const entry = resolvedById.get(itemId);
      if (!entry) continue; // 콘텐츠에서 사라진 문항: 미응답으로 집계만.

      const raw = session.answers[itemId];
      // 손상된 answer key는 미응답 취급 — 채점 전체가 실패하지 않는다.
      const selectedAnswer =
        raw !== undefined && entry.item.options.some((option) => option.key === raw) ? raw : undefined;
      const isCorrect = selectedAnswer === entry.item.correctAnswer;
      if (isCorrect) {
        correct += 1;
        taskTally.correct += 1;
      }
      items.push({
        itemId,
        task: section.task,
        selectedAnswer,
        correctAnswer: entry.item.correctAnswer,
        correct: isCorrect,
      });
      if (selectedAnswer !== undefined) {
        // 시험 별표(flaggedItemIds)는 attempt.flagged로 복사하지 않는다 —
        // gradeMcqAttempt가 기존 attempt의 flag만 보존한다.
        projectionAttempts.push(gradeMcqAttempt(entry.item, selectedAnswer, previousAttempts[itemId], now));
      }
    }
  }

  return {
    ...session,
    status,
    submittedAt: now,
    result: { correct, total, byTask, items },
    progressProjection:
      projectionAttempts.length > 0
        ? { status: "pending", attempts: projectionAttempts }
        : { status: "complete" },
  };
}

// ---- projection 적용 (dele-b2:v1 병합, 멱등) ----

function sameAttemptIgnoringFlag(a: AttemptState, b: AttemptState): boolean {
  if (a.kind !== b.kind || a.itemId !== b.itemId) return false;
  if (a.attemptCount !== b.attemptCount || a.lastAttemptedAt !== b.lastAttemptedAt) return false;
  if ((a.kind === "reading" || a.kind === "listening") && (b.kind === "reading" || b.kind === "listening")) {
    return a.selectedAnswer === b.selectedAnswer && a.correct === b.correct;
  }
  return true;
}

/**
 * pending payload를 ProgressSnapshot에 병합한다.
 * - 기존 attempt가 payload보다 최신이면 보존.
 * - timestamp·값이 같으면 이미 반영된 것(재시도 시 attemptCount 불변).
 *   flag는 비교에서 제외해, 반영 후 사용자가 바꾼 별표를 되돌리지 않는다.
 */
export function applyProjectionToSnapshot(
  snapshot: ProgressSnapshot,
  payload: readonly AttemptState[],
): { snapshot: ProgressSnapshot; changed: boolean } {
  const attempts = { ...snapshot.attempts };
  let changed = false;
  for (const attempt of payload) {
    const existing = attempts[attempt.itemId];
    if (existing) {
      if (existing.lastAttemptedAt > attempt.lastAttemptedAt) continue;
      if (existing.lastAttemptedAt === attempt.lastAttemptedAt && sameAttemptIgnoringFlag(existing, attempt)) {
        continue;
      }
    }
    attempts[attempt.itemId] = attempt;
    changed = true;
  }
  if (!changed) return { snapshot, changed: false };
  return { snapshot: { schemaVersion: 1, attempts }, changed: true };
}

// ---- 저장 스냅샷 검증 ----

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === "string")
  );
}

function isExamPlaybackMap(value: unknown): value is Record<string, ExamPlayback> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((entry) => {
    const playback = entry as Partial<ExamPlayback>;
    return (
      !!entry &&
      typeof entry === "object" &&
      isFiniteNonNegative(playback.used) &&
      typeof playback.active === "boolean"
    );
  });
}

function isExamSectionSnapshot(value: unknown): value is ExamSectionSnapshot {
  const section = value as Partial<ExamSectionSnapshot>;
  return (
    !!value &&
    typeof value === "object" &&
    typeof section.task === "string" &&
    typeof section.setId === "string" &&
    Array.isArray(section.itemIds) &&
    section.itemIds.every((id) => typeof id === "string") &&
    Array.isArray(section.scriptIds) &&
    section.scriptIds.every((id) => typeof id === "string")
  );
}

function isExamResult(value: unknown): value is ExamResult {
  const result = value as Partial<ExamResult>;
  if (!value || typeof value !== "object") return false;
  if (!isFiniteNonNegative(result.correct) || !isFiniteNonNegative(result.total)) return false;
  if (!result.byTask || typeof result.byTask !== "object") return false;
  if (!Array.isArray(result.items)) return false;
  return result.items.every((entry) => {
    const item = entry as Partial<ExamResultItem>;
    return (
      !!entry &&
      typeof entry === "object" &&
      typeof item.itemId === "string" &&
      typeof item.task === "string" &&
      (item.selectedAnswer === undefined || typeof item.selectedAnswer === "string") &&
      typeof item.correctAnswer === "string" &&
      typeof item.correct === "boolean"
    );
  });
}

export function isExamSession(value: unknown): value is ExamSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Record<string, unknown>;
  if (
    typeof session.id !== "string" ||
    session.id.length === 0 ||
    typeof session.blueprintId !== "string" ||
    !isFiniteNonNegative(session.blueprintVersion) ||
    !Array.isArray(session.sections) ||
    !session.sections.every(isExamSectionSnapshot) ||
    !isFiniteNonNegative(session.startedAt) ||
    !isFiniteNonNegative(session.deadlineAt) ||
    !isStringRecord(session.answers) ||
    !Array.isArray(session.flaggedItemIds) ||
    !session.flaggedItemIds.every((id) => typeof id === "string") ||
    !isExamPlaybackMap(session.playbacks)
  ) {
    return false;
  }

  if (session.status === "in-progress") {
    return session.result === undefined && session.submittedAt === undefined;
  }
  if (session.status !== "submitted" && session.status !== "expired") return false;
  if (!isFiniteNonNegative(session.submittedAt) || !isExamResult(session.result)) return false;

  const projection = session.progressProjection as { status?: unknown; attempts?: unknown } | undefined;
  if (!projection || typeof projection !== "object") return false;
  if (projection.status === "complete") return projection.attempts === undefined;
  return (
    projection.status === "pending" &&
    Array.isArray(projection.attempts) &&
    projection.attempts.every(isAttemptState)
  );
}

export function isExamSessionSnapshot(value: unknown): value is ExamSessionSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Record<string, unknown>;
  return (
    snapshot.schemaVersion === EXAM_SCHEMA_VERSION &&
    Array.isArray(snapshot.sessions) &&
    snapshot.sessions.every(isExamSession)
  );
}

export function parseExamSessionSnapshot(raw: string): ExamSessionSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isExamSessionSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// ---- 세션 조회·병합·보존 ----

export function findActiveSession(
  sessions: readonly ExamSession[],
  blueprintId: string,
): InProgressExamSession | undefined {
  for (let index = sessions.length - 1; index >= 0; index -= 1) {
    const session = sessions[index];
    if (session.status === "in-progress" && session.blueprintId === blueprintId) return session;
  }
  return undefined;
}

export function findPendingProjectionSessions(sessions: readonly ExamSession[]): FinalizedExamSession[] {
  return sessions.filter(
    (session): session is FinalizedExamSession =>
      session.status !== "in-progress" && session.progressProjection.status === "pending",
  );
}

/**
 * 세션 upsert 병합 규칙: 같은 id의 terminal 세션을 in-progress로 되돌리는
 * 저장은 거부한다(멀티탭 last-write-wins에서 terminal이 항상 우선).
 */
export function upsertSessionInList(sessions: readonly ExamSession[], incoming: ExamSession): ExamSession[] {
  const index = sessions.findIndex((session) => session.id === incoming.id);
  if (index === -1) return [...sessions, incoming];
  const existing = sessions[index];
  if (existing.status !== "in-progress" && incoming.status === "in-progress") {
    return [...sessions];
  }
  const next = [...sessions];
  next[index] = incoming;
  return next;
}

/**
 * terminal 세션을 MAX_TERMINAL_SESSIONS개까지만 유지한다. in-progress와
 * projection pending 세션은 절대 삭제하지 않는다.
 */
export function pruneSessions(sessions: readonly ExamSession[]): ExamSession[] {
  const terminalCount = sessions.filter((session) => session.status !== "in-progress").length;
  let toRemove = terminalCount - MAX_TERMINAL_SESSIONS;
  if (toRemove <= 0) return [...sessions];
  const result: ExamSession[] = [];
  for (const session of sessions) {
    const removable =
      toRemove > 0 && session.status !== "in-progress" && session.progressProjection.status === "complete";
    if (removable) {
      toRemove -= 1;
      continue;
    }
    result.push(session);
  }
  return result;
}

// ---- 저장소 (AttemptStore 패턴, 별도 키) ----

export interface ExamStorageLoadResult {
  snapshot: ExamSessionSnapshot;
  persistent: boolean;
  recovered: boolean;
}

export type ExamStoreListener = (result: ExamStorageLoadResult) => void;

function emptyExamSnapshot(): ExamSessionSnapshot {
  return { schemaVersion: EXAM_SCHEMA_VERSION, sessions: [] };
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

  /** terminal 우선 병합으로 upsert하고, complete terminal 저장 시에만 prune한다. */
  upsertSession(session: ExamSession): { persistent: boolean } {
    const { snapshot } = this.load();
    let sessions = upsertSessionInList(snapshot.sessions, session);
    if (session.status !== "in-progress" && session.progressProjection.status === "complete") {
      sessions = pruneSessions(sessions);
    }
    return this.save({ schemaVersion: EXAM_SCHEMA_VERSION, sessions });
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

// ---- pending projection 적용 오케스트레이션 ----

/**
 * outbox 적용: ProgressSnapshot 1회 load → 병합 → 1회 save → 성공 시에만
 * projection complete로 전환. 비영속 폴백이면 pending을 유지한다(재시도 대상).
 */
export function applyPendingProjection(
  session: FinalizedExamSession,
  attemptStore: AttemptStore,
  examStore: ExamSessionStore,
): { applied: boolean; session: FinalizedExamSession } {
  if (session.progressProjection.status !== "pending") {
    return { applied: true, session };
  }
  const { snapshot } = attemptStore.load();
  const { snapshot: merged, changed } = applyProjectionToSnapshot(
    snapshot,
    session.progressProjection.attempts,
  );
  if (changed) {
    const saved = attemptStore.save(merged);
    if (!saved.persistent) {
      return { applied: false, session };
    }
  }
  const completed: FinalizedExamSession = { ...session, progressProjection: { status: "complete" } };
  examStore.upsertSession(completed);
  return { applied: true, session: completed };
}
