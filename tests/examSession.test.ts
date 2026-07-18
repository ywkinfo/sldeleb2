import { describe, expect, it } from "vitest";
import {
  answerExamItem,
  applyPendingProjection,
  applyProjectionToSnapshot,
  canPlayScript,
  closeActivePlaybacks,
  completePlayback,
  createExamSession,
  createExamSessionStore,
  deleteCompletedTerminalSessionsFromList,
  deleteSessionFromList,
  EXAM_STORAGE_KEY,
  finalizeExamSession,
  findActiveSession,
  findNextInProgressDeadline,
  MAX_TERMINAL_SESSIONS,
  mergeTerminalSessions,
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
  ReadingMCQItem,
  ReadingText,
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
  { id: "setA", title: "T1", estimatedMin: 10, skill: "listening", task: "tarea1", sequence: 1, mode: "guided", itemIds: ["l1", "l2"], ...review },
  { id: "setB", title: "T2", estimatedMin: 10, skill: "listening", task: "tarea2", sequence: 1, mode: "guided", itemIds: ["l3"], ...review },
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
const collections = { practiceSets: sets, practiceItems: items, listeningScripts: scripts, readingTexts: [] };

// ---- 읽기 픽스처 (지문 계약 경로 검증용) ----
function rtext(id: string, task: ReadingText["task"]): ReadingText {
  return { id, task, title: `Texto ${id}`, passage: `Pasaje ${id}.`, sourceNote: "창작 지문", ...review };
}
function rmcq(id: string, textId: string, correctAnswer: string): ReadingMCQItem {
  return {
    id,
    skill: "reading",
    kind: "mcq",
    textId,
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
const rtexts = [rtext("rt1", "tarea1"), rtext("rt2", "tarea2")];
const ritems = [rmcq("r1", "rt1", "a"), rmcq("r2", "rt1", "b"), rmcq("r3", "rt2", "c")];
const rsets: PracticeSet[] = [
  { id: "rsetA", title: "RT1", estimatedMin: 10, skill: "reading", task: "tarea1", sequence: 1, mode: "guided", itemIds: ["r1", "r2"], ...review },
  { id: "rsetB", title: "RT2", estimatedMin: 10, skill: "reading", task: "tarea2", sequence: 1, mode: "guided", itemIds: ["r3"], ...review },
];
const readingBlueprint: ExamBlueprint = {
  id: "bp-reading",
  version: 1,
  title: "읽기 테스트",
  skill: "reading",
  timeLimitMin: 70,
  sections: [
    { task: "tarea1", setId: "rsetA" },
    { task: "tarea2", setId: "rsetB" },
  ],
};
const rcollections = { practiceSets: rsets, practiceItems: ritems, listeningScripts: [], readingTexts: rtexts };

const T0 = 1_000_000;
const DEADLINE = T0 + 40 * 60_000;

function newSession() {
  return createExamSession(blueprint, snapshotBlueprint(blueprint, collections), T0, "session-1");
}

function resolved() {
  return resolveSections(newSession().sections, collections).resolved;
}

/** items·scripts 동결 계약이 없는 옛 세션 형태의 섹션을 만든다. */
function legacySections() {
  return snapshotBlueprint(blueprint, collections).map((section) => ({
    task: section.task,
    setId: section.setId,
    itemIds: section.itemIds,
    scriptIds: section.scriptIds,
  }));
}

/** 스냅샷을 저장한 뒤 로드해 살아남은 세션을 돌려준다(검증 실패 시 빈 배열). */
function sessionsAfterReload(sessions: readonly unknown[]): ExamSession[] {
  const storage = new FakeStorage();
  storage.setItem(EXAM_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, sessions }));
  return createExamSessionStore(storage).load().snapshot.sessions;
}

/** 동결 세션을 만든 뒤 section[0]의 계약만 변형한다(변조/손상 시뮬레이션). */
function tamperFirstSection(
  id: string,
  mutate: (section: ReturnType<typeof snapshotBlueprint>[number]) => unknown,
): ExamSession {
  const session = createExamSession(blueprint, snapshotBlueprint(blueprint, collections), T0, id);
  return {
    ...session,
    sections: session.sections.map((sec, index) => (index === 0 ? mutate(sec) : sec)),
  } as ExamSession;
}

describe("snapshotBlueprint / resolveSections", () => {
  it("freezes item and script order from the blueprint's sets", () => {
    const sections = snapshotBlueprint(blueprint, collections);
    expect(
      sections.map((section) => ({
        task: section.task,
        setId: section.setId,
        itemIds: section.itemIds,
        scriptIds: section.scriptIds,
      })),
    ).toEqual([
      { task: "tarea1", setId: "setA", itemIds: ["l1", "l2"], scriptIds: ["s1"] },
      { task: "tarea2", setId: "setB", itemIds: ["l3"], scriptIds: ["s2"] },
    ]);
  });

  it("freezes each item's prompt, options, correct answer and script metadata", () => {
    const sections = snapshotBlueprint(blueprint, collections);
    expect(sections[0].items).toEqual([
      {
        id: "l1",
        skill: "listening",
        kind: "mcq",
        scriptId: "s1",
        prompt: "Pregunta l1",
        options: [
          { key: "a", text: "A" },
          { key: "b", text: "B" },
          { key: "c", text: "C" },
        ],
        correctAnswer: "a",
        explanationKo: "해설",
      },
      expect.objectContaining({ id: "l2", correctAnswer: "b" }),
    ]);
    expect(sections[0].scripts).toEqual([
      { scriptId: "s1", title: "Guion s1", audioSrc: "/audio/listening/s1.m4a" },
    ]);
  });

  it("keeps frozen items resolvable even when they vanish from live content", () => {
    const sections = snapshotBlueprint(blueprint, collections);
    const { resolved: found, missingItemIds } = resolveSections(sections, {
      practiceItems: items.filter((item) => item.id !== "l2"),
      listeningScripts: scripts,
      readingTexts: [],
    });
    expect(found.map((entry) => entry.item.id)).toEqual(["l1", "l2", "l3"]);
    expect(missingItemIds).toEqual([]);
  });

  it("reports missing items only for legacy sessions without a frozen contract", () => {
    const { resolved: found, missingItemIds } = resolveSections(legacySections(), {
      practiceItems: items.filter((item) => item.id !== "l2"),
      listeningScripts: scripts,
      readingTexts: [],
    });
    expect(found.map((entry) => entry.item.id)).toEqual(["l1", "l3"]);
    expect(missingItemIds).toEqual(["l2"]);
  });

  it("does not live-backfill a frozen section that is missing a contract (all-or-nothing)", () => {
    const sections = snapshotBlueprint(blueprint, collections);
    // 동결 세션인데 l2 계약만 제거(itemIds에는 남음) — 변조/손상 시나리오.
    const tampered = sections.map((section, index) =>
      index === 0 ? { ...section, items: (section.items ?? []).filter((c) => c.id !== "l2") } : section,
    );
    const { resolved: found, missingItemIds } = resolveSections(tampered, {
      // 라이브에는 l2가 있지만 동결 세션은 이를 읽지 않아야 한다.
      practiceItems: items.map((it) => (it.id === "l2" ? { ...it, correctAnswer: "a" } : it)),
      listeningScripts: scripts,
      readingTexts: [],
    });
    expect(found.map((entry) => entry.item.id)).toEqual(["l1", "l3"]);
    expect(missingItemIds).toContain("l2");
  });
});

describe("frozen content contract vs. live changes", () => {
  const changedContent = {
    practiceItems: items.map((item) => (item.id === "l1" ? { ...item, correctAnswer: "c" } : item)),
    listeningScripts: scripts,
    readingTexts: [],
  };

  it("grades against the frozen answer even after a deploy changes the correct answer", () => {
    let session: ExamSession = newSession();
    session = answerExamItem(session, "l1", "a", T0 + 1); // 시작 시점 정답
    const { resolved: found } = resolveSections(session.sections, changedContent);
    const finalized = finalizeExamSession(session, found, {}, T0 + 10, "submit") as FinalizedExamSession;
    const l1 = finalized.result.items.find((entry) => entry.itemId === "l1");
    expect(l1).toMatchObject({ correctAnswer: "a", correct: true });
    expect(finalized.result.correct).toBe(1);
  });

  it("legacy sessions grade against the live (changed) answer", () => {
    const legacy = createExamSession(blueprint, legacySections(), T0, "legacy-1");
    const session = answerExamItem(legacy, "l1", "a", T0 + 1);
    const { resolved: found } = resolveSections(session.sections, changedContent);
    const finalized = finalizeExamSession(session, found, {}, T0 + 10, "submit") as FinalizedExamSession;
    const l1 = finalized.result.items.find((entry) => entry.itemId === "l1");
    expect(l1).toMatchObject({ correctAnswer: "c", correct: false });
  });

  it("keeps a legacy snapshot valid so exam history is not wiped on load", () => {
    const legacy = createExamSession(blueprint, legacySections(), T0, "legacy-2");
    const store = createExamSessionStore(new FakeStorage());
    expect(store.save({ schemaVersion: 1, sessions: [legacy] }).persistent).toBe(true);
    expect(store.load().snapshot.sessions.map((session) => session.id)).toEqual(["legacy-2"]);
  });

  it("keeps frozen prompt, options, and audio even when live content mutates or is deleted", () => {
    const sections = snapshotBlueprint(blueprint, collections);
    const { resolved: found, missingItemIds } = resolveSections(sections, {
      practiceItems: items
        .filter((it) => it.id !== "l3") // l3 라이브 삭제
        .map((it) =>
          it.id === "l1"
            ? { ...it, prompt: "CAMBIADO", options: [{ key: "a", text: "X" }], correctAnswer: "c" }
            : it,
        ),
      listeningScripts: scripts.map((s) => (s.id === "s1" ? { ...s, title: "NUEVO", audioSrc: "/nuevo.m4a" } : s)),
      readingTexts: [],
    });
    const l1 = found.find((entry) => entry.item.id === "l1");
    expect(l1?.item.prompt).toBe("Pregunta l1");
    expect(l1?.item.options).toEqual([
      { key: "a", text: "A" },
      { key: "b", text: "B" },
      { key: "c", text: "C" },
    ]);
    expect(l1?.item.correctAnswer).toBe("a");
    expect(l1?.scriptMeta).toEqual({ scriptId: "s1", title: "Guion s1", audioSrc: "/audio/listening/s1.m4a" });
    // 라이브에서 삭제된 l3도 동결 계약으로 그대로 유지.
    expect(found.map((entry) => entry.item.id)).toEqual(["l1", "l2", "l3"]);
    expect(missingItemIds).toEqual([]);
  });
});

describe("frozen contract completeness & relational validation", () => {
  it("keeps a well-formed frozen session valid on reload", () => {
    const session = createExamSession(blueprint, snapshotBlueprint(blueprint, collections), T0, "ok-1");
    expect(sessionsAfterReload([session]).map((s) => s.id)).toEqual(["ok-1"]);
  });

  it("resets a snapshot whose contract array misses an itemId", () => {
    const tampered = tamperFirstSection("partial-1", (sec) => ({
      ...sec,
      items: (sec.items ?? []).filter((c) => c.id !== "l2"),
    }));
    expect(sessionsAfterReload([tampered])).toEqual([]);
  });

  it("resets a snapshot where items exist but scripts are missing (both-or-neither)", () => {
    const tampered = tamperFirstSection("half-1", (sec) => ({
      task: sec.task,
      setId: sec.setId,
      itemIds: sec.itemIds,
      scriptIds: sec.scriptIds,
      items: sec.items,
    }));
    expect(sessionsAfterReload([tampered])).toEqual([]);
  });

  it("resets a snapshot with an extra item contract not present in itemIds", () => {
    const tampered = tamperFirstSection("extra-1", (sec) => ({
      ...sec,
      items: [...(sec.items ?? []), { ...(sec.items ?? [])[0], id: "ghost-item" }],
    }));
    expect(sessionsAfterReload([tampered])).toEqual([]);
  });

  it("resets a snapshot whose contract correctAnswer is not an option key", () => {
    const tampered = tamperFirstSection("bad-answer-1", (sec) => ({
      ...sec,
      items: (sec.items ?? []).map((c, i) => (i === 0 ? { ...c, correctAnswer: "z" } : c)),
    }));
    expect(sessionsAfterReload([tampered])).toEqual([]);
  });

  it("resets a snapshot whose listening item references a script outside the section", () => {
    const tampered = tamperFirstSection("bad-script-1", (sec) => ({
      ...sec,
      items: (sec.items ?? []).map((c, i) => (i === 0 ? { ...c, scriptId: "ghost-script" } : c)),
    }));
    expect(sessionsAfterReload([tampered])).toEqual([]);
  });
});

describe("session-level all-or-nothing", () => {
  it("resets a session that mixes a frozen section with a legacy section", () => {
    const session = createExamSession(blueprint, snapshotBlueprint(blueprint, collections), T0, "mixed-1");
    const mixed: ExamSession = {
      ...session,
      // section[1]만 계약 제거 → 세션 안에서 frozen·legacy 혼합.
      sections: session.sections.map((sec, index) =>
        index === 1 ? { task: sec.task, setId: sec.setId, itemIds: sec.itemIds, scriptIds: sec.scriptIds } : sec,
      ),
    };
    expect(sessionsAfterReload([mixed])).toEqual([]);
  });

  it("never live-backfills a legacy section when any section is frozen", () => {
    const sections = snapshotBlueprint(blueprint, collections);
    // section[1](l3) 계약만 제거 → 혼합. 세션 단위로 frozen이라 l3는 라이브로 채우지 않는다.
    const mixed = sections.map((sec, index) =>
      index === 1 ? { task: sec.task, setId: sec.setId, itemIds: sec.itemIds, scriptIds: sec.scriptIds } : sec,
    );
    const { resolved: found, missingItemIds } = resolveSections(mixed, collections);
    expect(found.map((entry) => entry.item.id)).toEqual(["l1", "l2"]);
    expect(missingItemIds).toEqual(["l3"]);
  });
});

describe("reading exam: text contract snapshot, resolution & validation", () => {
  const readingSnapshot = () => snapshotBlueprint(readingBlueprint, rcollections);
  const legacyReadingSections = () =>
    readingSnapshot().map((s) => ({ task: s.task, setId: s.setId, itemIds: s.itemIds, scriptIds: s.scriptIds }));
  function tamperReading(
    id: string,
    mutate: (section: ReturnType<typeof snapshotBlueprint>[number]) => unknown,
  ): ExamSession {
    const session = createExamSession(readingBlueprint, readingSnapshot(), T0, id);
    return { ...session, sections: session.sections.map((sec, i) => (i === 0 ? mutate(sec) : sec)) } as ExamSession;
  }

  it("freezes reading item textId and text contracts in first-appearance order", () => {
    const sections = readingSnapshot();
    expect(sections[0]).toMatchObject({ task: "tarea1", itemIds: ["r1", "r2"], scriptIds: [], textIds: ["rt1"] });
    expect(sections[0].items).toEqual([
      {
        id: "r1",
        skill: "reading",
        kind: "mcq",
        textId: "rt1",
        prompt: "Pregunta r1",
        options: [
          { key: "a", text: "A" },
          { key: "b", text: "B" },
          { key: "c", text: "C" },
        ],
        correctAnswer: "a",
        explanationKo: "해설",
      },
      expect.objectContaining({ id: "r2", textId: "rt1" }),
    ]);
    expect(sections[0].texts).toEqual([{ textId: "rt1", title: "Texto rt1", passage: "Pasaje rt1." }]);
    expect(sections[0].scripts).toEqual([]);
  });

  it("freezes a deep presentation copy for every new reading section and defaults to MCQ", () => {
    const sharedOptions = [
      { key: "a", text: "A" },
      { key: "b", text: "B" },
      { key: "c", text: "C" },
    ];
    const customSets: PracticeSet[] = rsets.map((set) =>
      set.id === "rsetB"
        ? {
            ...set,
            presentation: {
              kind: "matching",
              sharedOptions,
              optionUse: "reusable",
            },
          }
        : set,
    );
    const sections = snapshotBlueprint(readingBlueprint, {
      ...rcollections,
      practiceSets: customSets,
    });

    expect(sections[0].presentation).toEqual({ kind: "mcq" });
    expect(sections[1].presentation).toEqual({
      kind: "matching",
      sharedOptions: [
        { key: "a", text: "A" },
        { key: "b", text: "B" },
        { key: "c", text: "C" },
      ],
      optionUse: "reusable",
    });
    expect(sections[1].presentation).not.toBe(customSets[1].presentation);
    sharedOptions[0].text = "MUTATED";
    expect(
      sections[1].presentation?.kind === "matching"
        ? sections[1].presentation.sharedOptions[0]
        : undefined,
    ).toEqual({ key: "a", text: "A" });
  });

  it("keeps frozen title/passage even when live text mutates or is deleted", () => {
    const { resolved: found } = resolveSections(readingSnapshot(), {
      practiceItems: ritems,
      listeningScripts: [],
      readingTexts: rtexts
        .filter((t) => t.id !== "rt2") // rt2 라이브 삭제
        .map((t) => (t.id === "rt1" ? { ...t, title: "NUEVO", passage: "CAMBIADO" } : t)),
    });
    expect(found.find((e) => e.item.id === "r1")?.textMeta).toEqual({
      textId: "rt1",
      title: "Texto rt1",
      passage: "Pasaje rt1.",
    });
    expect(found.find((e) => e.item.id === "r3")?.textMeta?.passage).toBe("Pasaje rt2.");
  });

  it("live-backfills text meta for an ID-only legacy reading session and survives reload", () => {
    const legacy = createExamSession(readingBlueprint, legacyReadingSections(), T0, "r-legacy");
    expect(sessionsAfterReload([legacy]).map((s) => s.id)).toEqual(["r-legacy"]);
    const { resolved: found } = resolveSections(legacy.sections, rcollections);
    expect(found.find((e) => e.item.id === "r1")?.textMeta?.passage).toBe("Pasaje rt1.");
  });

  it("does not live-backfill a frozen reading section missing its text contract", () => {
    const tampered = readingSnapshot().map((s, i) => (i === 0 ? { ...s, texts: [] } : s));
    const { resolved: found } = resolveSections(tampered, rcollections);
    expect(found.find((e) => e.item.id === "r1")?.textMeta).toBeUndefined();
  });

  it("keeps a well-formed frozen reading session valid on reload", () => {
    const session = createExamSession(readingBlueprint, readingSnapshot(), T0, "r-ok");
    expect(sessionsAfterReload([session]).map((s) => s.id)).toEqual(["r-ok"]);
  });

  it("accepts legacy and frozen reading sessions when presentation is entirely absent", () => {
    const frozenWithoutPresentation = readingSnapshot().map((section) => {
      const clone = { ...section };
      delete clone.presentation;
      return clone;
    });
    const frozen = createExamSession(
      readingBlueprint,
      frozenWithoutPresentation,
      T0,
      "r-frozen-legacy",
    );
    const legacy = createExamSession(
      readingBlueprint,
      legacyReadingSections(),
      T0,
      "r-id-legacy",
    );

    expect(sessionsAfterReload([frozen, legacy]).map((session) => session.id)).toEqual([
      "r-frozen-legacy",
      "r-id-legacy",
    ]);
  });

  it("rejects mixed reading presentation presence and presentation on listening sections", () => {
    const mixed = createExamSession(
      readingBlueprint,
      readingSnapshot().map((section, index) => {
        if (index !== 1) return section;
        const clone = { ...section };
        delete clone.presentation;
        return clone;
      }),
      T0,
      "r-mixed-presentation",
    );
    const listening = createExamSession(
      blueprint,
      snapshotBlueprint(blueprint, collections).map((section, index) =>
        index === 0 ? { ...section, presentation: { kind: "mcq" as const } } : section,
      ),
      T0,
      "l-presentation",
    );

    expect(sessionsAfterReload([mixed])).toEqual([]);
    expect(sessionsAfterReload([listening])).toEqual([]);
  });

  it("rejects presentation attached to an ID-only legacy section", () => {
    const legacyWithPresentation = createExamSession(
      readingBlueprint,
      legacyReadingSections().map((section, index) =>
        index === 0 ? { ...section, presentation: { kind: "mcq" as const } } : section,
      ),
      T0,
      "r-legacy-presentation",
    );

    expect(sessionsAfterReload([legacyWithPresentation])).toEqual([]);
  });

  it("rejects malformed presentation in a frozen reading section", () => {
    const malformed = tamperReading("r-bad-presentation", (section) => ({
      ...section,
      presentation: {
        kind: "matching",
        sharedOptions: [{ key: "a", text: "A" }],
        optionUse: "sometimes",
      },
    }));

    expect(sessionsAfterReload([malformed])).toEqual([]);
  });

  it("reloads a raw frozen listening session and a frozen reading session together", () => {
    const listening = createExamSession(blueprint, snapshotBlueprint(blueprint, collections), T0, "l-ok");
    const reading = createExamSession(readingBlueprint, readingSnapshot(), T0, "r-both");
    expect(sessionsAfterReload([listening, reading]).map((s) => s.id).sort()).toEqual(["l-ok", "r-both"]);
  });

  it("rejects one-sided textIds/texts (texts present, textIds absent)", () => {
    const tampered = tamperReading("r-onesided", (sec) => {
      const clone = { ...sec };
      delete clone.textIds;
      return clone;
    });
    expect(sessionsAfterReload([tampered])).toEqual([]);
  });

  it("rejects a missing text contract (a textId with no matching text)", () => {
    const tampered = tamperReading("r-missing", (sec) => ({ ...sec, texts: [] }));
    expect(sessionsAfterReload([tampered])).toEqual([]);
  });

  it("rejects an extra text contract not referenced by any item", () => {
    const tampered = tamperReading("r-extra", (sec) => ({
      ...sec,
      textIds: [...(sec.textIds ?? []), "ghost"],
      texts: [...(sec.texts ?? []), { textId: "ghost", title: "G", passage: "G" }],
    }));
    expect(sessionsAfterReload([tampered])).toEqual([]);
  });

  it("rejects a duplicate text contract", () => {
    const tampered = tamperReading("r-dup", (sec) => ({
      ...sec,
      textIds: [...(sec.textIds ?? []), "rt1"],
      texts: [...(sec.texts ?? []), { textId: "rt1", title: "Texto rt1", passage: "Pasaje rt1." }],
    }));
    expect(sessionsAfterReload([tampered])).toEqual([]);
  });

  it("rejects a reading item whose textId is outside the section", () => {
    const tampered = tamperReading("r-outside", (sec) => ({
      ...sec,
      items: (sec.items ?? []).map((c, i) => (i === 0 ? { ...c, textId: "ghost" } : c)),
    }));
    expect(sessionsAfterReload([tampered])).toEqual([]);
  });

  it("rejects a reading item carrying a scriptId", () => {
    const tampered = tamperReading("r-hasscript", (sec) => ({
      ...sec,
      items: (sec.items ?? []).map((c, i) => (i === 0 ? { ...c, scriptId: "s1" } : c)),
    }));
    expect(sessionsAfterReload([tampered])).toEqual([]);
  });

  it("tallies byTask per reading task and projects reading attempts", () => {
    let session: ExamSession = createExamSession(readingBlueprint, readingSnapshot(), T0, "r-final");
    session = answerExamItem(session, "r1", "a", T0 + 1); // 정답
    session = answerExamItem(session, "r2", "a", T0 + 2); // 오답(정답 b)
    session = answerExamItem(session, "r3", "c", T0 + 3); // 정답
    const { resolved: found } = resolveSections(session.sections, rcollections);
    const finalized = finalizeExamSession(session, found, {}, T0 + 10, "submit") as FinalizedExamSession;
    expect(finalized.result.byTask).toEqual({
      tarea1: { correct: 1, total: 2 },
      tarea2: { correct: 1, total: 1 },
    });
    expect(finalized.result.correct).toBe(2);
    const projection = finalized.progressProjection;
    expect(projection.status).toBe("pending");
    if (projection.status === "pending") {
      expect(projection.attempts.every((a) => a.kind === "reading")).toBe(true);
    }
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

  it("closes active slots on resume so refreshing mid-play still consumes the slot", () => {
    let session: ExamSession = newSession();
    session = reservePlayback(session, "s1", T0 + 1);
    session = closeActivePlaybacks(session, T0 + 2);
    expect(session.playbacks.s1).toEqual({ used: 1, active: false });
    expect(closeActivePlaybacks(session, T0 + 3)).toBe(session);
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

  it("preserves practice pendingFlags and absorbs the projected item's star", () => {
    const withPending: ProgressSnapshot = {
      schemaVersion: 1,
      attempts: {},
      pendingFlags: { l1: T0 + 1, unrelated: T0 + 2 },
    };
    const result = applyProjectionToSnapshot(withPending, [payloadAttempt]);
    expect(result.changed).toBe(true);
    expect(result.snapshot.attempts.l1.flagged).toBe(true);
    expect(result.snapshot.pendingFlags).toEqual({ unrelated: T0 + 2 });
  });

  it("drops a stale pending flag without re-flagging an unchanged newer attempt", () => {
    const stale: ProgressSnapshot = {
      schemaVersion: 1,
      attempts: { l1: { ...payloadAttempt } },
      pendingFlags: { l1: T0 + 1 },
    };
    const result = applyProjectionToSnapshot(stale, [payloadAttempt]);
    expect(result.changed).toBe(true);
    expect(result.snapshot.attempts.l1.flagged).toBe(false);
    expect(result.snapshot.pendingFlags).toBeUndefined();
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
  const at = (
    id: string,
    submittedAt: number,
    projection: FinalizedExamSession["progressProjection"] = { status: "complete" },
  ): FinalizedExamSession => ({ ...finalizedSession(id, projection), submittedAt });

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

  it("prunes completed sessions by submittedAt rather than untrusted array order", () => {
    const completed = Array.from({ length: MAX_TERMINAL_SESSIONS + 2 }, (_, index) =>
      at(`dated-${index}`, index),
    ).reverse();

    const pruned = pruneSessions(completed) as FinalizedExamSession[];

    expect(pruned.some((session) => session.id === "dated-0")).toBe(false);
    expect(pruned.some((session) => session.id === "dated-1")).toBe(false);
    expect(pruned.at(-1)?.id).toBe(`dated-${MAX_TERMINAL_SESSIONS + 1}`);
    expect(pruned.map((session) => session.submittedAt)).toEqual(
      [...pruned.map((session) => session.submittedAt)].sort((a, b) => a - b),
    );
  });

  it("finds the most recent in-progress session per blueprint", () => {
    const first = createExamSession(blueprint, [], T0, "one");
    const second = createExamSession(blueprint, [], T0 + 5, "two");
    expect(findActiveSession([first, second], blueprint.id)?.id).toBe("two");
    expect(findActiveSession([finalizedSession("done", { status: "complete" })], blueprint.id)).toBeUndefined();
  });

  it("finds the nearest future in-progress deadline only", () => {
    const first = createExamSession(blueprint, [], T0, "first");
    const second = { ...createExamSession(blueprint, [], T0, "second"), deadlineAt: T0 + 500 };
    const expired = { ...createExamSession(blueprint, [], T0, "expired"), deadlineAt: T0 - 1 };
    expect(findNextInProgressDeadline([first, second, expired], T0)).toBe(T0 + 500);
    expect(
      findNextInProgressDeadline(
        [finalizedSession("done", { status: "complete" })],
        T0,
      ),
    ).toBeUndefined();
  });

  it("merges terminal imports while local terminal records win and terminal replaces local in-progress", () => {
    const localTerminal = at("local-wins", 100);
    const localActive = createExamSession(blueprint, [], T0, "becomes-terminal");
    const untouchedActive = createExamSession(blueprint, [], T0, "stay-active");
    const importedReplacement = at("becomes-terminal", 200);
    const importedNew = at("new", 300);
    const importedActive = createExamSession(blueprint, [], T0, "skip-active");

    const result = mergeTerminalSessions(
      [localTerminal, localActive, untouchedActive],
      [at("local-wins", 999), importedReplacement, importedNew, importedActive],
    );

    expect(result.stats).toEqual({ added: 1, updated: 1, skipped: 2 });
    expect(result.sessions.find((session) => session.id === "local-wins")).toBe(localTerminal);
    expect(result.sessions.find((session) => session.id === "becomes-terminal")?.status).toBe("submitted");
    expect(result.sessions.find((session) => session.id === "stay-active")?.status).toBe("in-progress");
    expect(result.sessions.some((session) => session.id === "skip-active")).toBe(false);
  });

  it("protects pending terminals and keeps only the newest completed records in ascending order", () => {
    const pending = [
      at("pending-a", 1, { status: "pending", attempts: [payloadAttempt] }),
      at("pending-b", 2, { status: "pending", attempts: [payloadAttempt] }),
    ];
    const completed = Array.from({ length: 51 }, (_, index) => at(`done-${index}`, 100 + index));

    const result = mergeTerminalSessions([...pending, ...completed], []);
    const retainedCompleted = result.sessions.filter(
      (session): session is FinalizedExamSession =>
        session.status !== "in-progress" && session.progressProjection.status === "complete",
    );

    expect(result.sessions.filter((session) => session.status !== "in-progress")).toHaveLength(50);
    expect(result.sessions.some((session) => session.id === "pending-a")).toBe(true);
    expect(result.sessions.some((session) => session.id === "pending-b")).toBe(true);
    expect(retainedCompleted).toHaveLength(48);
    expect(retainedCompleted.map((session) => session.submittedAt)).toEqual(
      [...retainedCompleted.map((session) => session.submittedAt)].sort((a, b) => a - b),
    );
    expect(retainedCompleted[0].id).toBe("done-3");
    expect(retainedCompleted.at(-1)?.id).toBe("done-50");
  });

  it("keeps all protected pending records even when they alone exceed the limit", () => {
    const pending = Array.from({ length: MAX_TERMINAL_SESSIONS + 1 }, (_, index) =>
      at(`pending-${index}`, index, { status: "pending", attempts: [payloadAttempt] }),
    );
    const result = mergeTerminalSessions(pending, [at("new-complete", 999)]);

    expect(result.sessions).toHaveLength(MAX_TERMINAL_SESSIONS + 1);
    expect(result.sessions.every((session) => session.status !== "in-progress" && session.progressProjection.status === "pending")).toBe(true);
    expect(result.stats).toEqual({ added: 0, updated: 0, skipped: 1 });
  });

  it("reports only imported terminal records that survive retention", () => {
    const local = Array.from({ length: MAX_TERMINAL_SESSIONS - 1 }, (_, index) =>
      at(`local-${index}`, 100 + index),
    );
    const result = mergeTerminalSessions(local, [at("too-old", 1), at("newest", 1_000)]);

    expect(result.sessions.some((session) => session.id === "too-old")).toBe(false);
    expect(result.sessions.some((session) => session.id === "newest")).toBe(true);
    expect(result.stats).toEqual({ added: 1, updated: 0, skipped: 1 });
  });

  it("deletes only projection-complete terminal sessions", () => {
    const complete = at("complete", 1);
    const pending = at("pending", 2, { status: "pending", attempts: [payloadAttempt] });
    const active = createExamSession(blueprint, [], T0, "active");

    expect(deleteSessionFromList([complete, pending, active], "pending").deleted).toBe(false);
    expect(deleteSessionFromList([complete, pending, active], "active").deleted).toBe(false);
    const one = deleteSessionFromList([complete, pending, active], "complete");
    expect(one.deleted).toBe(true);
    expect(one.sessions.map((session) => session.id)).toEqual(["pending", "active"]);

    const all = deleteCompletedTerminalSessionsFromList([complete, pending, active]);
    expect(all.deleted).toBe(1);
    expect(all.sessions.map((session) => session.id)).toEqual(["pending", "active"]);
  });

  it("deletes exactly one matching complete record even under duplicate-ID corruption", () => {
    const complete = at("collision", 1);
    const pending = at("collision", 2, { status: "pending", attempts: [payloadAttempt] });
    const active = createExamSession(blueprint, [], T0, "collision");

    const result = deleteSessionFromList([complete, pending, active], "collision");

    expect(result.deleted).toBe(true);
    expect(result.sessions).toEqual([pending, active]);
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

  it("rejects a session snapshot containing duplicate session IDs", () => {
    const duplicate = { ...newSession() };
    const store = createExamSessionStore(new FakeStorage());

    expect(() =>
      store.save({ schemaVersion: 1, sessions: [newSession(), duplicate] }),
    ).toThrow(TypeError);
  });

  it("exposes guarded single and bulk deletion APIs", () => {
    const store = createExamSessionStore(new FakeStorage());
    const complete = finalizedSession("complete", { status: "complete" });
    const pending = finalizedSession("pending", { status: "pending", attempts: [payloadAttempt] });
    const active = createExamSession(blueprint, [], T0, "active");
    store.save({ schemaVersion: 1, sessions: [complete, pending, active] });

    expect(store.deleteSession("pending")).toEqual({ deleted: false, persistent: true });
    expect(store.deleteSession("complete")).toEqual({ deleted: true, persistent: true });
    expect(store.deleteCompletedTerminalSessions()).toEqual({ deleted: 0, persistent: true });
    expect(store.load().snapshot.sessions.map((session) => session.id)).toEqual(["pending", "active"]);
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

    // 실패한 payload는 메모리 fallback에 남아 두 번째 병합에서 changed=false가 된다.
    // 영속 저장소가 여전히 없으면 그 경우에도 complete로 승격하면 안 된다.
    const retry = applyPendingProjection(finalized, attemptStore, examStore);
    expect(retry.applied).toBe(false);
    expect(retry.session.progressProjection.status).toBe("pending");
    const stored = examStore.load().snapshot.sessions[0];
    expect(stored.status).not.toBe("in-progress");
    if (stored.status !== "in-progress") {
      expect(stored.progressProjection.status).toBe("pending");
    }
  });
});
