"use client";

import { formatRemainingTime } from "@/lib/timer";
import { sitePath } from "@/lib/url";
import { StickyStatusBar } from "./StickyStatusBar";

export function ExamToolbar({
  remaining,
  answered,
  total,
  persistent,
  onOpenPalette,
  onSubmit,
}: {
  remaining: number;
  answered: number;
  total: number;
  persistent: boolean;
  onOpenPalette: (opener: HTMLButtonElement) => void;
  onSubmit: () => void;
}) {
  return (
    <StickyStatusBar>
      <div className="exam-toolbar" role="toolbar" aria-label="모의고사 도구">
        <a className="button secondary small exam-exit" href={sitePath("/exam")}>시험 나가기</a>
        <span className={`exam-bar-timer ${remaining <= 5 * 60_000 ? "low" : ""}`} aria-label="남은 시간">
          {formatRemainingTime(remaining)}
        </span>
        <span className="set-progress-count"><strong>{answered}</strong> / {total} 응답</span>
        <span className={`exam-save-state ${persistent ? "saved" : "temporary"}`} role="status">
          {persistent ? "저장됨" : "임시 저장"}
        </span>
        <div className="progress set-progress-track" aria-hidden="true">
          <span style={{ width: `${total ? Math.round((answered / total) * 100) : 0}%` }} />
        </div>
        <button
          className="button secondary small exam-palette-trigger"
          type="button"
          aria-label="문항 목록 열기"
          onClick={(event) => onOpenPalette(event.currentTarget)}
        >
          문항 목록
        </button>
        <button className="button small exam-submit" type="button" onClick={onSubmit}>답안 제출</button>
      </div>
    </StickyStatusBar>
  );
}
