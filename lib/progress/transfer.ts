import { mergeSnapshots, parseProgressSnapshot, shouldReplaceAttempt } from "./snapshot";
import type { AttemptStore } from "./store";

export function exportProgress(store: AttemptStore): string {
  return JSON.stringify(store.load().snapshot);
}

export interface ImportStats {
  added: number;
  updated: number;
  skipped: number;
  flagsChanged?: number;
}

export interface ImportProgressResult {
  stats: ImportStats;
  persistent: boolean;
  localRecovered: boolean;
}

export function importProgress(
  store: AttemptStore,
  jsonStr: string,
): ImportProgressResult | null {
  const incoming = parseProgressSnapshot(jsonStr);
  if (!incoming) return null;
  const loaded = store.load();
  const current = loaded.snapshot;

  const merged = mergeSnapshots(current, incoming);
  const stats: ImportStats = { added: 0, updated: 0, skipped: 0, flagsChanged: 0 };
  for (const [itemId, attempt] of Object.entries(incoming.attempts)) {
    const existing = current.attempts[itemId];
    if (!existing) {
      stats.added += 1;
    } else if (shouldReplaceAttempt(existing, attempt)) {
      stats.updated += 1;
    } else {
      stats.skipped += 1;
    }
  }

  const flagItemIds = new Set([
    ...Object.keys(current.attempts),
    ...Object.keys(current.pendingFlags ?? {}),
    ...Object.keys(merged.attempts),
    ...Object.keys(merged.pendingFlags ?? {}),
  ]);
  for (const itemId of flagItemIds) {
    const currentFlagged =
      current.attempts[itemId]?.flagged ?? current.pendingFlags?.[itemId] !== undefined;
    const mergedFlagged =
      merged.attempts[itemId]?.flagged ?? merged.pendingFlags?.[itemId] !== undefined;
    if (currentFlagged !== mergedFlagged) {
      stats.flagsChanged = (stats.flagsChanged ?? 0) + 1;
    }
  }

  const saved = store.save(merged);
  return {
    stats,
    persistent: saved.persistent,
    localRecovered: loaded.recovered,
  };
}
