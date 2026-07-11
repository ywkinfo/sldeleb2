import type {
  AttemptState,
  OpenAttempt,
  ReadingAttempt,
  ReadingMCQItem,
} from "./types";

function previousCount(previous: AttemptState | undefined): number {
  return previous?.attemptCount ?? 0;
}

function previousFlag(previous: AttemptState | undefined): boolean {
  return previous?.flagged ?? false;
}

export function gradeReadingAttempt(
  item: ReadingMCQItem,
  selectedAnswer: string,
  previous?: AttemptState,
  now = Date.now(),
): ReadingAttempt {
  if (!item.options.some((option) => option.key === selectedAnswer)) {
    throw new RangeError(`Unknown answer key "${selectedAnswer}" for ${item.id}`);
  }

  return {
    kind: "reading",
    itemId: item.id,
    selectedAnswer,
    correct: selectedAnswer === item.correctAnswer,
    flagged: previousFlag(previous),
    attemptCount: previousCount(previous) + 1,
    lastAttemptedAt: now,
  };
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
    selfScore,
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
