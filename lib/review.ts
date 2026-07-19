import type { AttemptState, PracticeSkill, Task } from "./types";
import { summarizeRate, type RateSummary } from "./progress/summary";

/*
 * 복습 보드의 순수 로직. 클라이언트에서도 쓰이므로 data 모듈의 전문·중량 데이터는
 * 직접 import하지 않는다. Tarea/영역/태그는 attempt에 저장하지 않고(스키마 불변),
 * 서버에서 만든 compact ReviewItemMeta로 렌더 시 파생한다.
 */

export interface ReviewItemMeta {
  id: string;
  skill: PracticeSkill;
  kind: "mcq" | "open" | "oral";
  task?: Task;
  tags: string[];
  /** 서버에서 선계산한 표시 라벨(원문 prompt를 클라이언트로 넘기지 않기 위함). */
  label: string;
}

export type ReviewReason = "incorrect" | "low-assessment" | "flagged";

export const REVIEW_REASON_LABELS: Record<ReviewReason, string> = {
  incorrect: "오답",
  "low-assessment": "낮은 자기평가",
  flagged: "별표",
};

export const REVIEW_SKILL_LABELS: Record<PracticeSkill, string> = {
  reading: "읽기",
  listening: "듣기",
  writing: "쓰기",
  speaking: "말하기",
};

/** 한 문항의 최신 기록이 복습 대상이 되는 사유를 모두 반환한다(없으면 빈 배열). */
export function getReviewReasons(attempt: AttemptState): ReviewReason[] {
  const reasons: ReviewReason[] = [];
  if (attempt.kind === "open") {
    if (attempt.completed) {
      if (attempt.selfScore === 1) {
        reasons.push("low-assessment");
      } else if (attempt.rubricScores && Object.values(attempt.rubricScores).some((score) => score === 1)) {
        reasons.push("low-assessment");
      }
    }
  } else if (!attempt.correct) {
    reasons.push("incorrect");
  }
  if (attempt.flagged) reasons.push("flagged");
  return reasons;
}

export interface AttemptEntry {
  itemId: string;
  /** 정렬·추천 기준 시각 — attempt.lastAttemptedAt 또는 (미풀이 별표는) 별표 시각. */
  lastTouchedAt: number;
  /** 아직 풀지 않은 제출 전 별표(pendingFlags) 전용 항목이면 undefined. */
  attempt?: AttemptState;
  /** 콘텐츠가 삭제된 orphan 기록이면 undefined. */
  meta?: ReviewItemMeta;
  reasons: ReviewReason[];
}

/** 저장된 모든 최신 기록을 한 번에 정규화한다(통계·태그 분석은 정답 기록까지 필요). */
export function buildAttemptEntries(
  attempts: Record<string, AttemptState>,
  metaById: Map<string, ReviewItemMeta>,
  pendingFlags: Record<string, number> = {},
): AttemptEntry[] {
  const entries: AttemptEntry[] = Object.values(attempts).map((attempt) => ({
    itemId: attempt.itemId,
    lastTouchedAt: attempt.lastAttemptedAt,
    attempt,
    meta: metaById.get(attempt.itemId),
    reasons: getReviewReasons(attempt),
  }));
  // 아직 풀지 않은 별표. attempt가 생기면 스토리지가 흡수하므로 겹치는
  // itemId는 방어적으로 건너뛴다(중복 행 금지).
  for (const [itemId, flaggedAt] of Object.entries(pendingFlags)) {
    if (attempts[itemId]) continue;
    entries.push({
      itemId,
      lastTouchedAt: flaggedAt,
      meta: metaById.get(itemId),
      reasons: ["flagged"],
    });
  }
  return entries;
}

/** 복습 대기열 = 사유가 하나라도 있는 항목. */
export function toReviewEntries(entries: AttemptEntry[]): AttemptEntry[] {
  return entries.filter((entry) => entry.reasons.length > 0);
}

export interface ReviewFilter {
  skill: PracticeSkill | "all";
  reason: ReviewReason | "all";
  tag: string | "all";
}

export const EMPTY_REVIEW_FILTER: ReviewFilter = { skill: "all", reason: "all", tag: "all" };

export function filterReviewEntries(entries: AttemptEntry[], filter: ReviewFilter): AttemptEntry[] {
  return entries.filter((entry) => {
    // orphan(meta 없음)은 영역/태그를 특정하면 제외된다.
    if (filter.skill !== "all" && entry.meta?.skill !== filter.skill) return false;
    if (filter.reason !== "all" && !entry.reasons.includes(filter.reason)) return false;
    if (filter.tag !== "all" && !entry.meta?.tags.includes(filter.tag)) return false;
    return true;
  });
}

/** 대기열에 실제로 존재하는 태그 옵션을 한국어 정렬로 반환한다. */
export function collectReviewTags(entries: AttemptEntry[]): string[] {
  const tags = new Set<string>();
  for (const entry of entries) {
    for (const tag of entry.meta?.tags ?? []) tags.add(tag);
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b, "ko"));
}

export interface TareaRateRow {
  task: Task;
  rate: RateSummary;
}

export interface TareaRates {
  reading: TareaRateRow[];
  listening: TareaRateRow[];
}

const READING_TAREAS: Task[] = ["tarea1", "tarea2", "tarea3", "tarea4"];
const LISTENING_TAREAS: Task[] = ["tarea1", "tarea2", "tarea3", "tarea4", "tarea5"];

/** 읽기·듣기의 Tarea별 정답률(각 문항의 가장 최근 결과 기준). orphan·미해석 task는 제외. */
export function summarizeTareaRates(entries: AttemptEntry[]): TareaRates {
  const tally = (skill: "reading" | "listening", order: Task[]): TareaRateRow[] => {
    const buckets = new Map<Task, { correct: number; total: number }>();
    for (const { meta, attempt } of entries) {
      // 미풀이 별표(attempt 없음)는 정답률 분모에 넣지 않는다.
      if (!attempt || !meta?.task || meta.skill !== skill || attempt.kind === "open") continue;
      const bucket = buckets.get(meta.task) ?? { correct: 0, total: 0 };
      bucket.total += 1;
      if (attempt.correct) bucket.correct += 1;
      buckets.set(meta.task, bucket);
    }
    return order
      .filter((task) => buckets.has(task))
      .map((task) => {
        const bucket = buckets.get(task)!;
        return { task, rate: summarizeRate(bucket.correct, bucket.total) };
      });
  };
  return { reading: tally("reading", READING_TAREAS), listening: tally("listening", LISTENING_TAREAS) };
}

export interface VulnerableTag {
  tag: string;
  rate: number;
}

/** 2회 이상 시도했고 오답률 30% 이상인 태그 상위 2개(정답 기록까지 분모에 포함). */
export function analyzeVulnerableTags(entries: AttemptEntry[]): VulnerableTag[] {
  const stats = new Map<string, { total: number; incorrect: number }>();
  for (const { meta, attempt } of entries) {
    // 미풀이 별표(attempt 없음)는 태그 오답률 분모에 넣지 않는다.
    if (!meta || !attempt || attempt.kind === "open") continue;
    for (const tag of meta.tags) {
      const stat = stats.get(tag) ?? { total: 0, incorrect: 0 };
      stat.total += 1;
      if (!attempt.correct) stat.incorrect += 1;
      stats.set(tag, stat);
    }
  }
  return Array.from(stats.entries())
    .filter(([, stat]) => stat.total >= 2)
    .map(([tag, stat]) => ({ tag, rate: Math.round((stat.incorrect / stat.total) * 100) }))
    .filter((entry) => entry.rate >= 30)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 2);
}

/** 취약 태그 오답부터 별표까지 티어를 순서대로 채워 오래된 항목 3개를 추천한다. */
export function pickTodaysReview(entries: AttemptEntry[], vulnerableTags: VulnerableTag[]): AttemptEntry[] {
  const vulnerable = new Set(vulnerableTags.map((entry) => entry.tag));
  const recommended: AttemptEntry[] = [];
  const selected = new Set<string>();

  const fillTier = (matches: (entry: AttemptEntry) => boolean) => {
    const candidates = entries
      .filter(matches)
      .sort((a, b) => a.lastTouchedAt - b.lastTouchedAt);
    for (const entry of candidates) {
      if (recommended.length >= 3) return;
      if (selected.has(entry.itemId)) continue;
      selected.add(entry.itemId);
      recommended.push(entry);
    }
  };

  fillTier(
    (entry) =>
      entry.reasons.includes("incorrect") &&
      Boolean(entry.meta?.tags.some((tag) => vulnerable.has(tag))),
  );
  fillTier((entry) => entry.reasons.includes("incorrect"));
  fillTier((entry) => entry.reasons.includes("low-assessment"));
  fillTier((entry) => entry.reasons.includes("flagged"));

  return recommended;
}
