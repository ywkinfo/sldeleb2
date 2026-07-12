import { describe, expect, it } from "vitest";
import { isValidRubric, calculateRubricStats } from "../lib/rubric";

describe("isValidRubric", () => {
  it("validates exact shape for writing", () => {
    expect(isValidRubric("writing", { adequacy: 1, coherence: 2, accuracy: 3, range: 2 })).toBe(true);
    expect(isValidRubric("writing", { adequacy: 1, coherence: 2, accuracy: 3 })).toBe(false); // missing
    expect(isValidRubric("writing", { adequacy: 1, coherence: 2, accuracy: 3, range: 2, extra: 1 })).toBe(false); // extra
    expect(isValidRubric("writing", { adequacy: 1, coherence: 2, accuracy: 3, range: 4 })).toBe(false); // invalid value
  });

  it("validates exact shape for speaking", () => {
    expect(isValidRubric("speaking", { coherence: 2, fluency: 3, accuracy: 2, range: 1 })).toBe(true);
    expect(isValidRubric("speaking", { adequacy: 1, coherence: 2, accuracy: 3, range: 2 })).toBe(false); // wrong keys
  });
});

describe("calculateRubricStats", () => {
  it("calculates 1.0 properly", () => {
    const stats = calculateRubricStats("writing", { adequacy: 1, coherence: 1, accuracy: 1, range: 1 });
    expect(stats.average).toBe(1.0);
    expect(stats.holisticScore).toBe(1);
    expect(stats.weakestDimensions).toEqual(["adequacy", "coherence", "accuracy", "range"]);
  });

  it("calculates 1.5 properly", () => {
    const stats = calculateRubricStats("writing", { adequacy: 1, coherence: 2, accuracy: 1, range: 2 });
    expect(stats.average).toBe(1.5);
    expect(stats.holisticScore).toBe(2);
    expect(stats.weakestDimensions).toEqual(["adequacy", "accuracy"]);
  });

  it("calculates 2.25 properly", () => {
    const stats = calculateRubricStats("writing", { adequacy: 2, coherence: 2, accuracy: 2, range: 3 });
    expect(stats.average).toBe(2.3); // 9 / 4 = 2.25 -> toFixed(1) -> 2.3
    expect(stats.holisticScore).toBe(2);
    expect(stats.weakestDimensions).toEqual(["adequacy", "coherence", "accuracy"]);
  });

  it("calculates 2.5 properly", () => {
    const stats = calculateRubricStats("speaking", { coherence: 2, fluency: 3, accuracy: 2, range: 3 });
    expect(stats.average).toBe(2.5); // 10 / 4 = 2.5
    expect(stats.holisticScore).toBe(3);
    expect(stats.weakestDimensions).toEqual(["coherence", "accuracy"]);
  });

  it("calculates 3.0 properly", () => {
    const stats = calculateRubricStats("speaking", { coherence: 3, fluency: 3, accuracy: 3, range: 3 });
    expect(stats.average).toBe(3.0);
    expect(stats.holisticScore).toBe(3);
    expect(stats.weakestDimensions).toEqual(["coherence", "fluency", "accuracy", "range"]);
  });
});
