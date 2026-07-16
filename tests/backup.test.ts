import { describe, expect, it } from "vitest";
import {
  createUserDataExport,
  exportUserData,
  importUserData,
  parseUserDataFile,
} from "../lib/backup";
import { createExamSessionStore, EXAM_STORAGE_KEY } from "../lib/examSession";
import { createAttemptStore, PROGRESS_STORAGE_KEY } from "../lib/storage";
import type {
  AttemptState,
  ExamSession,
  FinalizedExamSession,
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

const projectedAttempt: AttemptState = {
  kind: "reading",
  itemId: "projected",
  selectedAnswer: "a",
  correct: true,
  flagged: false,
  attemptCount: 1,
  lastAttemptedAt: 200,
};

function inProgress(id: string): ExamSession {
  return {
    id,
    blueprintId: "exam-reading-b2",
    blueprintVersion: 1,
    sections: [],
    startedAt: 10,
    deadlineAt: 100,
    status: "in-progress",
    answers: {},
    flaggedItemIds: [],
    playbacks: {},
  };
}

function terminal(
  id: string,
  submittedAt: number,
  projection: FinalizedExamSession["progressProjection"] = { status: "complete" },
): FinalizedExamSession {
  return {
    ...inProgress(id),
    status: "submitted",
    submittedAt,
    result: { correct: 0, total: 0, byTask: {}, items: [] },
    progressProjection: projection,
  } as FinalizedExamSession;
}

const emptyProgress: ProgressSnapshot = { schemaVersion: 1, attempts: {} };

describe("user-data backup export", () => {
  it("folds pending projections into an immutable terminal-only export", () => {
    const progressStorage = new FakeStorage();
    const examStorage = new FakeStorage();
    const attemptStore = createAttemptStore(progressStorage);
    const examStore = createExamSessionStore(examStorage);
    attemptStore.save(emptyProgress);
    examStore.save({
      schemaVersion: 1,
      sessions: [
        inProgress("active"),
        terminal("pending", 20, { status: "pending", attempts: [projectedAttempt] }),
        terminal("complete", 30),
      ],
    });

    const exported = createUserDataExport(
      attemptStore,
      examStore,
      "2026-07-16T00:00:00.000Z",
    );

    expect(exported).toMatchObject({
      kind: "dele-b2-backup",
      exportVersion: 1,
      exportedAt: "2026-07-16T00:00:00.000Z",
    });
    expect(exported.progress.attempts.projected).toEqual(projectedAttempt);
    expect(exported.exams.sessions.map((session) => session.id)).toEqual(["pending", "complete"]);
    expect(
      exported.exams.sessions.every(
        (session) => session.status !== "in-progress" && session.progressProjection.status === "complete",
      ),
    ).toBe(true);

    expect(attemptStore.load().snapshot).toEqual(emptyProgress);
    const storedPending = examStore.load().snapshot.sessions[1] as FinalizedExamSession;
    expect(storedPending.progressProjection.status).toBe("pending");
    expect(parseUserDataFile(exportUserData(attemptStore, examStore))).not.toBeNull();
  });

  it("keeps backup validation compatible with new and presentation-absent frozen reading sessions", () => {
    const section = {
      task: "tarea1" as const,
      setId: "set-reading-library",
      itemIds: ["reading-item"],
      scriptIds: [],
      textIds: ["reading-text"],
      items: [
        {
          id: "reading-item",
          skill: "reading" as const,
          kind: "mcq" as const,
          textId: "reading-text",
          prompt: "Pregunta",
          options: [
            { key: "a", text: "A" },
            { key: "b", text: "B" },
          ],
          correctAnswer: "a",
          explanationKo: "해설",
        },
      ],
      scripts: [],
      texts: [{ textId: "reading-text", title: "Texto", passage: "Pasaje" }],
      presentation: { kind: "mcq" as const },
    };
    const legacySection = { ...section };
    delete (legacySection as Partial<typeof section>).presentation;
    const payload = {
      kind: "dele-b2-backup",
      exportVersion: 1,
      exportedAt: "2026-07-16T00:00:00.000Z",
      progress: emptyProgress,
      exams: {
        schemaVersion: 1,
        sessions: [
          { ...terminal("new-reading", 20), sections: [section] },
          { ...terminal("legacy-reading", 10), sections: [legacySection] },
        ],
      },
    };

    expect(parseUserDataFile(JSON.stringify(payload))?.format).toBe("backup-v1");
  });
});

describe("user-data backup import", () => {
  it("accepts a legacy progress-only snapshot without touching exam data", () => {
    const attemptStore = createAttemptStore(new FakeStorage());
    const examStore = createExamSessionStore(new FakeStorage());
    const legacy: ProgressSnapshot = {
      schemaVersion: 1,
      attempts: { projected: projectedAttempt },
    };
    examStore.save({ schemaVersion: 1, sessions: [terminal("existing", 1)] });

    const result = importUserData(attemptStore, examStore, JSON.stringify(legacy));

    expect(result?.format).toBe("legacy-progress");
    expect(result?.progress).toMatchObject({
      stats: { added: 1, updated: 0, skipped: 0 },
      persistent: true,
      localRecovered: false,
    });
    expect(result?.exams).toBeNull();
    expect(examStore.load().snapshot.sessions.map((session) => session.id)).toEqual(["existing"]);
  });

  it("rejects the whole envelope before writing when either domain is malformed", () => {
    const malformedDomains = [
      {
        progress: { schemaVersion: 1, attempts: { bad: { nope: true } } },
        exams: { schemaVersion: 1, sessions: [] },
      },
      {
        progress: { schemaVersion: 1, attempts: { projected: projectedAttempt } },
        exams: { schemaVersion: 1, sessions: [{ ...inProgress("bad"), status: "submitted" }] },
      },
    ];

    for (const domains of malformedDomains) {
      const progressStorage = new FakeStorage();
      const examStorage = new FakeStorage();
      const attemptStore = createAttemptStore(progressStorage);
      const examStore = createExamSessionStore(examStorage);
      attemptStore.save(emptyProgress);
      examStore.save({ schemaVersion: 1, sessions: [terminal("existing", 1)] });
      const beforeProgress = progressStorage.values.get(PROGRESS_STORAGE_KEY);
      const beforeExams = examStorage.values.get(EXAM_STORAGE_KEY);
      const malformed = JSON.stringify({
        kind: "dele-b2-backup",
        exportVersion: 1,
        exportedAt: "2026-07-16T00:00:00.000Z",
        ...domains,
      });

      expect(importUserData(attemptStore, examStore, malformed)).toBeNull();
      expect(progressStorage.values.get(PROGRESS_STORAGE_KEY)).toBe(beforeProgress);
      expect(examStorage.values.get(EXAM_STORAGE_KEY)).toBe(beforeExams);
    }
  });

  it("imports terminal sessions, skips valid in-progress sessions, and reports both domains", () => {
    const attemptStore = createAttemptStore(new FakeStorage());
    const examStore = createExamSessionStore(new FakeStorage());
    const payload = JSON.stringify({
      kind: "dele-b2-backup",
      exportVersion: 1,
      exportedAt: "2026-07-16T00:00:00.000Z",
      progress: emptyProgress,
      exams: { schemaVersion: 1, sessions: [inProgress("skip"), terminal("add", 2)] },
    });

    const result = importUserData(attemptStore, examStore, payload);

    expect(result?.format).toBe("backup-v1");
    expect(result?.exams?.stats).toEqual({ added: 1, updated: 0, skipped: 1 });
    expect(result?.exams?.persistent).toBe(true);
    expect(examStore.load().snapshot.sessions.map((session) => session.id)).toEqual(["add"]);
  });

  it("reports local recovery and independent partial persistence", () => {
    const progressStorage = new FakeStorage();
    progressStorage.values.set(PROGRESS_STORAGE_KEY, "{corrupt");
    const examStorage = new FakeStorage();
    const attemptStore = createAttemptStore(progressStorage);
    const examStore = createExamSessionStore(examStorage);
    examStorage.throwOnSet = true;
    const payload = JSON.stringify({
      kind: "dele-b2-backup",
      exportVersion: 1,
      exportedAt: "2026-07-16T00:00:00.000Z",
      progress: { schemaVersion: 1, attempts: { projected: projectedAttempt } },
      exams: { schemaVersion: 1, sessions: [terminal("temporary", 2)] },
    });

    const result = importUserData(attemptStore, examStore, payload);

    expect(result?.progress).toMatchObject({ persistent: true, localRecovered: true });
    expect(result?.exams).toMatchObject({ persistent: false, localRecovered: false });
    expect(examStore.load().snapshot.sessions.map((session) => session.id)).toEqual(["temporary"]);
  });

  it("reports exam-store recovery independently from progress", () => {
    const progressStorage = new FakeStorage();
    const examStorage = new FakeStorage();
    examStorage.values.set(EXAM_STORAGE_KEY, "{corrupt");
    const result = importUserData(
      createAttemptStore(progressStorage),
      createExamSessionStore(examStorage),
      JSON.stringify({
        kind: "dele-b2-backup",
        exportVersion: 1,
        exportedAt: "2026-07-16T00:00:00.000Z",
        progress: emptyProgress,
        exams: { schemaVersion: 1, sessions: [terminal("recovered", 2)] },
      }),
    );

    expect(result?.progress.localRecovered).toBe(false);
    expect(result?.exams).toMatchObject({ persistent: true, localRecovered: true });
  });
});
