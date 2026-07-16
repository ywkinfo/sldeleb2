import { describe, expect, it } from "vitest";
import {
  filterPracticeSets,
  pickCatalogHighlight,
  type PracticeCatalogFilters,
} from "../components/PracticeSetList";
import type { AttemptState, PracticeSet } from "../lib/types";

const review = {
  status: "published" as const,
  reviewedBy: "Spanish Lab",
  reviewedAt: "2026-07-15",
};

function set(
  id: string,
  skill: "reading" | "listening",
  task: "tarea1" | "tarea2",
  sequence: number,
  mode: "guided" | "exam-prep" = "guided",
): PracticeSet {
  return {
    id,
    title: id,
    estimatedMin: 10,
    skill,
    task,
    sequence,
    mode,
    itemIds: [`${id}-a`, `${id}-b`],
    ...review,
  };
}

const sets = [
  set("reading-2", "reading", "tarea1", 2),
  set("exam", "reading", "tarea2", 1, "exam-prep"),
  set("listening", "listening", "tarea2", 1),
  set("reading-1", "reading", "tarea1", 1),
];

describe("practice catalog", () => {
  it("filters by URL-backed skill, mode and task and preserves catalog order", () => {
    const filters: PracticeCatalogFilters = {
      skill: "reading",
      mode: "guided",
      task: "tarea1",
    };

    expect(filterPracticeSets(sets, filters).map((value) => value.id)).toEqual([
      "reading-1",
      "reading-2",
    ]);
  });

  it("prioritizes the most recently touched in-progress set", () => {
    const attempts: Record<string, AttemptState> = {
      "reading-1-a": {
        kind: "reading",
        itemId: "reading-1-a",
        selectedAnswer: "a",
        correct: true,
        flagged: false,
        attemptCount: 1,
        lastAttemptedAt: 100,
      },
      "listening-a": {
        kind: "listening",
        itemId: "listening-a",
        selectedAnswer: "a",
        correct: true,
        flagged: false,
        attemptCount: 1,
        lastAttemptedAt: 200,
      },
    };

    expect(pickCatalogHighlight(sets, attempts)).toMatchObject({
      kind: "continue",
      set: { id: "listening" },
    });
  });

  it("recommends the first unfinished guided set when none is in progress", () => {
    expect(pickCatalogHighlight(sets, {})).toMatchObject({
      kind: "recommended",
      set: { id: "reading-1" },
    });
  });
});
