"use client";

import { useState } from "react";
import type { ReadingMCQItem, ListeningMCQItem } from "@/lib/types";
import { gradeMcqAttempt, setAttemptFlag } from "@/lib/grading";
import { useAttempts } from "./useAttempts";

export function McqQuestion({
  item,
  number,
}: {
  item: ReadingMCQItem | ListeningMCQItem;
  number: number;
}) {
  const { attempts, update } = useAttempts();
  const stored = attempts[item.id];
  const attempt = stored?.kind === item.skill ? stored : undefined;

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select, audio")) return;

    const letterIndex = /^Key[A-Z]$/.test(event.code) ? event.code.charCodeAt(3) - 65 : -1;
    if (letterIndex >= 0 && letterIndex < item.options.length) {
      event.preventDefault();
      if (isAnswering) {
        setLocalSelection(item.options[letterIndex].key);
      }
      return;
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      if (!isAnswering) return;
      const optionsNodes = Array.from(event.currentTarget.querySelectorAll('[role="radio"]')) as HTMLElement[];
      const currentIndex = currentSelection ? item.options.findIndex(o => o.key === currentSelection) : 0;
      let nextIndex = currentIndex;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % item.options.length;
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + item.options.length) % item.options.length;
      }
      event.preventDefault();
      setLocalSelection(item.options[nextIndex].key);
      optionsNodes[nextIndex]?.focus();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      const isOption = target.getAttribute("role") === "radio";
      if (isOption) {
        if (event.key === " ") {
          event.preventDefault();
          if (isAnswering) setLocalSelection(target.getAttribute("data-key") || undefined);
        }
        return; // Enter는 native click을 발생시킴
      }
      if (target.closest(".question-actions")) return;
      event.preventDefault();
      if (isAnswering) answer();
    }
  };

  const lastChar = String.fromCharCode(65 + item.options.length - 1);
  const shortcutHint = `단축키: A–${lastChar} 선택 · ↑↓ 이동 · Enter 확인`;

  return (
    <section className="question" id={item.id} aria-labelledby={`${item.id}-prompt`} onKeyDown={handleKeyDown}>
      <h3 id={`${item.id}-prompt`}>{number}. <span lang="es">{item.prompt}</span></h3>
      
      <div className="options" role="radiogroup" aria-label={`${number}번 선택지`}>
        {item.options.map((option, index) => {
          const isSelected = currentSelection === option.key;
          const isCorrect = isLocked && option.key === item.correctAnswer;
          const isWrong = isLocked && !attempt?.correct && isSelected && option.key !== item.correctAnswer;
          const isTabable = isSelected || (!currentSelection && index === 0);

          return (
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isTabable ? 0 : -1}
              disabled={isLocked}
              data-key={option.key}
              className={`option ${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
              key={option.key}
              onClick={() => {
                if (isAnswering) setLocalSelection(option.key);
              }}
            >
              <span className="option-key">{option.key.toUpperCase()}</span>
              <span lang="es">{option.text}</span>
              {isCorrect && <span className="option-state is-correct">✓ 정답</span>}
              {isWrong && <span className="option-state is-wrong">✕ 내 선택</span>}
            </button>
          );
        })}
      </div>

      <div className="question-actions">
        {isAnswering ? (
          <button className="button small" type="button" onClick={answer} disabled={!currentSelection}>정답 확인</button>
        ) : (
          <>
            <button className="button secondary small" type="button" onClick={() => {
              setRetrying(true);
              setLocalSelection(undefined);
            }}>다시 풀기</button>
            <button className="button secondary small" type="button" aria-pressed={attempt?.flagged} onClick={() => update(setAttemptFlag(attempt!, !attempt?.flagged))}>
              {attempt?.flagged ? "★ 다시 보기 해제" : "☆ 다시 보기"}
            </button>
          </>
        )}
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
