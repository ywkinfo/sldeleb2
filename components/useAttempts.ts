"use client";

/* Progress is read from the browser only after hydration, then kept in sync by the store subscription. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { getDefaultAttemptStore } from "@/lib/storage";
import type { AttemptState, ProgressSnapshot } from "@/lib/types";

export function useAttempts() {
  const store = getDefaultAttemptStore();
  const initial: ProgressSnapshot = { schemaVersion: 1, attempts: {} };
  const [snapshot, setSnapshot] = useState<ProgressSnapshot>(initial);
  const [persistent, setPersistent] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = store.load();
    setSnapshot(loaded.snapshot);
    setPersistent(loaded.persistent);
    setHydrated(true);
    return store.subscribe((next) => {
      setSnapshot(next.snapshot);
      setPersistent(next.persistent);
    });
  }, [store]);

  const update = (attempt: AttemptState) => {
    const result = store.updateAttempt(attempt);
    setPersistent(result.persistent);
  };
  const remove = (itemId: string) => {
    const result = store.removeAttempt(itemId);
    setPersistent(result.persistent);
  };

  return { attempts: snapshot.attempts, persistent, hydrated, update, remove };
}
