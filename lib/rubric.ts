import type { RubricScores, RubricScore } from "./types";
export type { RubricScores, RubricScore };

export const DIMENSIONS_WRITING = ["adequacy", "coherence", "accuracy", "range"] as const;
export const DIMENSIONS_SPEAKING = ["coherence", "fluency", "accuracy", "range"] as const;

export type WritingDimension = typeof DIMENSIONS_WRITING[number];
export type SpeakingDimension = typeof DIMENSIONS_SPEAKING[number];

export const DIMENSION_LABELS: Record<string, string> = {
  adequacy: "적합성",
  coherence: "일관성",
  accuracy: "정확성",
  range: "표현의 다양성",
  fluency: "유창성",
};

function isScore(value: unknown): value is RubricScore {
  return value === 1 || value === 2 || value === 3;
}

export function isValidRubric(skill: "writing" | "speaking", scores: unknown): scores is RubricScores {
  if (!scores || typeof scores !== "object") return false;
  const s = scores as Record<string, unknown>;

  const requiredKeys = skill === "writing" ? DIMENSIONS_WRITING : DIMENSIONS_SPEAKING;

  // Check exact keys
  const keys = Object.keys(s);
  if (keys.length !== requiredKeys.length) return false;
  
  for (const k of requiredKeys) {
    if (!keys.includes(k)) return false;
    if (!isScore(s[k])) return false;
  }
  
  return true;
}

export interface RubricStats {
  average: number;
  holisticScore: 1 | 2 | 3;
  weakestDimensions: string[];
}

export function calculateRubricStats(skill: "writing" | "speaking", scores: RubricScores): RubricStats {
  const dimensions = skill === "writing" ? DIMENSIONS_WRITING : DIMENSIONS_SPEAKING;
  
  let total = 0;
  let minScore = 3;
  const weakDims: string[] = [];

  for (const dim of dimensions) {
    const val = (scores as unknown as Record<string, number>)[dim];
    total += val;
    if (val < minScore) {
      minScore = val;
      weakDims.length = 0; // Clear
      weakDims.push(dim);
    } else if (val === minScore) {
      weakDims.push(dim);
    }
  }

  const average = Number((total / dimensions.length).toFixed(1));
  let holisticScore: 1 | 2 | 3 = 1;
  if (average >= 2.5) {
    holisticScore = 3;
  } else if (average >= 1.5) {
    holisticScore = 2;
  }

  return {
    average,
    holisticScore,
    weakestDimensions: weakDims,
  };
}
