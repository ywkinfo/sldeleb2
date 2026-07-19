import { sortPracticeSets } from "../sets";
import type { AttemptState, PracticeSet } from "../types";

export interface SetProgress {
  total: number;
  answered: number;
  correct: number;
  isMcqSet: boolean;
  status: "not-started" | "in-progress" | "done";
}

export function summarizeSetProgress(set: PracticeSet, attempts: Record<string, AttemptState>): SetProgress {
  const isMcqSet = set.skill === "reading" || set.skill === "listening";
  let answered = 0;
  let correct = 0;

  for (const itemId of set.itemIds) {
    const attempt = attempts[itemId];
    if (!attempt) continue;

    if (set.skill === "reading") {
      if (attempt.kind === "reading") {
        answered++;
        if (attempt.correct) correct++;
      }
    } else if (set.skill === "listening") {
      if (attempt.kind === "listening") {
        answered++;
        if (attempt.correct) correct++;
      }
    } else if (set.skill === "writing" || set.skill === "speaking") {
      if (attempt.kind === "open" && attempt.completed) {
        answered++;
      }
    } else {
      // Mixed set
      if (attempt.kind === "reading" || attempt.kind === "listening") {
        answered++;
        if (attempt.correct) correct++;
      } else if (attempt.kind === "open" && attempt.completed) {
        answered++;
      }
    }
  }

  const total = set.itemIds.length;
  let status: "not-started" | "in-progress" | "done" = "not-started";
  if (answered === total && total > 0) {
    status = "done";
  } else if (answered > 0) {
    status = "in-progress";
  }

  return {
    total,
    answered,
    correct,
    isMcqSet,
    status,
  };
}

/** 표본이 이보다 작으면 %가 과장되므로 "m/n 정답" 형태로 표기한다. */
export const RATE_MIN_ATTEMPTS = 5;

export interface RateSummary {
  kind: "empty" | "sample" | "percent";
  text: string;
  pct: number;
}

export function summarizeRate(correct: number, total: number): RateSummary {
  if (total === 0) return { kind: "empty", text: "–", pct: 0 };
  const pct = Math.round((correct / total) * 100);
  if (total < RATE_MIN_ATTEMPTS) {
    return { kind: "sample", text: `${correct}/${total} 정답`, pct };
  }
  return { kind: "percent", text: `${pct}%`, pct };
}

export function pickNextSet(
  currentSetId: string,
  sets: PracticeSet[],
  attempts: Record<string, AttemptState>,
): PracticeSet | undefined {
  const orderedSets = sortPracticeSets(sets);
  const currentSetIndex = orderedSets.findIndex((set) => set.id === currentSetId);
  if (currentSetIndex === -1) return undefined;

  const currentSet = orderedSets[currentSetIndex];

  // 1. Same skill, next to end
  for (let i = currentSetIndex + 1; i < orderedSets.length; i++) {
    if (orderedSets[i].skill === currentSet.skill) {
      const prog = summarizeSetProgress(orderedSets[i], attempts);
      if (prog.status !== "done") return orderedSets[i];
    }
  }

  // 2. Same skill, start to current
  for (let i = 0; i < currentSetIndex; i++) {
    if (orderedSets[i].skill === currentSet.skill) {
      const prog = summarizeSetProgress(orderedSets[i], attempts);
      if (prog.status !== "done") return orderedSets[i];
    }
  }

  // 3. Different skill, start to end
  for (const set of orderedSets) {
    if (set.skill !== currentSet.skill) {
      const prog = summarizeSetProgress(set, attempts);
      if (prog.status !== "done") return set;
    }
  }

  return undefined;
}
