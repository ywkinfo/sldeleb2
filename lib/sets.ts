import { practiceSets } from "@/data/practiceSets";
import type { PracticeSet } from "./types";

const SKILL_ORDER: Record<PracticeSet["skill"], number> = {
  reading: 0,
  listening: 1,
  writing: 2,
  speaking: 3,
  mixed: 4,
};
const MODE_ORDER: Record<PracticeSet["mode"], number> = {
  guided: 0,
  "exam-prep": 1,
};
const TASK_ORDER = {
  tarea1: 0,
  tarea2: 1,
  tarea3: 2,
  tarea4: 3,
  tarea5: 4,
} as const;

/** 영역 → 모드 → Tarea → 명시적 순서로 정렬한 새 배열을 반환한다. */
export function sortPracticeSets(sets: readonly PracticeSet[]): PracticeSet[] {
  return [...sets].sort((a, b) =>
    SKILL_ORDER[a.skill] - SKILL_ORDER[b.skill] ||
    MODE_ORDER[a.mode] - MODE_ORDER[b.mode] ||
    (a.task === undefined ? 99 : TASK_ORDER[a.task]) -
      (b.task === undefined ? 99 : TASK_ORDER[b.task]) ||
    a.sequence - b.sequence ||
    a.id.localeCompare(b.id),
  );
}

/**
 * Returns all published practice sets.
 */
export function getPublishedSets(): PracticeSet[] {
  return sortPracticeSets(practiceSets.filter((s) => s.status === "published"));
}

/**
 * Retrieves a specific practice set by its ID.
 */
export function getSetById(setId: string): PracticeSet | undefined {
  return practiceSets.find((s) => s.id === setId);
}

/**
 * Finds the set ID that contains a specific practice item.
 * Currently, we assume an item belongs to only one set.
 */
export function getSetIdForItem(itemId: string): string | undefined {
  return practiceSets.find((s) => s.itemIds.includes(itemId))?.id;
}

/**
 * Orders items according to the itemIds defined in the practice set.
 * Ignores items that are not in the set's itemIds.
 */
export function orderItemsBySet<T extends { id: string }>(set: PracticeSet, items: readonly T[]): T[] {
  const itemMap = new Map(items.map(item => [item.id, item]));
  return set.itemIds
    .map(id => itemMap.get(id))
    .filter((item): item is T => item !== undefined);
}
