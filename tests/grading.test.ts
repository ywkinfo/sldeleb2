import { describe, expect, it } from "vitest";
import {
  completeOpenAttempt,
  gradeReadingAttempt,
  setAttemptFlag,
} from "../lib/grading";
import type { ReadingMCQItem } from "../lib/types";

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

describe("open-task self assessment", () => {
  it("records completion and the 1–3 self score", () => {
    const first = completeOpenAttempt("write-1", 1, undefined, 100);
    const second = completeOpenAttempt("write-1", 3, first, 200);
    expect(second).toEqual({
      kind: "open",
      itemId: "write-1",
      completed: true,
      selfScore: 3,
      flagged: false,
      attemptCount: 2,
      lastAttemptedAt: 200,
    });
  });
});
