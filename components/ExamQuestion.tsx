"use client";

import type { ListeningMCQItem, ReadingMCQItem } from "@/lib/types";
import { McqOptions, handleMcqKeyDown } from "./McqOptions";

/**
 * 시험 모드 문항 — 제어형. 선택만 기록하고 피드백·정답 확인은 없다.
 * 별표는 세션의 flaggedItemIds(제출 전 검토용)로, 연습의 attempt flag와 무관.
 */
export function ExamQuestion({
  item,
  number,
  value,
  flagged,
  disabled,
  onSelect,
  onToggleFlag,
}: {
  item: ReadingMCQItem | ListeningMCQItem;
  number: number;
  value?: string;
  flagged: boolean;
  disabled: boolean;
  onSelect: (key: string) => void;
  onToggleFlag: () => void;
}) {
  const lastChar = String.fromCharCode(65 + item.options.length - 1);
  return (
    <section
      className="question"
      id={item.id}
      aria-labelledby={`${item.id}-prompt`}
      onKeyDown={(event) =>
        handleMcqKeyDown(event, {
          options: item.options,
          canSelect: !disabled,
          currentKey: value,
          onSelect,
        })
      }
    >
      <h3 id={`${item.id}-prompt`}>{number}. <span lang="es">{item.prompt}</span></h3>
      <McqOptions
        options={item.options}
        ariaLabel={`${number}번 선택지`}
        value={value}
        disabled={disabled}
        onSelect={onSelect}
      />
      <div className="question-actions">
        <button className="button secondary small" type="button" aria-pressed={flagged} disabled={disabled} onClick={onToggleFlag}>
          {flagged ? "★ 검토 표시 해제" : "☆ 검토 표시"}
        </button>
        {!disabled && <span className="muted exam-shortcut-hint">단축키: A–{lastChar} 선택 · ↑↓ 이동</span>}
      </div>
    </section>
  );
}
