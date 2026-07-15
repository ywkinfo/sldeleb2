import type {
  AttemptState,
  ExamBlueprint,
  ExamItemContract,
  ExamPlayback,
  ExamResult,
  ExamResultItem,
  ExamScriptContract,
  ExamSectionSnapshot,
  ExamSession,
  ExamSessionSnapshot,
  ExamTextContract,
  FinalizedExamSession,
  InProgressExamSession,
  ListeningMCQItem,
  ListeningScript,
  PracticeItem,
  PracticeSet,
  ProgressSnapshot,
  ReadingMCQItem,
  ReadingText,
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
  /** 세션에 동결된 문항 계약(옛 세션은 라이브에서 투영). 채점·표시의 유일한 기준. */
  item: ExamItemContract;
  task: Task;
  /** 듣기 문항의 동결 음원 메타. 계약·라이브 모두에서 찾지 못하면 undefined. */
  scriptMeta?: ExamScriptContract;
  /** 읽기 문항의 동결 지문 메타. 계약·라이브 모두에서 찾지 못하면 undefined. */
  textMeta?: ExamTextContract;
}

export interface ExamContentCollections {
  practiceSets: readonly PracticeSet[];
  practiceItems: readonly PracticeItem[];
  listeningScripts: readonly ListeningScript[];
  readingTexts: readonly ReadingText[];
}

/** 라이브 MCQ 아이템을 동결 계약으로 투영한다(skill별 배타적 ID). */
function toItemContract(item: ExamMcqItem): ExamItemContract {
  const base = {
    id: item.id,
    kind: "mcq" as const,
    prompt: item.prompt,
    options: item.options.map((option) => ({ key: option.key, text: option.text })),
    correctAnswer: item.correctAnswer,
    explanationKo: item.explanationKo,
  };
  return item.skill === "listening"
    ? { ...base, skill: "listening", scriptId: item.scriptId }
    : { ...base, skill: "reading", textId: item.textId };
}

/** 라이브 음원을 동결 음원 메타로 투영한다. */
function toScriptContract(script: ListeningScript): ExamScriptContract {
  return { scriptId: script.id, title: script.title, audioSrc: script.audioSrc };
}

/** 라이브 지문을 동결 지문 메타로 투영한다(표시 필드만). */
function toTextContract(text: ReadingText): ExamTextContract {
  return { textId: text.id, title: text.title, passage: text.passage };
}

// ---- 구성 스냅샷과 해석 ----

/**
 * 세션 시작 시 블루프린트를 구성 스냅샷으로 고정한다. 순서(itemIds/scriptIds)뿐
 * 아니라 문항·정답·음원 계약까지 동결해, 이후 배포로 콘텐츠가 바뀌어도 진행 중
 * 세션의 채점·표시가 시작 시점 값을 그대로 쓰도록 한다.
 */
export function snapshotBlueprint(
  blueprint: ExamBlueprint,
  collections: ExamContentCollections,
): ExamSectionSnapshot[] {
  const scriptById = new Map(collections.listeningScripts.map((script) => [script.id, script]));
  const textById = new Map(collections.readingTexts.map((text) => [text.id, text]));
  // 듣기 스냅샷은 기존 형태(textIds/texts 없음)를 그대로 유지하고, 읽기 섹션에만
  // 지문 계약을 additive로 얼린다(하위호환 행렬).
  const isReading = blueprint.skill === "reading";
  return blueprint.sections.map((section) => {
    const set = collections.practiceSets.find((candidate) => candidate.id === section.setId);
    const orderedItems = set ? orderItemsBySet(set, collections.practiceItems) : [];
    const mcqItems = orderedItems.filter((item): item is ExamMcqItem => item.kind === "mcq");
    const scriptIds: string[] = [];
    const scripts: ExamScriptContract[] = [];
    const textIds: string[] = [];
    const texts: ExamTextContract[] = [];
    // scriptIds/textIds는 문항 첫 등장 순서로 수집한다.
    for (const item of mcqItems) {
      if (item.skill === "listening" && !scriptIds.includes(item.scriptId)) {
        scriptIds.push(item.scriptId);
        const script = scriptById.get(item.scriptId);
        if (script) scripts.push(toScriptContract(script));
      }
      if (item.skill === "reading" && !textIds.includes(item.textId)) {
        textIds.push(item.textId);
        const text = textById.get(item.textId);
        if (text) texts.push(toTextContract(text));
      }
    }
    return {
      task: section.task,
      // itemIds는 mcq 문항으로 한정해 계약(items)과 1:1 정합을 보장한다 —
      // 자동 채점 시험 세트는 전부 mcq라 현재 콘텐츠에서는 무변경.
      setId: section.setId,
      itemIds: mcqItems.map((item) => item.id),
      scriptIds,
      items: mcqItems.map(toItemContract),
      scripts,
      ...(isReading ? { textIds, texts } : {}),
    };
  });
}

/**
 * 세션의 스냅샷을 해석한다. 동결 계약(section.items/scripts)이 있으면 그것을
 * 우선 사용하고(배포와 무관), 없는 옛 세션만 현재 콘텐츠로 폴백 조회한다. 폴백
 * 조회에서도 문항이 사라졌으면 missingItemIds로 보고한다(해당 문항은 미응답 처리).
 */
export function resolveSections(
  sections: readonly ExamSectionSnapshot[],
  collections: Pick<ExamContentCollections, "practiceItems" | "listeningScripts" | "readingTexts">,
): { resolved: ResolvedExamItem[]; missingItemIds: string[] } {
  const liveItemById = new Map(collections.practiceItems.map((item) => [item.id, item]));
  const liveScriptById = new Map(collections.listeningScripts.map((script) => [script.id, script]));
  const liveTextById = new Map(collections.readingTexts.map((text) => [text.id, text]));
  const resolved: ResolvedExamItem[] = [];
  const missingItemIds: string[] = [];

  // 세션 단위 all-or-nothing: 한 섹션이라도 동결이면 세션 전체를 동결로 취급해
  // 어떤 섹션도 라이브를 읽지 않는다(혼합 세션 방어). 계약 없는 옛 세션만 폴백.
  const frozen = sections.some((section) => section.items !== undefined);

  for (const section of sections) {
    const contractById = new Map((section.items ?? []).map((contract) => [contract.id, contract]));
    const scriptContractById = new Map((section.scripts ?? []).map((script) => [script.scriptId, script]));
    const textContractById = new Map((section.texts ?? []).map((text) => [text.textId, text]));

    for (const itemId of section.itemIds) {
      let contract = contractById.get(itemId);
      if (!contract) {
        if (frozen) {
          // 동결 세션인데 계약이 없으면 라이브로 메우지 않고 누락 처리(미응답).
          missingItemIds.push(itemId);
          continue;
        }
        const live = liveItemById.get(itemId);
        if (!live || live.kind !== "mcq") {
          missingItemIds.push(itemId);
          continue;
        }
        contract = toItemContract(live);
      }

      // 듣기=음원, 읽기=지문 메타를 동결 계약에서 찾고, 계약 없는 옛 세션만 라이브로
      // 보충한다(frozen이면 backfill 금지).
      let scriptMeta: ExamScriptContract | undefined;
      let textMeta: ExamTextContract | undefined;
      if (contract.skill === "listening") {
        scriptMeta = scriptContractById.get(contract.scriptId);
        if (!scriptMeta && !frozen) {
          const liveScript = liveScriptById.get(contract.scriptId);
          if (liveScript) scriptMeta = toScriptContract(liveScript);
        }
      } else {
        textMeta = textContractById.get(contract.textId);
        if (!textMeta && !frozen) {
          const liveText = liveTextById.get(contract.textId);
          if (liveText) textMeta = toTextContract(liveText);
        }
      }

      resolved.push({ item: contract, task: section.task, scriptMeta, textMeta });
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

function isMcqOptionArray(value: unknown): value is { key: string; text: string }[] {
  return (
    Array.isArray(value) &&
    value.every((entry) => {
      const option = entry as Partial<{ key: string; text: string }>;
      return !!entry && typeof entry === "object" && typeof option.key === "string" && typeof option.text === "string";
    })
  );
}

function hasDuplicates(ids: readonly string[]): boolean {
  return new Set(ids).size !== ids.length;
}

function isExamItemContract(value: unknown): value is ExamItemContract {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  if (
    typeof c.id !== "string" ||
    c.kind !== "mcq" ||
    typeof c.prompt !== "string" ||
    !isMcqOptionArray(c.options) ||
    typeof c.correctAnswer !== "string" ||
    typeof c.explanationKo !== "string"
  ) {
    return false;
  }
  // skill별 배타적 ID: 읽기=textId(only), 듣기=scriptId(only).
  if (c.skill === "reading") {
    if (typeof c.textId !== "string" || c.scriptId !== undefined) return false;
  } else if (c.skill === "listening") {
    if (typeof c.scriptId !== "string" || c.textId !== undefined) return false;
  } else {
    return false;
  }
  // 옵션 키는 유일하고, 정답 키는 선택지에 존재해야 한다.
  const optionKeys = c.options.map((option) => option.key);
  return !hasDuplicates(optionKeys) && optionKeys.includes(c.correctAnswer);
}

function isExamScriptContract(value: unknown): value is ExamScriptContract {
  const script = value as Partial<ExamScriptContract>;
  return (
    !!value &&
    typeof value === "object" &&
    typeof script.scriptId === "string" &&
    typeof script.title === "string" &&
    typeof script.audioSrc === "string"
  );
}

function isExamTextContract(value: unknown): value is ExamTextContract {
  const text = value as Partial<ExamTextContract>;
  return (
    !!value &&
    typeof value === "object" &&
    typeof text.textId === "string" &&
    typeof text.title === "string" &&
    typeof text.passage === "string"
  );
}

function isExamSectionSnapshot(value: unknown): value is ExamSectionSnapshot {
  const section = value as Partial<ExamSectionSnapshot>;
  if (
    !value ||
    typeof value !== "object" ||
    typeof section.task !== "string" ||
    typeof section.setId !== "string" ||
    !Array.isArray(section.itemIds) ||
    !section.itemIds.every((id) => typeof id === "string") ||
    !Array.isArray(section.scriptIds) ||
    !section.scriptIds.every((id) => typeof id === "string")
  ) {
    return false;
  }

  // 동결 계약은 all-or-nothing. items·scripts, textIds·texts는 각각 함께 존재/부재.
  const hasItems = section.items !== undefined;
  const hasScripts = section.scripts !== undefined;
  const hasTextIds = section.textIds !== undefined;
  const hasTexts = section.texts !== undefined;
  if (hasItems !== hasScripts) return false;
  if (hasTextIds !== hasTexts) return false; // 한쪽만 존재 거부.
  if (!hasItems) {
    // 옛(계약 없는) 세션 — 비파괴 통과하되, 지문 계약이 붙은 가상 frozen 읽기는 거부.
    return !hasTextIds;
  }

  // 형태 검증.
  if (!Array.isArray(section.items) || !section.items.every(isExamItemContract)) return false;
  if (!Array.isArray(section.scripts) || !section.scripts.every(isExamScriptContract)) return false;
  if (hasTextIds) {
    if (!Array.isArray(section.textIds) || !section.textIds.every((id) => typeof id === "string")) return false;
    if (!Array.isArray(section.texts) || !section.texts.every(isExamTextContract)) return false;
  }

  const contractItemIds = section.items.map((contract) => contract.id);
  const contractScriptIds = section.scripts.map((script) => script.scriptId);
  const textIds = section.textIds ?? [];
  const contractTextIds = (section.texts ?? []).map((text) => text.textId);

  // 중복 ID 금지.
  if (
    hasDuplicates(section.itemIds) ||
    hasDuplicates(section.scriptIds) ||
    hasDuplicates(contractItemIds) ||
    hasDuplicates(contractScriptIds) ||
    hasDuplicates(textIds) ||
    hasDuplicates(contractTextIds)
  ) {
    return false;
  }

  // 계약 배열과 ID 목록이 정확히 일치해야 한다(누락·잉여 계약 모두 거부).
  const itemIdSet = new Set(section.itemIds);
  const scriptIdSet = new Set(section.scriptIds);
  const textIdSet = new Set(textIds);
  if (contractItemIds.length !== section.itemIds.length || !contractItemIds.every((id) => itemIdSet.has(id))) {
    return false;
  }
  if (
    contractScriptIds.length !== section.scriptIds.length ||
    !contractScriptIds.every((id) => scriptIdSet.has(id))
  ) {
    return false;
  }
  if (contractTextIds.length !== textIds.length || !contractTextIds.every((id) => textIdSet.has(id))) {
    return false;
  }

  // 문항–계약 관계: 듣기 문항은 섹션 스크립트에, 읽기 문항은 섹션 지문에 포함(렌더 가능)돼야 한다.
  if (
    !section.items.every((contract) =>
      contract.skill === "listening"
        ? scriptIdSet.has(contract.scriptId)
        : textIdSet.has(contract.textId),
    )
  ) {
    return false;
  }

  // 참조되지 않는 계약 거부: 모든 스크립트·지문 계약은 어떤 문항이든 실제로 참조해야 한다.
  const referencedScriptIds = new Set(
    section.items.flatMap((contract) => (contract.skill === "listening" ? [contract.scriptId] : [])),
  );
  const referencedTextIds = new Set(
    section.items.flatMap((contract) => (contract.skill === "reading" ? [contract.textId] : [])),
  );
  return (
    contractScriptIds.every((id) => referencedScriptIds.has(id)) &&
    contractTextIds.every((id) => referencedTextIds.has(id))
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

  // 세션 단위 all-or-nothing — 섹션은 모두 동결이거나 모두 옛(계약 없음)이어야 한다.
  const frozenFlags = (session.sections as ExamSectionSnapshot[]).map((s) => s.items !== undefined);
  if (frozenFlags.some(Boolean) && !frozenFlags.every(Boolean)) return false;

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
