"use client";

import type { ExamSkill } from "@/lib/types";

const tabs: ReadonlyArray<{ value: ExamSkill | "all"; label: string }> = [
  { value: "all", label: "전체" },
  { value: "reading", label: "읽기" },
  { value: "listening", label: "듣기" },
  { value: "writing", label: "쓰기" },
  { value: "speaking", label: "말하기" },
];

export function PracticeTabs({
  selectedSkill,
  onSelect,
}: {
  selectedSkill: ExamSkill | "all";
  onSelect: (skill: ExamSkill | "all") => void;
}) {
  return (
    <nav className="practice-tabs" aria-label="연습 영역 필터">
      {tabs.map(({ value, label }) => (
        <button
          key={value}
          className={value === "all" ? "practice-tab-all" : undefined}
          type="button"
          aria-current={selectedSkill === value ? "page" : undefined}
          aria-label={`${label} 영역 보기`}
          onClick={() => onSelect(value)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
