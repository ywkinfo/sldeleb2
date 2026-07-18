"use client";

import { useState } from "react";
import type { ReadingMCQItem, ListeningMCQItem } from "@/lib/types";
import { gradeMcqAttempt } from "@/lib/grading";
import { useAttempts } from "./useAttempts";
import { McqOptions, handleMcqKeyDown, type McqOptionState } from "./McqOptions";

export function McqQuestion({
  item,
  number,
}: {
  item: ReadingMCQItem | ListeningMCQItem;
  number: number;
}) {
  const { attempts, pendingFlags, update, setPendingFlag, hydrated } = useAttempts();
  const stored = attempts[item.id];
  const attempt = stored?.kind === item.skill ? stored : undefined;
  // 채점 전에는 pendingFlags, 채점 후에는 attempt.flagged가 진실이다.
  const flagged = attempt ? attempt.flagged : pendingFlags[item.id] !== undefined;

  const [localSelection, setLocalSelection] = useState<string | undefined>();
  const [retrying, setRetrying] = useState(false);

  const isLocked = attempt !== undefined && !retrying;
  const isAnswering = !isLocked;

  const currentSelection = isAnswering ? localSelection : attempt?.selectedAnswer;

  const answer = () => {
    if (!currentSelection) return;
    update(gradeMcqAttempt(item, currentSelection, attempt));
    setRetrying(false);
  };

  const stateByKey: Partial<Record<string, McqOptionState>> = {};
  if (isLocked) {
    stateByKey[item.correctAnswer] = "correct";
    if (!attempt?.correct && currentSelection && currentSelection !== item.correctAnswer) {
      stateByKey[currentSelection] = "wrong";
    }
  }

  const lastChar = String.fromCharCode(65 + item.options.length - 1);
  const shortcutHint = `단축키: A–${lastChar} 선택 · ↑↓ 이동 · Enter 확인`;

  return (
    <section
      className="question"
      id={item.id}
      aria-labelledby={`${item.id}-prompt`}
      onKeyDown={(event) =>
        handleMcqKeyDown(event, {
          options: item.options,
          canSelect: isAnswering,
          currentKey: currentSelection,
          onSelect: setLocalSelection,
          onSubmit: answer,
        })
      }
    >
      <h3 id={`${item.id}-prompt`}>{number}. <span lang="es">{item.prompt}</span></h3>

      <McqOptions
        options={item.options}
        ariaLabel={`${number}번 선택지`}
        value={currentSelection}
        disabled={isLocked}
        onSelect={setLocalSelection}
        stateByKey={stateByKey}
      />

      <div className="question-actions">
        {isAnswering ? (
          <button className="button small" type="button" onClick={answer} disabled={!currentSelection}>정답 확인</button>
        ) : (
          <button className="button secondary small" type="button" onClick={() => {
            setRetrying(true);
            setLocalSelection(undefined);
          }}>다시 풀기</button>
        )}
        {/* 제출 전 별표: hydration 전에는 저장된 별표를 반대로 뒤집지 않도록 잠근다. */}
        <button
          className="button secondary small"
          type="button"
          aria-pressed={flagged}
          disabled={!hydrated}
          onClick={() => setPendingFlag(item.id, !flagged)}
        >
          {flagged ? "★ 다시 보기 해제" : "☆ 다시 보기"}
        </button>
      </div>

      {isAnswering && <div className="muted" style={{ fontSize: "0.82rem", marginTop: "0.6rem" }}>{shortcutHint}</div>}

      {isLocked && attempt && (
        <div className={`feedback ${attempt.correct ? "" : "incorrect"}`} role="status">
          <strong>{attempt.correct ? "맞았어요." : `정답은 ${item.correctAnswer.toUpperCase()}예요.`}</strong>
          <p>{item.explanationKo}</p>
        </div>
      )}
    </section>
  );
}
