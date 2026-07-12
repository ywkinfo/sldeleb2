"use client";

import { useEffect, useState } from "react";
import type { PracticeSet } from "@/lib/types";
import { summarizeSetProgress } from "@/lib/progress";
import { useAttempts } from "./useAttempts";

export function SetProgressBar({ set }: { set: PracticeSet }) {
  const { attempts, hydrated } = useAttempts();
  const [top, setTop] = useState(0);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header || typeof ResizeObserver === "undefined") return;
    const update = () => setTop(header.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const prog = hydrated
    ? summarizeSetProgress(set, attempts)
    : { answered: 0, total: set.itemIds.length, status: "not-started" as const };
  const pct = prog.total ? Math.round((prog.answered / prog.total) * 100) : 0;

  return (
    <div className="set-progress-bar" style={{ top }}>
      <div className="site-shell set-progress-row">
        <span className="set-progress-count"><strong>{prog.answered}</strong> / {prog.total} 완료</span>
        <div className="progress set-progress-track" aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>
        {prog.status === "done" && <a className="button small" href="#set-summary">세트 결과 보기</a>}
      </div>
    </div>
  );
}
