"use client";

import { useState, useEffect } from "react";
import type { OpenAttempt } from "@/lib/types";
import { completeOpenAttemptWithRubric, setAttemptFlag } from "@/lib/grading";
import { useAttempts } from "./useAttempts";
import { StorageNotice } from "./StorageNotice";
import { DIMENSIONS_WRITING, DIMENSIONS_SPEAKING, DIMENSION_LABELS, type RubricScore, type RubricScores } from "@/lib/rubric";

export function SelfAssessment({ itemId, skill }: { itemId: string, skill: "writing" | "speaking" }) {
  const { attempts, persistent, update, hydrated } = useAttempts();
  const current = attempts[itemId]?.kind === "open" ? attempts[itemId] as OpenAttempt : undefined;
  
  const dimensions = skill === "writing" ? DIMENSIONS_WRITING : DIMENSIONS_SPEAKING;
  
  const [selections, setSelections] = useState<Record<string, RubricScore>>({});
  
  useEffect(() => {
    if (hydrated && current?.completed && current.rubricScores) {
      setSelections(current.rubricScores as unknown as Record<string, RubricScore>);
    }
  }, [hydrated, current?.completed, current?.rubricScores]);

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
    
    <div className="rubric-grid">
      {dimensions.map(dim => (
        <fieldset key={dim} className="rubric-row">
          <legend><strong>{DIMENSION_LABELS[dim] ?? dim}</strong></legend>
          <div className="score-group">
            <button className="score-button" type="button" aria-pressed={selections[dim] === 1} onClick={() => handleScore(dim, 1)}>
              <strong>1</strong><br />다시 연습 필요
            </button>
            <button className="score-button" type="button" aria-pressed={selections[dim] === 2} onClick={() => handleScore(dim, 2)}>
              <strong>2</strong><br />대체로 부합
            </button>
            <button className="score-button" type="button" aria-pressed={selections[dim] === 3} onClick={() => handleScore(dim, 3)}>
              <strong>3</strong><br />자신 있게 수행
            </button>
          </div>
        </fieldset>
      ))}
    </div>

    <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
      <button className="button primary" type="button" disabled={!isComplete} onClick={handleSave}>
        평가 저장
      </button>
      {current?.completed && (
        <span className="muted" style={{ marginLeft: "0.5rem" }}>
          평균 {current.selfScore}/3 · {current.attemptCount}회 평가됨
        </span>
      )}
    </div>

    {current && <p style={{ marginTop: "1.2rem" }}><button className="button secondary small" type="button" aria-pressed={current.flagged} onClick={() => update(setAttemptFlag(current, !current.flagged))}>{current.flagged ? "★ 다시 보기 해제" : "☆ 다시 보기"}</button></p>}
    <StorageNotice persistent={persistent} />
  </div>;
}
