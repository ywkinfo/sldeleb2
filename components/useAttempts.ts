"use client";

/* Progress is read from the browser only after hydration, then kept in sync by the store subscription. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
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

  // store는 싱글턴이라 안정적 — update/remove를 메모이즈해 이벤트 핸들러·effect가
  // 안전하게 의존할 수 있게 한다(WritingTask의 이탈 flush 등).
  const update = useCallback(
    (attempt: AttemptState) => {
      const result = store.updateAttempt(attempt);
      setPersistent(result.persistent);
    },
    [store],
  );
  const remove = useCallback(
    (itemId: string) => {
      const result = store.removeAttempt(itemId);
      setPersistent(result.persistent);
    },
    [store],
  );

  return { attempts: snapshot.attempts, persistent, hydrated, update, remove };
}
