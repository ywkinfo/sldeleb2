import type { PracticeSet, AttemptState } from "./types";

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
    status
  };
}

export function pickNextSet(currentSetId: string, sets: PracticeSet[], attempts: Record<string, AttemptState>): PracticeSet | undefined {
  const currentSetIndex = sets.findIndex(s => s.id === currentSetId);
  if (currentSetIndex === -1) return undefined;

  const currentSet = sets[currentSetIndex];
  
  // 1. Same skill, next to end
  for (let i = currentSetIndex + 1; i < sets.length; i++) {
    if (sets[i].skill === currentSet.skill) {
      const prog = summarizeSetProgress(sets[i], attempts);
      if (prog.status !== "done") return sets[i];
    }
  }

  // 2. Same skill, start to current
  for (let i = 0; i < currentSetIndex; i++) {
    if (sets[i].skill === currentSet.skill) {
      const prog = summarizeSetProgress(sets[i], attempts);
      if (prog.status !== "done") return sets[i];
    }
  }

  // 3. Different skill, start to end
  for (let i = 0; i < sets.length; i++) {
    if (sets[i].skill !== currentSet.skill) {
      const prog = summarizeSetProgress(sets[i], attempts);
      if (prog.status !== "done") return sets[i];
    }
  }

  return undefined;
}
