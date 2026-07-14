"use client";

import { useMemo, useState } from "react";
import {
  filterReviewEntries,
  collectReviewTags,
  EMPTY_REVIEW_FILTER,
  REVIEW_REASON_LABELS,
  REVIEW_SKILL_LABELS,
  type AttemptEntry,
  type ReviewFilter,
  type ReviewReason,
} from "@/lib/review";
import { sitePath } from "@/lib/url";
import { getSetIdForItem } from "@/lib/sets";
import { calculateRubricStats, DIMENSION_LABELS } from "@/lib/rubric";
import type { PracticeSkill } from "@/lib/types";

const SKILL_ORDER: PracticeSkill[] = ["reading", "listening", "writing", "speaking"];
const REASON_ORDER: ReviewReason[] = ["incorrect", "low-assessment", "flagged"];

function weakDimensionLabel(entry: AttemptEntry): string {
  const { attempt, meta } = entry;
  if (attempt.kind !== "open" || !attempt.completed || !attempt.rubricScores || !meta) return "";
  const stats = calculateRubricStats(meta.skill === "writing" ? "writing" : "speaking", attempt.rubricScores);
  if (stats.weakestDimensions.length === 0) return "";
  const first = DIMENSION_LABELS[stats.weakestDimensions[0]] ?? stats.weakestDimensions[0];
  return stats.weakestDimensions.length > 1 ? `취약: ${first} 외 ${stats.weakestDimensions.length - 1}개` : `취약: ${first}`;
}

function statusLine(entry: AttemptEntry): string {
  const { attempt } = entry;
  if (attempt.kind === "open") {
    if (!attempt.completed) return `미완료 · ${attempt.attemptCount}회 시도`;
    const weak = weakDimensionLabel(entry);
    return `자기평가 ${attempt.selfScore}/3${weak ? ` · ${weak}` : ""} · ${attempt.attemptCount}회 시도`;
  }
  return `${attempt.correct ? "정답" : "오답"} · ${attempt.attemptCount}회 시도`;
}

export function ReviewQueue({ entries, onRemove }: { entries: AttemptEntry[]; onRemove: (itemId: string) => void }) {
  const [filter, setFilter] = useState<ReviewFilter>(EMPTY_REVIEW_FILTER);
  const tagOptions = useMemo(() => collectReviewTags(entries), [entries]);
  // 선택했던 태그가 대기열에서 사라지면(기록 삭제 등) 필터를 자동으로 '전체'로 되돌린다.
  const effectiveTag = filter.tag !== "all" && !tagOptions.includes(filter.tag) ? "all" : filter.tag;
  const effectiveFilter: ReviewFilter = { ...filter, tag: effectiveTag };
  const filtered = filterReviewEntries(entries, effectiveFilter);

  if (entries.length === 0) {
    return <div className="card flat" style={{ marginTop: "1.2rem" }}><h2>전체 복습 대기열</h2>
      <p className="muted">아직 복습할 문항이 없어요. 연습에서 틀린 문항이나 별표 표시한 과제가 여기에 모입니다.</p>
      <a className="button" href={sitePath("/practice")}>연습 시작</a>
    </div>;
  }

  return <div className="card flat" style={{ marginTop: "1.2rem" }}><h2>전체 복습 대기열</h2>
    <div className="filters" role="group" aria-label="복습 대기열 필터">
      <div className="field"><label htmlFor="review-filter-skill">영역</label><select id="review-filter-skill" value={filter.skill} onChange={(e) => setFilter((f) => ({ ...f, skill: e.target.value as ReviewFilter["skill"] }))}><option value="all">모든 영역</option>{SKILL_ORDER.map((skill) => <option key={skill} value={skill}>{REVIEW_SKILL_LABELS[skill]}</option>)}</select></div>
      <div className="field"><label htmlFor="review-filter-reason">사유</label><select id="review-filter-reason" value={filter.reason} onChange={(e) => setFilter((f) => ({ ...f, reason: e.target.value as ReviewFilter["reason"] }))}><option value="all">모든 사유</option>{REASON_ORDER.map((reason) => <option key={reason} value={reason}>{REVIEW_REASON_LABELS[reason]}</option>)}</select></div>
      <div className="field"><label htmlFor="review-filter-tag">태그</label><select id="review-filter-tag" value={effectiveTag} onChange={(e) => setFilter((f) => ({ ...f, tag: e.target.value }))}><option value="all">모든 태그</option>{tagOptions.map((tag) => <option key={tag} value={tag}>{tag}</option>)}</select></div>
    </div>
    <p className="result-count" role="status">문항 {filtered.length}개</p>
    {filtered.length ? <div className="review-list">{filtered.map((entry) => {
      const itemId = entry.attempt.itemId;
      const setId = getSetIdForItem(itemId);
      const targetUrl = setId ? sitePath(`/practice/set/${setId}#${itemId}`) : sitePath("/practice");
      return <div className="review-row" key={itemId}>
        <div>
          <strong>{entry.meta?.label ?? "알 수 없는 문항"}</strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", margin: ".4rem 0" }}>{entry.reasons.map((reason) => <span key={reason} className={`badge${reason === "flagged" ? "" : " warning"}`}>{REVIEW_REASON_LABELS[reason]}</span>)}</div>
          <div className="muted">{statusLine(entry)}</div>
        </div>
        <div className="question-actions">
          <a className="button small" href={targetUrl}>다시 연습</a>
          <button className="button secondary small" type="button" onClick={() => { if (window.confirm("이 문항의 학습 기록을 삭제할까요? 삭제한 기록은 되돌릴 수 없습니다.")) onRemove(itemId); }}>기록 삭제</button>
        </div>
      </div>;
    })}</div> : <div><p className="muted">조건에 맞는 문항이 없어요.</p><button className="button secondary small" type="button" onClick={() => setFilter(EMPTY_REVIEW_FILTER)}>필터 초기화</button></div>}
  </div>;
}
