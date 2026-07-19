import { isValidRubric } from "../rubric";
import type { AttemptState, ProgressSnapshot, RubricScores } from "../types";

export const PROGRESS_SCHEMA_VERSION = 1 as const;

function isFiniteNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
  );
}

export function buildSnapshot(
  attempts: Record<string, AttemptState>,
  pendingFlags?: Record<string, number>,
): ProgressSnapshot {
  return pendingFlags && Object.keys(pendingFlags).length > 0
    ? { schemaVersion: PROGRESS_SCHEMA_VERSION, attempts, pendingFlags }
    : { schemaVersion: PROGRESS_SCHEMA_VERSION, attempts };
}

export function isAttemptState(value: unknown): value is AttemptState {
  if (!value || typeof value !== "object") return false;
  const attempt = value as Record<string, unknown>;
  if (
    typeof attempt.itemId !== "string" ||
    attempt.itemId.length === 0 ||
    typeof attempt.flagged !== "boolean" ||
    !isFiniteNonNegativeInteger(attempt.attemptCount) ||
    !isFiniteNonNegativeInteger(attempt.lastAttemptedAt)
  ) {
    return false;
  }

  if (attempt.kind === "reading" || attempt.kind === "listening") {
    return (
      typeof attempt.selectedAnswer === "string" &&
      typeof attempt.correct === "boolean"
    );
  }

  if (attempt.kind !== "open" || typeof attempt.completed !== "boolean") {
    return false;
  }

  if (attempt.draft !== undefined && typeof attempt.draft !== "string") {
    return false;
  }

  if (!attempt.completed) {
    return attempt.selfScore === undefined && attempt.rubricScores === undefined;
  }
  if (attempt.selfScore !== 1 && attempt.selfScore !== 2 && attempt.selfScore !== 3) {
    return false;
  }
  if (attempt.rubricScores !== undefined) {
    return (
      isValidRubric("writing", attempt.rubricScores) ||
      isValidRubric("speaking", attempt.rubricScores)
    );
  }
  return true;
}

function isPendingFlagsMap(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value as Record<string, unknown>).every(
    ([itemId, flaggedAt]) =>
      itemId.length > 0 && isFiniteNonNegativeInteger(flaggedAt),
  );
}

export function isProgressSnapshot(value: unknown): value is ProgressSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Record<string, unknown>;
  if (
    snapshot.schemaVersion !== PROGRESS_SCHEMA_VERSION ||
    !snapshot.attempts ||
    typeof snapshot.attempts !== "object" ||
    Array.isArray(snapshot.attempts)
  ) {
    return false;
  }

  if (
    snapshot.pendingFlags !== undefined &&
    !isPendingFlagsMap(snapshot.pendingFlags)
  ) {
    return false;
  }

  return Object.entries(snapshot.attempts as Record<string, unknown>).every(
    ([itemId, attempt]) =>
      isAttemptState(attempt) && (attempt as AttemptState).itemId === itemId,
  );
}

function sanitizePendingFlags(
  value: unknown,
): Record<string, number> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const result: Record<string, number> = {};
  for (const [itemId, flaggedAt] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (itemId.length > 0 && isFiniteNonNegativeInteger(flaggedAt)) {
      result[itemId] = flaggedAt;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function sameRubricScores(
  a: RubricScores | undefined,
  b: RubricScores | undefined,
): boolean {
  if (a === undefined || b === undefined) return a === b;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return Array.from(keys).every(
    (key) =>
      (a as unknown as Record<string, number>)[key] ===
      (b as unknown as Record<string, number>)[key],
  );
}

export function sameAttemptIgnoringFlag(
  a: AttemptState,
  b: AttemptState,
): boolean {
  if (a.kind !== b.kind || a.itemId !== b.itemId) return false;
  if (
    a.attemptCount !== b.attemptCount ||
    a.lastAttemptedAt !== b.lastAttemptedAt
  ) {
    return false;
  }
  if (a.kind === "reading" && b.kind === "reading") {
    return a.selectedAnswer === b.selectedAnswer && a.correct === b.correct;
  }
  if (a.kind === "listening" && b.kind === "listening") {
    return a.selectedAnswer === b.selectedAnswer && a.correct === b.correct;
  }
  if (a.kind === "open" && b.kind === "open") {
    return (
      a.completed === b.completed &&
      a.draft === b.draft &&
      a.selfScore === b.selfScore &&
      sameRubricScores(a.rubricScores, b.rubricScores)
    );
  }
  return false;
}

export function shouldReplaceAttempt(
  existing: AttemptState | undefined,
  incoming: AttemptState,
): boolean {
  if (!existing || incoming.lastAttemptedAt > existing.lastAttemptedAt) return true;
  return (
    incoming.lastAttemptedAt === existing.lastAttemptedAt &&
    !sameAttemptIgnoringFlag(existing, incoming)
  );
}

export function consumePendingFlags(
  attempts: Record<string, AttemptState>,
  pendingFlags: Record<string, number> | undefined,
  forcePromoteItemIds?: ReadonlySet<string>,
): {
  attempts: Record<string, AttemptState>;
  pendingFlags?: Record<string, number>;
  changed: boolean;
} {
  if (!pendingFlags) return { attempts, changed: false };
  let nextAttempts = attempts;
  let remaining: Record<string, number> | undefined;
  let changed = false;
  for (const [itemId, flaggedAt] of Object.entries(pendingFlags)) {
    const attempt = attempts[itemId];
    if (!attempt) {
      (remaining ??= {})[itemId] = flaggedAt;
      continue;
    }
    changed = true;
    const shouldPromote =
      forcePromoteItemIds?.has(itemId) === true || flaggedAt > attempt.lastAttemptedAt;
    if (shouldPromote && !attempt.flagged) {
      if (nextAttempts === attempts) nextAttempts = { ...attempts };
      nextAttempts[itemId] = { ...attempt, flagged: true };
    }
  }
  return { attempts: nextAttempts, pendingFlags: remaining, changed };
}

export function coerceProgressSnapshot(value: unknown): ProgressSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const base: unknown = {
    schemaVersion: candidate.schemaVersion,
    attempts: candidate.attempts,
  };
  if (!isProgressSnapshot(base)) return null;
  const { attempts } = base as ProgressSnapshot;
  const consumed = consumePendingFlags(
    attempts,
    sanitizePendingFlags(candidate.pendingFlags),
  );
  return buildSnapshot(consumed.attempts, consumed.pendingFlags);
}

export function parseProgressSnapshot(raw: string): ProgressSnapshot | null {
  try {
    return coerceProgressSnapshot(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function mergeSnapshots(
  current: ProgressSnapshot,
  incoming: ProgressSnapshot,
): ProgressSnapshot {
  const mergedAttempts = { ...current.attempts };
  for (const [itemId, attempt] of Object.entries(incoming.attempts)) {
    const existing = mergedAttempts[itemId];
    if (shouldReplaceAttempt(existing, attempt)) {
      mergedAttempts[itemId] = attempt;
    }
  }

  const mergedFlags: Record<string, number> = { ...(current.pendingFlags ?? {}) };
  for (const [itemId, flaggedAt] of Object.entries(incoming.pendingFlags ?? {})) {
    const existing = mergedFlags[itemId];
    if (existing === undefined || flaggedAt > existing) {
      mergedFlags[itemId] = flaggedAt;
    }
  }
  const consumed = consumePendingFlags(
    mergedAttempts,
    Object.keys(mergedFlags).length > 0 ? mergedFlags : undefined,
  );
  return buildSnapshot(consumed.attempts, consumed.pendingFlags);
}
