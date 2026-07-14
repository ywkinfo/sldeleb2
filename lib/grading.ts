import type {
  AttemptState,
  ListeningAttempt,
  ListeningMCQItem,
  OpenAttempt,
  ReadingAttempt,
  ReadingMCQItem,
} from "./types";
import { calculateRubricStats } from "./rubric";

// 채점에 실제로 필요한 최소 형태. 라이브 아이템과 시험 세션의 동결 계약
// (ExamItemContract) 모두 구조적으로 이 타입에 대입 가능하다.
export interface GradableMcq {
  id: string;
  skill: "reading" | "listening";
  options: { key: string; text: string }[];
  correctAnswer: string;
}

function previousCount(previous: AttemptState | undefined): number {
  return previous?.attemptCount ?? 0;
}

function previousFlag(previous: AttemptState | undefined): boolean {
  return previous?.flagged ?? false;
}

function gradeMCQAttempt<K extends "reading" | "listening">(
  kind: K,
  item: GradableMcq,
  selectedAnswer: string,
  previous: AttemptState | undefined,
  now: number,
) {
  if (!item.options.some((option) => option.key === selectedAnswer)) {
    throw new RangeError(`Unknown answer key "${selectedAnswer}" for ${item.id}`);
  }

  return {
    kind,
    itemId: item.id,
    selectedAnswer,
    correct: selectedAnswer === item.correctAnswer,
    flagged: previousFlag(previous),
    attemptCount: previousCount(previous) + 1,
    lastAttemptedAt: now,
  };
}

export function gradeReadingAttempt(
  item: ReadingMCQItem,
  selectedAnswer: string,
  previous?: AttemptState,
  now = Date.now(),
): ReadingAttempt {
  return gradeMCQAttempt("reading", item, selectedAnswer, previous, now);
}

export function gradeListeningAttempt(
  item: ListeningMCQItem,
  selectedAnswer: string,
  previous?: AttemptState,
  now = Date.now(),
): ListeningAttempt {
  return gradeMCQAttempt("listening", item, selectedAnswer, previous, now);
}

export function gradeMcqAttempt(
  item: GradableMcq,
  selectedAnswer: string,
  previous?: AttemptState,
  now = Date.now(),
): ReadingAttempt | ListeningAttempt {
  return gradeMCQAttempt(item.skill, item, selectedAnswer, previous, now) as ReadingAttempt | ListeningAttempt;
}

export function createOpenAttempt(
  itemId: string,
  previous?: AttemptState,
  now = Date.now(),
): OpenAttempt {
  return {
    kind: "open",
    itemId,
    completed: false,
    draft: previous?.kind === "open" ? previous.draft : undefined,
    flagged: previousFlag(previous),
    attemptCount: previousCount(previous),
    lastAttemptedAt: now,
  };
}

export function completeOpenAttempt(
  itemId: string,
  selfScore: 1 | 2 | 3,
  previous?: AttemptState,
  now = Date.now(),
): OpenAttempt {
  if (selfScore !== 1 && selfScore !== 2 && selfScore !== 3) {
    throw new RangeError("Self score must be 1, 2, or 3");
  }

  return {
    kind: "open",
    itemId,
    completed: true,
    draft: previous?.kind === "open" ? previous.draft : undefined,
    selfScore,
    flagged: previousFlag(previous),
    attemptCount: previousCount(previous) + 1,
    lastAttemptedAt: now,
  };
}

export function completeOpenAttemptWithRubric(
  itemId: string,
  skill: "writing" | "speaking",
  scores: import("./types").RubricScores,
  previous?: AttemptState,
  now = Date.now(),
): OpenAttempt {
  const stats = calculateRubricStats(skill, scores);

  return {
    kind: "open",
    itemId,
    completed: true,
    draft: previous?.kind === "open" ? previous.draft : undefined,
    selfScore: stats.holisticScore,
    rubricScores: scores,
    flagged: previousFlag(previous),
    attemptCount: previousCount(previous) + 1,
    lastAttemptedAt: now,
  };
}

export function markOpenIncomplete(
  itemId: string,
  previous?: AttemptState,
  now = Date.now(),
): OpenAttempt {
  return createOpenAttempt(itemId, previous, now);
}

export function setAttemptFlag<T extends AttemptState>(
  attempt: T,
  flagged: boolean,
): T {
  return { ...attempt, flagged };
}
