"use client";

import { useState } from "react";
import type { OpenAttempt } from "@/lib/types";
import { completeOpenAttemptWithRubric } from "@/lib/grading";
import { useAttempts } from "@/hooks/useAttempts";
import { StorageNotice } from "./StorageNotice";
import { DIMENSIONS_WRITING, DIMENSIONS_SPEAKING, DIMENSION_LABELS, type RubricScore, type RubricScores } from "@/lib/rubric";

const SCORE_MEANINGS: Record<RubricScore, string> = {
  1: "다시 연습 필요",
  2: "대체로 부합",
  3: "자신 있게 수행",
};

export function SelfAssessment({ itemId, skill }: { itemId: string, skill: "writing" | "speaking" }) {
  const { attempts, pendingFlags, persistent, recovered, update, setPendingFlag, hydrated } = useAttempts();
  const current = attempts[itemId]?.kind === "open" ? attempts[itemId] as OpenAttempt : undefined;
  // 평가·초안 저장 전에는 pendingFlags, attempt가 생긴 뒤에는 attempt.flagged가 진실이다.
  const flagged = current ? current.flagged : pendingFlags[itemId] !== undefined;
  
  const dimensions = skill === "writing" ? DIMENSIONS_WRITING : DIMENSIONS_SPEAKING;
  
  const [selections, setSelections] = useState<Record<string, RubricScore>>({});
  const [prevCurrent, setPrevCurrent] = useState(current);

  if (hydrated && current !== prevCurrent) {
    setPrevCurrent(current);
    if (current?.completed && current.rubricScores) {
      setSelections(current.rubricScores as unknown as Record<string, RubricScore>);
    }
  }

  const isComplete = dimensions.every(d => selections[d] !== undefined);

  const handleSave = () => {
    if (!isComplete) return;
    update(completeOpenAttemptWithRubric(itemId, skill, selections as unknown as RubricScores, current));
  };

  const handleScore = (dim: string, score: RubricScore) => {
    setSelections(prev => ({ ...prev, [dim]: score }));
  };

  return <div>
    <h3>자가점검</h3>
    <p className="muted" style={{ marginBottom: "1rem" }}>공식 점수나 합격 예측이 아닌, 다음 복습을 위한 나만의 기록입니다.</p>

    <div className="rubric-scale-legend" aria-label="자가점검 점수 기준">
      {([1, 2, 3] as RubricScore[]).map((score) => (
        <span key={score}>
          <strong>{score}</strong>
          <span>{SCORE_MEANINGS[score]}</span>
        </span>
      ))}
    </div>
    
    <div className="rubric-grid">
      {dimensions.map(dim => (
        <fieldset key={dim} className="rubric-row">
          <legend><strong>{DIMENSION_LABELS[dim] ?? dim}</strong></legend>
          <div className="score-group">
            {([1, 2, 3] as RubricScore[]).map((score) => (
              <button
                key={score}
                className="score-button"
                type="button"
                aria-label={`${DIMENSION_LABELS[dim] ?? dim} · ${score}점 · ${SCORE_MEANINGS[score]}`}
                aria-pressed={selections[dim] === score}
                onClick={() => handleScore(dim, score)}
              >
                <strong aria-hidden="true">{score}</strong>
              </button>
            ))}
          </div>
        </fieldset>
      ))}
    </div>

    <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
      <button className="button" type="button" disabled={!isComplete} onClick={handleSave}>
        평가 저장
      </button>
      {current?.completed && (
        <span className="muted" style={{ marginLeft: "0.5rem" }}>
          평균 {current.selfScore}/3 · {current.attemptCount}회 평가됨
        </span>
      )}
    </div>

    {/* 제출 전 별표: 평가 기록이 없어도 표시한다. hydration 전에는 저장된 별표를 반대로 뒤집지 않도록 잠근다. */}
    <p style={{ marginTop: "1.2rem" }}><button className="button secondary small" type="button" aria-pressed={flagged} disabled={!hydrated} onClick={() => setPendingFlag(itemId, !flagged)}>{flagged ? "★ 다시 보기 해제" : "☆ 다시 보기"}</button></p>
    <StorageNotice persistent={persistent} recovered={recovered} />
  </div>;
}
