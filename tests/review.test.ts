import { describe, it, expect } from "vitest";
import {
  getReviewReasons,
  buildAttemptEntries,
  toReviewEntries,
  filterReviewEntries,
  collectReviewTags,
  summarizeTareaRates,
  analyzeVulnerableTags,
  pickTodaysReview,
  type ReviewItemMeta,
} from "../lib/review";
import type { AttemptState } from "../lib/types";

function mcq(
  itemId: string,
  correct: boolean,
  extra: Partial<AttemptState> = {},
): AttemptState {
  return {
    itemId,
    kind: "listening",
    selectedAnswer: "a",
    correct,
    flagged: false,
    attemptCount: 1,
    lastAttemptedAt: 1,
    ...extra,
  } as AttemptState;
}

function open(itemId: string, extra: Partial<AttemptState> = {}): AttemptState {
  return {
    itemId,
    kind: "open",
    completed: true,
    selfScore: 2,
    flagged: false,
    attemptCount: 1,
    lastAttemptedAt: 1,
    ...extra,
  } as AttemptState;
}

function meta(id: string, over: Partial<ReviewItemMeta> = {}): ReviewItemMeta {
  return { id, skill: "listening", kind: "mcq", task: "tarea1", tags: [], label: id, ...over };
}

describe("getReviewReasons", () => {
  it("flags incorrect MCQ answers", () => {
    expect(getReviewReasons(mcq("a", false))).toEqual(["incorrect"]);
  });
  it("does not flag correct MCQ answers", () => {
    expect(getReviewReasons(mcq("a", true))).toEqual([]);
  });
  it("flags low self-score (holistic 1)", () => {
    expect(getReviewReasons(open("w", { selfScore: 1 }))).toEqual(["low-assessment"]);
  });
  it("flags a single rubric dimension of 1 even when holistic score is higher", () => {
    const attempt = open("w", {
      selfScore: 2,
      rubricScores: { adequacy: 1, coherence: 3, accuracy: 3, range: 3 },
    });
    expect(getReviewReasons(attempt)).toEqual(["low-assessment"]);
  });
  it("does not flag incomplete open attempts", () => {
    const attempt = { itemId: "w", kind: "open", completed: false, flagged: false, attemptCount: 1, lastAttemptedAt: 1 } as AttemptState;
    expect(getReviewReasons(attempt)).toEqual([]);
  });
  it("combines content reason with a star flag", () => {
    expect(getReviewReasons(mcq("a", false, { flagged: true }))).toEqual(["incorrect", "flagged"]);
  });
  it("flags a correct-but-starred item by the star only", () => {
    expect(getReviewReasons(mcq("a", true, { flagged: true }))).toEqual(["flagged"]);
  });
  it("flags an incomplete open attempt that is starred", () => {
    const attempt = { itemId: "w", kind: "open", completed: false, flagged: true, attemptCount: 1, lastAttemptedAt: 1 } as AttemptState;
    expect(getReviewReasons(attempt)).toEqual(["flagged"]);
  });
});

describe("buildAttemptEntries / toReviewEntries", () => {
  it("counts each item once regardless of attemptCount", () => {
    const attempts: Record<string, AttemptState> = {
      a: mcq("a", false, { attemptCount: 10 }),
    };
    const entries = buildAttemptEntries(attempts, new Map([["a", meta("a")]]));
    expect(entries).toHaveLength(1);
    expect(toReviewEntries(entries)).toHaveLength(1);
  });
  it("keeps orphan records (missing meta) in the queue", () => {
    const entries = buildAttemptEntries({ a: mcq("a", false) }, new Map());
    expect(entries[0].meta).toBeUndefined();
    expect(toReviewEntries(entries)).toHaveLength(1);
  });
});

describe("filterReviewEntries", () => {
  const attempts: Record<string, AttemptState> = {
    l1: mcq("l1", false),
    r1: mcq("r1", false, { kind: "reading" }),
    w1: open("w1", { selfScore: 1 }),
    orphan: mcq("orphan", false),
  };
  const metaById = new Map<string, ReviewItemMeta>([
    ["l1", meta("l1", { skill: "listening", tags: ["subjuntivo"] })],
    ["r1", meta("r1", { skill: "reading", kind: "mcq", tags: ["inferencia"] })],
    ["w1", meta("w1", { skill: "writing", kind: "open", task: "tarea1", tags: ["conectores"] })],
  ]);
  const entries = toReviewEntries(buildAttemptEntries(attempts, metaById));

  it("filters by skill and excludes orphans when a skill is chosen", () => {
    const listening = filterReviewEntries(entries, { skill: "listening", reason: "all", tag: "all" });
    expect(listening.map((e) => e.attempt.itemId)).toEqual(["l1"]);
  });
  it("filters by reason", () => {
    const low = filterReviewEntries(entries, { skill: "all", reason: "low-assessment", tag: "all" });
    expect(low.map((e) => e.attempt.itemId)).toEqual(["w1"]);
  });
  it("filters by tag", () => {
    const tagged = filterReviewEntries(entries, { skill: "all", reason: "all", tag: "conectores" });
    expect(tagged.map((e) => e.attempt.itemId)).toEqual(["w1"]);
  });
  it("combines filters", () => {
    const combined = filterReviewEntries(entries, { skill: "reading", reason: "incorrect", tag: "inferencia" });
    expect(combined.map((e) => e.attempt.itemId)).toEqual(["r1"]);
  });
  it("returns every entry, orphans included, when all filters are 'all'", () => {
    expect(filterReviewEntries(entries, { skill: "all", reason: "all", tag: "all" })).toHaveLength(4);
  });

  it("collects tag options sorted for Korean locale", () => {
    expect(collectReviewTags(entries)).toEqual(["conectores", "inferencia", "subjuntivo"]);
  });
});

describe("summarizeTareaRates", () => {
  function tareaEntries(sampleSize: number) {
    const attempts: Record<string, AttemptState> = {};
    const metaById = new Map<string, ReviewItemMeta>();
    for (let i = 0; i < sampleSize; i++) {
      const id = `l-${i}`;
      attempts[id] = mcq(id, i === 0); // 첫 문항만 정답
      metaById.set(id, meta(id, { skill: "listening", task: "tarea2" }));
    }
    return summarizeTareaRates(buildAttemptEntries(attempts, metaById));
  }

  it("shows an m/n sample text below the threshold (4 items)", () => {
    const rates = tareaEntries(4);
    const row = rates.listening.find((r) => r.task === "tarea2")!;
    expect(row.rate.kind).toBe("sample");
    expect(row.rate.text).toBe("1/4 정답");
  });
  it("shows a percentage at the threshold (5 items)", () => {
    const rates = tareaEntries(5);
    const row = rates.listening.find((r) => r.task === "tarea2")!;
    expect(row.rate.kind).toBe("percent");
    expect(row.rate.text).toBe("20%");
  });
  it("attributes listening items to the Tarea from meta, and skips orphans", () => {
    const attempts: Record<string, AttemptState> = { a: mcq("a", false), orphan: mcq("orphan", false) };
    const metaById = new Map([["a", meta("a", { skill: "listening", task: "tarea3" })]]);
    const rates = summarizeTareaRates(buildAttemptEntries(attempts, metaById));
    expect(rates.listening.map((r) => r.task)).toEqual(["tarea3"]);
  });
});

describe("analyzeVulnerableTags / pickTodaysReview", () => {
  it("surfaces tags attempted twice with >=30% error rate, counting correct answers in the denominator", () => {
    const attempts: Record<string, AttemptState> = {
      a: mcq("a", false),
      b: mcq("b", true),
      c: mcq("c", false),
    };
    const metaById = new Map<string, ReviewItemMeta>([
      ["a", meta("a", { tags: ["subjuntivo"] })],
      ["b", meta("b", { tags: ["subjuntivo"] })],
      ["c", meta("c", { tags: ["subjuntivo"] })],
    ]);
    const entries = buildAttemptEntries(attempts, metaById);
    const vulnerable = analyzeVulnerableTags(entries);
    expect(vulnerable).toEqual([{ tag: "subjuntivo", rate: 67 }]);

    const todays = pickTodaysReview(entries, vulnerable);
    expect(todays.map((e) => e.attempt.itemId)).toEqual(["a", "c"]);
  });
});
