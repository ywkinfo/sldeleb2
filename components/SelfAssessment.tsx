"use client";

import type { OpenAttempt } from "@/lib/types";
import { completeOpenAttempt, setAttemptFlag } from "@/lib/grading";
import { useAttempts } from "./useAttempts";
import { StorageNotice } from "./StorageNotice";

const scores = [
  [1, "다시 연습 필요"],
  [2, "B2 기준에 대체로 부합"],
  [3, "자신 있게 수행"],
] as const;

export function SelfAssessment({ itemId }: { itemId: string }) {
  const { attempts, persistent, update } = useAttempts();
  const current = attempts[itemId]?.kind === "open" ? attempts[itemId] as OpenAttempt : undefined;
  return <div>
    <h3>자가점검</h3><p className="muted">공식 점수나 합격 예측이 아닌, 다음 복습을 위한 나만의 기록입니다.</p>
    <div className="score-group">{scores.map(([score,label]) => <button className="score-button" type="button" key={score} aria-pressed={current?.completed === true && current.selfScore === score} onClick={() => update(completeOpenAttempt(itemId, score, current))}><strong>{score}</strong><br />{label}</button>)}</div>
    {current && <p><button className="button secondary small" type="button" aria-pressed={current.flagged} onClick={() => update(setAttemptFlag(current, !current.flagged))}>{current.flagged ? "★ 다시 보기 해제" : "☆ 다시 보기"}</button></p>}
    <StorageNotice persistent={persistent} />
  </div>;
}
