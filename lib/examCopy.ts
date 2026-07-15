import type { AutoGradedExamSkill } from "./types";

// 모의고사 목록·세션·인트로가 공유하는 영역별 표기. 하드코딩된 "Audición"/
// "Comprensión auditiva"를 이 map으로 대체해 읽기·듣기를 함께 다룬다.
export interface ExamSkillCopy {
  /** 영역 라벨 (스페인어). */
  areaLabel: string;
  /** 섹션 eyebrow (스페인어). */
  sectionEyebrow: string;
  /** 창작 안내 배지. */
  contentBadge: string;
  /** 목록 카드의 형식 요약 (문항·시간 뒤 문구). */
  formatNote: string;
}

export const EXAM_SKILL_COPY: Record<AutoGradedExamSkill, ExamSkillCopy> = {
  listening: {
    areaLabel: "Comprensión auditiva",
    sectionEyebrow: "Audición",
    contentBadge: "창작 문항 · 합성 음성(TTS) · 공식 기출 아님",
    formatNote: "제출 후 일괄 채점 · 음원 2회 재생",
  },
  reading: {
    areaLabel: "Comprensión de lectura",
    sectionEyebrow: "Lectura",
    contentBadge: "창작 지문 · 공식 기출 아님",
    formatNote: "제출 후 일괄 채점 · 지문 제공",
  },
};
