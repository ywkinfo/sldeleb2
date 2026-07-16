"use client";

import { useState } from "react";
import type {
  ReadingMCQItem,
  ReadingPresentationContract,
  ReadingText,
} from "@/lib/types";
import { gradeMcqAttempt, setAttemptFlag } from "@/lib/grading";
import { useAttempts } from "./useAttempts";
import { StorageNotice } from "./StorageNotice";
import { McqQuestion } from "./McqQuestion";
import {
  getReadingPresentationKind,
  ReadingPresentation,
  type ReadingPresentationItemState,
} from "./ReadingPresentation";
import { ReadingWorkspace } from "./ReadingWorkspace";

export function PracticeReading({
  text,
  items,
  numberByItemId,
  presentation,
}: {
  text: ReadingText;
  items: ReadingMCQItem[];
  numberByItemId: Record<string, number>;
  presentation?: ReadingPresentationContract;
}) {
  const { attempts, persistent, recovered, update } = useAttempts();
  const [localSelections, setLocalSelections] = useState<Record<string, string | undefined>>({});
  const [retryingItemIds, setRetryingItemIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const retry = (itemId: string) => {
    setRetryingItemIds((current) => new Set(current).add(itemId));
    setLocalSelections((current) => ({ ...current, [itemId]: undefined }));
  };

  const answer = (item: ReadingMCQItem) => {
    const selection = localSelections[item.id];
    if (!selection) return;
    const stored = attempts[item.id];
    const previous = stored?.kind === "reading" ? stored : undefined;
    update(gradeMcqAttempt(item, selection, previous));
    setRetryingItemIds((current) => {
      const next = new Set(current);
      next.delete(item.id);
      return next;
    });
  };

  const stateByItemId = Object.fromEntries(
    items.map((item) => {
      const stored = attempts[item.id];
      const attempt = stored?.kind === "reading" ? stored : undefined;
      const locked = attempt !== undefined && !retryingItemIds.has(item.id);
      const state: ReadingPresentationItemState = {
        value: locked ? attempt.selectedAnswer : localSelections[item.id],
        disabled: locked,
        result: locked
          ? { correct: attempt.correct, correctAnswer: item.correctAnswer }
          : undefined,
      };
      return [item.id, state];
    }),
  );

  const customPresentation = presentation && presentation.kind !== "mcq"
    ? presentation
    : undefined;

  return <article className="card" id={text.id}>
    <div className="eyebrow">Lectura · {text.task.replace("tarea", "Tarea ")}</div>
    <p className="badge warning">창작 지문 · 공식 기출 아님</p>
    {getReadingPresentationKind(presentation) === "mcq" || !customPresentation ? (
      <ReadingWorkspace title={text.title} titleId={`${text.id}-title`} passage={text.passage}>
        {items.map((item) => (
          <McqQuestion key={item.id} item={item} number={numberByItemId[item.id]} />
        ))}
        <StorageNotice persistent={persistent} recovered={recovered} />
      </ReadingWorkspace>
    ) : (
      <ReadingPresentation
        presentation={customPresentation}
        title={text.title}
        titleId={`${text.id}-title`}
        passage={text.passage}
        items={items}
        numberForItem={(itemId) => numberByItemId[itemId] ?? 0}
        stateByItemId={stateByItemId}
        onSelect={(itemId, key) =>
          setLocalSelections((current) => ({ ...current, [itemId]: key }))
        }
        renderItemSupplement={(renderedItem) => {
          const item = items.find((candidate) => candidate.id === renderedItem.id);
          if (!item) return null;
          const stored = attempts[item.id];
          const attempt = stored?.kind === "reading" ? stored : undefined;
          const locked = attempt !== undefined && !retryingItemIds.has(item.id);
          const selection = stateByItemId[item.id]?.value;
          return (
            <>
              <div className="question-actions">
                {locked ? (
                  <>
                    <button className="button secondary small" type="button" onClick={() => retry(item.id)}>
                      다시 풀기
                    </button>
                    <button
                      className="button secondary small"
                      type="button"
                      aria-pressed={attempt.flagged}
                      onClick={() => update(setAttemptFlag(attempt, !attempt.flagged))}
                    >
                      {attempt.flagged ? "★ 다시 보기 해제" : "☆ 다시 보기"}
                    </button>
                  </>
                ) : (
                  <button
                    className="button small"
                    type="button"
                    onClick={() => answer(item)}
                    disabled={!selection}
                  >
                    정답 확인
                  </button>
                )}
              </div>
              {!locked && (
                <div className="muted presentation-shortcut-hint">
                  선택지 문자키 또는 방향키로 선택한 뒤 정답을 확인하세요.
                </div>
              )}
              {locked && attempt && (
                <div className={`feedback ${attempt.correct ? "" : "incorrect"}`} role="status">
                  <strong>{attempt.correct ? "맞았어요." : `정답은 ${item.correctAnswer.toUpperCase()}예요.`}</strong>
                  <p>{item.explanationKo}</p>
                </div>
              )}
            </>
          );
        }}
      />
    )}
    {customPresentation && (
      <StorageNotice persistent={persistent} recovered={recovered} />
    )}
  </article>;
}
