import { describe, expect, it } from "vitest";
import {
  selectHomeNextAction,
  type HomeExamSessionMeta,
} from "@/components/HomeNextAction";
import type { AttemptState, PracticeSet } from "@/lib/types";

function set(
  id: string,
  itemId: string,
  overrides: Partial<PracticeSet> = {},
): PracticeSet {
  return {
    id,
    title: id,
    estimatedMin: 10,
    skill: "reading",
    task: "tarea1",
    sequence: 1,
    mode: "guided",
    itemIds: [itemId],
    status: "published",
    reviewedBy: "Spanish Lab",
    reviewedAt: "2026-07-15",
    ...overrides,
  };
}

function attempt(
  itemId: string,
  lastAttemptedAt: number,
  overrides: Partial<AttemptState> = {},
): AttemptState {
  return {
    kind: "reading",
    itemId,
    selectedAnswer: "a",
    correct: true,
    flagged: false,
    attemptCount: 1,
    lastAttemptedAt,
    ...overrides,
  } as AttemptState;
}

const sets = [
  set("starter", "starter-item"),
  set("partial-old", "old-item", { sequence: 2, itemIds: ["old-item", "old-missing"] }),
  set("partial-new", "new-a", { task: "tarea2", itemIds: ["new-a", "new-b"] }),
];

describe("selectHomeNextAction", () => {
  it("prioritizes a live exam over expired sessions and learning progress", () => {
    const sessions: HomeExamSessionMeta[] = [
      { blueprintId: "expired", status: "in-progress", startedAt: 900, deadlineAt: 999 },
      { blueprintId: "active", status: "in-progress", startedAt: 800, deadlineAt: 1100 },
    ];
    const result = selectHomeNextAction({
      sessions,
      sets,
      attempts: { "old-item": attempt("old-item", 500, { correct: false }) },
      now: 1000,
    });

    expect(result).toMatchObject({ kind: "active-exam", href: "/exam/active" });
  });

  it("links an expired in-progress exam to its existing finalize route", () => {
    const result = selectHomeNextAction({
      sessions: [{ blueprintId: "expired", status: "in-progress", startedAt: 900, deadlineAt: 1000 }],
      sets,
      attempts: { "old-item": attempt("old-item", 500) },
      now: 1000,
    });

    expect(result).toMatchObject({ kind: "expired-exam", href: "/exam/expired" });
  });

  it("chooses the most recently touched incomplete practice set", () => {
    const result = selectHomeNextAction({
      sessions: [],
      sets,
      attempts: {
        "old-item": attempt("old-item", 100),
        "new-a": attempt("new-a", 200),
      },
      now: 1000,
    });

    expect(result).toMatchObject({ kind: "practice", href: "/practice/set/partial-new" });
  });

  it("offers today's review when there is no unfinished learning", () => {
    const result = selectHomeNextAction({
      sessions: [],
      sets,
      attempts: { "starter-item": attempt("starter-item", 100, { correct: false }) },
      now: 1000,
    });

    expect(result).toMatchObject({ kind: "review", href: "/review" });
  });

  it("counts a pending-only star for review but never as an in-progress set", () => {
    const result = selectHomeNextAction({
      sessions: [],
      sets,
      attempts: {},
      pendingFlags: { "starter-item": 500 },
      now: 1000,
    });

    expect(result).toMatchObject({ kind: "review", href: "/review", title: "맞춤 복습 1개" });
  });

  it("does not double-count a star that overlaps an existing attempt", () => {
    const result = selectHomeNextAction({
      sessions: [],
      sets,
      attempts: { "starter-item": attempt("starter-item", 100, { flagged: true }) },
      pendingFlags: { "starter-item": 500 },
      now: 1000,
    });

    expect(result).toMatchObject({ kind: "review", title: "맞춤 복습 1개" });
  });

  it("falls back to the first sorted guided reading set", () => {
    const result = selectHomeNextAction({
      sessions: [],
      sets: [
        set("exam", "exam-item", { mode: "exam-prep", task: "tarea2" }),
        set("second", "second-item", { sequence: 2 }),
        set("first", "first-item"),
      ],
      attempts: {},
      now: 1000,
    });

    expect(result).toMatchObject({ kind: "starter", href: "/practice/set/first" });
  });
});
