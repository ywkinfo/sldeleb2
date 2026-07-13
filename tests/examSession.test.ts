import { describe, expect, it } from "vitest";
import {
  answerExamItem,
  applyPendingProjection,
  applyProjectionToSnapshot,
  canPlayScript,
  completePlayback,
  createExamSession,
  createExamSessionStore,
  EXAM_STORAGE_KEY,
  finalizeExamSession,
  findActiveSession,
  MAX_TERMINAL_SESSIONS,
  pruneSessions,
  refundPlayback,
  reservePlayback,
  resolveSections,
  snapshotBlueprint,
  toggleExamFlag,
  upsertSessionInList,
} from "../lib/examSession";
import { createAttemptStore, PROGRESS_STORAGE_KEY } from "../lib/storage";
import type {
  AttemptState,
  ExamBlueprint,
  ExamSession,
  FinalizedExamSession,
  ListeningMCQItem,
  ListeningScript,
  PracticeSet,
  ProgressSnapshot,
} from "../lib/types";

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

const review = {
  status: "published" as const,
  reviewedBy: "Spanish Lab",
  reviewedAt: "2026-07-13T00:00:00.000Z",
};

function script(id: string, task: ListeningScript["task"]): ListeningScript {
  return {
    id,
    task,
    title: `Guion ${id}`,
    audioSrc: `/audio/listening/${id}.m4a`,
    transcript: "LOCUTOR: Hola.",
    voices: { LOCUTOR: "es-ES-ElviraNeural" },
    rate: "+0%",
    sourceNote: "창작 스크립트",
    ...review,
  };
}

function mcq(id: string, scriptId: string, correctAnswer: string): ListeningMCQItem {
  return {
    id,
    skill: "listening",
    kind: "mcq",
    scriptId,
    prompt: `Pregunta ${id}`,
    options: [
      { key: "a", text: "A" },
      { key: "b", text: "B" },
      { key: "c", text: "C" },
    ],
    correctAnswer,
    explanationKo: "해설",
    tags: ["detalle"],
    ...review,
  };
}

const scripts = [script("s1", "tarea1"), script("s2", "tarea2")];
const items = [mcq("l1", "s1", "a"), mcq("l2", "s1", "b"), mcq("l3", "s2", "c")];
const sets: PracticeSet[] = [
  { id: "setA", title: "T1", estimatedMin: 10, skill: "listening", itemIds: ["l1", "l2"], ...review },
  { id: "setB", title: "T2", estimatedMin: 10, skill: "listening", itemIds: ["l3"], ...review },
];
const blueprint: ExamBlueprint = {
  id: "bp-test",
  version: 1,
  title: "테스트 모의고사",
  skill: "listening",
  timeLimitMin: 40,
  sections: [
    { task: "tarea1", setId: "setA" },
    { task: "tarea2", setId: "setB" },
  ],
};
const collections = { practiceSets: sets, practiceItems: items, listeningScripts: scripts };

const T0 = 1_000_000;
const DEADLINE = T0 + 40 * 60_000;

function newSession() {
  return createExamSession(blueprint, snapshotBlueprint(blueprint, collections), T0, "session-1");
}

function resolved() {
  return resolveSections(newSession().sections, collections).resolved;
}

describe("snapshotBlueprint / resolveSections", () => {
  it("freezes item and script order from the blueprint's sets", () => {
    const sections = snapshotBlueprint(blueprint, collections);
    expect(sections).toEqual([
      { task: "tarea1", setId: "setA", itemIds: ["l1", "l2"], scriptIds: ["s1"] },
      { task: "tarea2", setId: "setB", itemIds: ["l3"], scriptIds: ["s2"] },
    ]);
  });

  it("reports items that disappeared from content as missing", () => {
    const sections = snapshotBlueprint(blueprint, collections);
    const { resolved: found, missingItemIds } = resolveSections(sections, {
      practiceItems: items.filter((item) => item.id !== "l2"),
      listeningScripts: scripts,
    });
    expect(found.map((entry) => entry.item.id)).toEqual(["l1", "l3"]);
    expect(missingItemIds).toEqual(["l2"]);
  });
});

describe("session transitions", () => {
  it("creates a session with an injected id and a 40-minute deadline", () => {
    const session = newSession();
    expect(session.id).toBe("session-1");
    expect(session.deadlineAt).toBe(DEADLINE);
    expect(session.status).toBe("in-progress");
  });

  it("records and updates answers, ignoring unknown items", () => {
    let session: ExamSession = newSession();
    session = answerExamItem(session, "l1", "a", T0 + 1);
    session = answerExamItem(session, "l1", "b", T0 + 2);
    session = answerExamItem(session, "unknown", "a", T0 + 3);
    expect(session.answers).toEqual({ l1: "b" });
  });

  it("round-trips a review flag", () => {
    let session: ExamSession = newSession();
    session = toggleExamFlag(session, "l2", T0 + 1);
    expect(session.flaggedItemIds).toEqual(["l2"]);
    session = toggleExamFlag(session, "l2", T0 + 2);
    expect(session.flaggedItemIds).toEqual([]);
  });

  it("rejects mutations once the deadline has passed", () => {
    const session = newSession();
    expect(answerExamItem(session, "l1", "a", DEADLINE)).toBe(session);
    expect(toggleExamFlag(session, "l1", DEADLINE)).toBe(session);
    expect(reservePlayback(session, "s1", DEADLINE)).toBe(session);
  });
});

describe("playback slots", () => {
  it("consumes slots 0→1→2 and blocks a third playback", () => {
    let session: ExamSession = newSession();
    expect(canPlayScript(session, "s1", T0)).toBe(true);

    session = reservePlayback(session, "s1", T0 + 1);
    expect(session.playbacks.s1).toEqual({ used: 1, active: true });
    // pause/resume은 같은 슬롯 — active 중 재예약은 no-op.
    expect(reservePlayback(session, "s1", T0 + 2)).toBe(session);

    session = completePlayback(session, "s1", T0 + 3);
    expect(session.playbacks.s1).toEqual({ used: 1, active: false });

    session = reservePlayback(session, "s1", T0 + 4);
    session = completePlayback(session, "s1", T0 + 5);
    expect(session.playbacks.s1).toEqual({ used: 2, active: false });

    expect(canPlayScript(session, "s1", T0 + 6)).toBe(false);
    expect(reservePlayback(session, "s1", T0 + 7)).toBe(session);
  });

  it("refunds a reserved slot on playback failure", () => {
    let session: ExamSession = newSession();
    session = reservePlayback(session, "s1", T0 + 1);
    session = refundPlayback(session, "s1", T0 + 2);
    expect(session.playbacks.s1).toEqual({ used: 0, active: false });
    expect(canPlayScript(session, "s1", T0 + 3)).toBe(true);
  });
});

describe("finalizeExamSession", () => {
  it("grades correct, wrong, and unanswered items into totals and byTask", () => {
    let session: ExamSession = newSession();
    session = answerExamItem(session, "l1", "a", T0 + 1); // 정답
    session = answerExamItem(session, "l2", "a", T0 + 2); // 오답
    const finalized = finalizeExamSession(session, resolved(), {}, T0 + 10, "submit") as FinalizedExamSession;

    expect(finalized.status).toBe("submitted");
    expect(finalized.result.correct).toBe(1);
    expect(finalized.result.total).toBe(3);
    expect(finalized.result.byTask).toEqual({
      tarea1: { correct: 1, total: 2 },
      tarea2: { correct: 0, total: 1 },
    });
    expect(finalized.result.items).toHaveLength(3);
    expect(finalized.result.items[2]).toEqual({
      itemId: "l3",
      task: "tarea2",
      selectedAnswer: undefined,
      correctAnswer: "c",
      correct: false,
    });
    // 미응답 l3는 projection payload에서 제외된다.
    expect(finalized.progressProjection).toMatchObject({ status: "pending" });
    if (finalized.progressProjection.status === "pending") {
      expect(finalized.progressProjection.attempts.map((attempt) => attempt.itemId)).toEqual(["l1", "l2"]);
    }
  });

  it("builds projection attempts on top of previous practice attempts", () => {
    const previous: Record<string, AttemptState> = {
      l1: { kind: "listening", itemId: "l1", selectedAnswer: "b", correct: false, flagged: true, attemptCount: 2, lastAttemptedAt: 500 },
    };
    let session: ExamSession = newSession();
    session = answerExamItem(session, "l1", "a", T0 + 1);
    const finalized = finalizeExamSession(session, resolved(), previous, T0 + 10, "submit") as FinalizedExamSession;
    if (finalized.progressProjection.status !== "pending") throw new Error("expected pending");
    // attemptCount 증가·기존 flag 보존, 시험 별표는 복사되지 않는다.
    expect(finalized.progressProjection.attempts[0]).toMatchObject({
      itemId: "l1",
      correct: true,
      attemptCount: 3,
      flagged: true,
      lastAttemptedAt: T0 + 10,
    });
  });

  it("expires exactly at the deadline regardless of the requested reason", () => {
    const finalized = finalizeExamSession(newSession(), resolved(), {}, DEADLINE, "submit");
    expect(finalized.status).toBe("expired");
  });

  it("ignores an expiry request that arrives before the deadline", () => {
    const session = newSession();
    expect(finalizeExamSession(session, resolved(), {}, DEADLINE - 1, "expire")).toBe(session);
  });

  it("is a no-op on terminal sessions and rejects further mutations", () => {
    const finalized = finalizeExamSession(newSession(), resolved(), {}, T0 + 10, "submit");
    expect(finalizeExamSession(finalized, resolved(), {}, T0 + 20, "submit")).toBe(finalized);
    expect(answerExamItem(finalized, "l1", "a", T0 + 20)).toBe(finalized);
    expect(toggleExamFlag(finalized, "l1", T0 + 20)).toBe(finalized);
  });

  it("treats a corrupted answer key as unanswered instead of crashing", () => {
    let session: ExamSession = newSession();
    session = { ...session, answers: { l1: "z" } };
    const finalized = finalizeExamSession(session, resolved(), {}, T0 + 10, "submit") as FinalizedExamSession;
    expect(finalized.result.items[0].selectedAnswer).toBeUndefined();
    expect(finalized.progressProjection.status).toBe("complete");
  });
});

const payloadAttempt: AttemptState = {
  kind: "listening",
  itemId: "l1",
  selectedAnswer: "a",
  correct: true,
  flagged: false,
  attemptCount: 1,
  lastAttemptedAt: T0 + 10,
};

describe("applyProjectionToSnapshot", () => {
  const empty: ProgressSnapshot = { schemaVersion: 1, attempts: {} };

  it("applies once and is idempotent on retry", () => {
    const first = applyProjectionToSnapshot(empty, [payloadAttempt]);
    expect(first.changed).toBe(true);
    const second = applyProjectionToSnapshot(first.snapshot, [payloadAttempt]);
    expect(second.changed).toBe(false);
    expect(second.snapshot.attempts.l1.attemptCount).toBe(1);
  });

  it("preserves a newer practice attempt over the payload", () => {
    const newer: ProgressSnapshot = {
      schemaVersion: 1,
      attempts: {
        l1: { ...payloadAttempt, selectedAnswer: "b", correct: false, attemptCount: 5, lastAttemptedAt: T0 + 999 },
      },
    };
    const result = applyProjectionToSnapshot(newer, [payloadAttempt]);
    expect(result.changed).toBe(false);
    expect(result.snapshot.attempts.l1.attemptCount).toBe(5);
  });

  it("does not undo a flag the user toggled after the first apply", () => {
    const flagged: ProgressSnapshot = {
      schemaVersion: 1,
      attempts: { l1: { ...payloadAttempt, flagged: true } },
    };
    const result = applyProjectionToSnapshot(flagged, [payloadAttempt]);
    expect(result.changed).toBe(false);
    expect(result.snapshot.attempts.l1.flagged).toBe(true);
  });
});

function finalizedSession(id: string, projection: FinalizedExamSession["progressProjection"]): FinalizedExamSession {
  const base = createExamSession(blueprint, snapshotBlueprint(blueprint, collections), T0, id);
  return {
    ...base,
    status: "submitted",
    submittedAt: T0 + 10,
    result: { correct: 0, total: 3, byTask: {}, items: [] },
    progressProjection: projection,
  } as FinalizedExamSession;
}

describe("session list rules", () => {
  it("refuses to downgrade a terminal session back to in-progress", () => {
    const terminal = finalizedSession("dup", { status: "complete" });
    const stale = createExamSession(blueprint, snapshotBlueprint(blueprint, collections), T0, "dup");
    const merged = upsertSessionInList([terminal], stale);
    expect(merged).toHaveLength(1);
    expect(merged[0].status).toBe("submitted");
  });

  it("prunes oldest complete terminal sessions but never pending or in-progress", () => {
    const completeSessions = Array.from({ length: MAX_TERMINAL_SESSIONS + 2 }, (_, index) =>
      finalizedSession(`done-${index}`, { status: "complete" }),
    );
    const pending = finalizedSession("pending-1", { status: "pending", attempts: [payloadAttempt] });
    const inProgress = createExamSession(blueprint, snapshotBlueprint(blueprint, collections), T0, "active-1");
    const pruned = pruneSessions([inProgress, ...completeSessions, pending]);

    const terminal = pruned.filter((session) => session.status !== "in-progress");
    expect(terminal).toHaveLength(MAX_TERMINAL_SESSIONS);
    expect(pruned.some((session) => session.id === "pending-1")).toBe(true);
    expect(pruned.some((session) => session.id === "active-1")).toBe(true);
    expect(pruned.some((session) => session.id === "done-0")).toBe(false);
    expect(pruned.some((session) => session.id === "done-1")).toBe(false);
  });

  it("finds the most recent in-progress session per blueprint", () => {
    const first = createExamSession(blueprint, [], T0, "one");
    const second = createExamSession(blueprint, [], T0 + 5, "two");
    expect(findActiveSession([first, second], blueprint.id)?.id).toBe("two");
    expect(findActiveSession([finalizedSession("done", { status: "complete" })], blueprint.id)).toBeUndefined();
  });
});

describe("ExamSessionStore", () => {
  it("round-trips sessions through storage", () => {
    const store = createExamSessionStore(new FakeStorage());
    const session = newSession();
    expect(store.upsertSession(session).persistent).toBe(true);
    expect(store.load().snapshot.sessions).toEqual([session]);
  });

  it("never touches the practice progress key, even when resetting corrupt exam data", () => {
    const storage = new FakeStorage();
    const progressRaw = '{"schemaVersion":1,"attempts":{}}   ';
    storage.values.set(PROGRESS_STORAGE_KEY, progressRaw);
    storage.values.set(EXAM_STORAGE_KEY, "{corrupt");

    const store = createExamSessionStore(storage);
    const result = store.load();
    expect(result.recovered).toBe(true);
    expect(result.snapshot.sessions).toEqual([]);
    store.upsertSession(newSession());

    expect(storage.values.get(PROGRESS_STORAGE_KEY)).toBe(progressRaw);
  });

  it("falls back to memory when storage is unavailable", () => {
    const storage = new FakeStorage();
    storage.throwOnGet = true;
    const store = createExamSessionStore(storage);
    expect(store.load().persistent).toBe(false);
    expect(store.upsertSession(newSession()).persistent).toBe(false);
    expect(store.load().snapshot.sessions).toHaveLength(1);
  });

  it("rejects structurally invalid snapshots", () => {
    const store = createExamSessionStore(new FakeStorage());
    const invalid = { schemaVersion: 1, sessions: [{ ...newSession(), status: "submitted" }] };
    expect(() => store.save(invalid as never)).toThrow(TypeError);
  });
});

describe("applyPendingProjection", () => {
  function pendingSetup(storage = new FakeStorage()) {
    const attemptStore = createAttemptStore(storage);
    const examStore = createExamSessionStore(storage);
    let session: ExamSession = newSession();
    session = answerExamItem(session, "l1", "a", T0 + 1);
    session = answerExamItem(session, "l2", "a", T0 + 2);
    const finalized = finalizeExamSession(session, resolved(), {}, T0 + 10, "submit") as FinalizedExamSession;
    examStore.upsertSession(finalized);
    return { storage, attemptStore, examStore, finalized };
  }

  it("merges the payload into dele-b2:v1 once and marks the projection complete", () => {
    const { attemptStore, examStore, finalized } = pendingSetup();
    const result = applyPendingProjection(finalized, attemptStore, examStore);

    expect(result.applied).toBe(true);
    const attempts = attemptStore.load().snapshot.attempts;
    expect(attempts.l1).toMatchObject({ correct: true, attemptCount: 1 });
    expect(attempts.l2).toMatchObject({ correct: false, attemptCount: 1 });
    const storedSession = examStore.load().snapshot.sessions[0];
    expect(storedSession.status).not.toBe("in-progress");
    if (storedSession.status !== "in-progress") {
      expect(storedSession.progressProjection).toEqual({ status: "complete" });
    }
  });

  it("retries with the same payload without inflating attemptCount", () => {
    const { attemptStore, examStore, finalized } = pendingSetup();
    applyPendingProjection(finalized, attemptStore, examStore);
    // complete 마킹 실패를 가정하고 pending 상태의 세션으로 재시도한다.
    const retry = applyPendingProjection(finalized, attemptStore, examStore);
    expect(retry.applied).toBe(true);
    expect(attemptStore.load().snapshot.attempts.l1.attemptCount).toBe(1);
  });

  it("keeps the projection pending when the progress save is not persistent", () => {
    const storage = new FakeStorage();
    const { attemptStore, examStore, finalized } = pendingSetup(storage);
    storage.throwOnSet = true;
    const result = applyPendingProjection(finalized, attemptStore, examStore);
    expect(result.applied).toBe(false);
    expect(result.session.progressProjection.status).toBe("pending");
  });
});
