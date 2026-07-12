import { describe, expect, it } from "vitest";
import {
  completeOpenAttempt,
  completeOpenAttemptWithRubric,
  gradeListeningAttempt,
  gradeReadingAttempt,
  setAttemptFlag,
} from "../lib/grading";
import type { ListeningMCQItem, ReadingMCQItem } from "../lib/types";

const item: ReadingMCQItem = {
  id: "read-1",
  skill: "reading",
  kind: "mcq",
  textId: "text-1",
  prompt: "¿Qué afirma el autor?",
  options: [
    { key: "a", text: "A" },
    { key: "b", text: "B" },
  ],
  correctAnswer: "b",
  explanationKo: "본문의 근거는 B입니다.",
  tags: ["idea-principal"],
  status: "published",
  reviewedBy: "Spanish Lab",
  reviewedAt: "2026-07-11T00:00:00.000Z",
};

describe("reading grading", () => {
  it("grades an answer and increments attempts without losing the flag", () => {
    const first = gradeReadingAttempt(item, "a", undefined, 100);
    const flagged = setAttemptFlag(first, true);
    const second = gradeReadingAttempt(item, "b", flagged, 200);

    expect(first).toMatchObject({ correct: false, attemptCount: 1 });
    expect(second).toMatchObject({
      correct: true,
      attemptCount: 2,
      flagged: true,
      lastAttemptedAt: 200,
    });
  });

  it("rejects an answer key not present in the options", () => {
    expect(() => gradeReadingAttempt(item, "z")).toThrow(RangeError);
  });
});

describe("listening grading", () => {
  const listeningItem: ListeningMCQItem = {
    id: "listen-1",
    skill: "listening",
    kind: "mcq",
    scriptId: "script-1",
    prompt: "¿Qué afirma la doctora?",
    options: item.options,
    correctAnswer: "b",
    explanationKo: "인터뷰의 근거는 B입니다.",
    tags: ["detalle"],
    status: "published",
    reviewedBy: "Spanish Lab",
    reviewedAt: "2026-07-11T00:00:00.000Z",
  };

  it("grades a listening answer with the listening attempt kind", () => {
    const attempt = gradeListeningAttempt(listeningItem, "b", undefined, 100);
    expect(attempt).toMatchObject({
      kind: "listening",
      itemId: "listen-1",
      correct: true,
      attemptCount: 1,
    });
  });

  it("rejects an answer key not present in the options", () => {
    expect(() => gradeListeningAttempt(listeningItem, "z")).toThrow(RangeError);
  });
});

describe("open-task self assessment", () => {
  it("records completion and the 1-3 self score", () => {
    const first = completeOpenAttempt("write-1", 1, undefined, 100);
    const second = completeOpenAttempt("write-1", 3, first, 200);
    expect(second).toEqual({
      kind: "open",
      itemId: "write-1",
      completed: true,
      draft: undefined,
      selfScore: 3,
      flagged: false,
      attemptCount: 2,
      lastAttemptedAt: 200,
    });
  });

  it("preserves draft and flag across completions", () => {
    const incomplete = {
      kind: "open",
      itemId: "write-1",
      completed: false,
      draft: "mi borrador",
      flagged: true,
      attemptCount: 1,
      lastAttemptedAt: 100,
    } as const;
    const completed = completeOpenAttempt("write-1", 2, incomplete, 150);
    expect(completed.draft).toBe("mi borrador");
    expect(completed.flagged).toBe(true);
  });

  it("calculates rubric stats properly and preserves previous state", () => {
    const incomplete = {
      kind: "open",
      itemId: "speak-1",
      completed: false,
      draft: "notas",
      flagged: false,
      attemptCount: 2,
      lastAttemptedAt: 100,
    } as const;
    
    const completed = completeOpenAttemptWithRubric("speak-1", "speaking", { coherence: 2, fluency: 3, accuracy: 2, range: 3 }, incomplete, 200);
    expect(completed).toMatchObject({
      kind: "open",
      itemId: "speak-1",
      completed: true,
      draft: "notas",
      selfScore: 3, // average 2.5 -> 3
      rubricScores: { coherence: 2, fluency: 3, accuracy: 2, range: 3 },
      attemptCount: 3,
      lastAttemptedAt: 200,
    });
  });
});
