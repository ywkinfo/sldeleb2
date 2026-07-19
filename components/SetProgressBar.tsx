"use client";

import type { PracticeSet } from "@/lib/types";
import { summarizeSetProgress } from "@/lib/progress";
import { useAttempts } from "@/hooks/useAttempts";
import { StickyStatusBar } from "./StickyStatusBar";

export function SetProgressBar({ set }: { set: PracticeSet }) {
  const { attempts, hydrated } = useAttempts();

  const prog = hydrated
    ? summarizeSetProgress(set, attempts)
    : { answered: 0, total: set.itemIds.length, status: "not-started" as const };
  const pct = prog.total ? Math.round((prog.answered / prog.total) * 100) : 0;

  return (
    <StickyStatusBar>
      <span className="set-progress-count"><strong>{prog.answered}</strong> / {prog.total} 완료</span>
      <div className="progress set-progress-track" aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>
      {prog.status === "done" && <a className="button small" href="#set-summary">세트 결과 보기</a>}
    </StickyStatusBar>
  );
}
