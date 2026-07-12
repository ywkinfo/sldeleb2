import { practiceSets } from "@/data/practiceSets";
import type { PracticeSet } from "./types";

/**
 * Returns all published practice sets.
 */
export function getPublishedSets(): PracticeSet[] {
  return practiceSets.filter((s) => s.status === "published");
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
export function orderItemsBySet<T extends { id: string }>(set: PracticeSet, items: T[]): T[] {
  const itemMap = new Map(items.map(item => [item.id, item]));
  return set.itemIds
    .map(id => itemMap.get(id))
    .filter((item): item is T => item !== undefined);
}
