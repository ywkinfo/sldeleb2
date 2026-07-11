"use client";

import { useState } from "react";
import type { ReadingMCQItem, ReadingText } from "@/lib/types";
import { gradeReadingAttempt, setAttemptFlag } from "@/lib/grading";
import { useAttempts } from "./useAttempts";
import { StorageNotice } from "./StorageNotice";

export function PracticeReading({ text, items }: { text: ReadingText; items: ReadingMCQItem[] }) {
  const { attempts, persistent, update } = useAttempts();
  const [selections, setSelections] = useState<Record<string, string>>({});
  const answer = (item: ReadingMCQItem) => {
    const selected = selections[item.id];
    if (!selected) return;
    const previous = attempts[item.id]?.kind === "reading" ? attempts[item.id] : undefined;
    update(gradeReadingAttempt(item, selected, previous));
  };
  return <article className="card" id={text.id}>
    <div className="eyebrow">Lectura · {text.task.replace("tarea", "Tarea ")}</div>
    <h2 lang="es">{text.title}</h2>
    <p className="badge warning">창작 지문 · 공식 기출 아님</p>
    <div className="passage" lang="es">{text.passage}</div>
    {items.map((item, index) => {
      const stored = attempts[item.id];
      const attempt = stored?.kind === "reading" ? stored : undefined;
      const selected = selections[item.id] ?? attempt?.selectedAnswer;
      return <section className="question" key={item.id} aria-labelledby={`${item.id}-prompt`}>
        <h3 id={`${item.id}-prompt`}>{index + 1}. <span lang="es">{item.prompt}</span></h3>
        <div className="options" role="radiogroup" aria-label={`${index + 1}번 선택지`}>
          {item.options.map((option) => <button type="button" role="radio" aria-checked={selected === option.key} className={`option ${selected === option.key ? "selected" : ""} ${attempt && option.key === item.correctAnswer ? "correct" : ""} ${attempt && selected === option.key && !attempt.correct ? "wrong" : ""}`} key={option.key} onClick={() => setSelections((prev) => ({...prev, [item.id]: option.key}))}>
            <span className="option-key">{option.key.toUpperCase()}</span><span lang="es">{option.text}</span>
          </button>)}
        </div>
        <div className="question-actions"><button className="button small" type="button" onClick={() => answer(item)} disabled={!selected}>정답 확인</button>
          {attempt && <button className="button secondary small" type="button" aria-pressed={attempt.flagged} onClick={() => update(setAttemptFlag(attempt, !attempt.flagged))}>{attempt.flagged ? "★ 다시 보기 해제" : "☆ 다시 보기"}</button>}
        </div>
        {attempt && <div className={`feedback ${attempt.correct ? "" : "incorrect"}`} role="status"><strong>{attempt.correct ? "맞았어요." : `정답은 ${item.correctAnswer.toUpperCase()}예요.`}</strong><p>{item.explanationKo}</p></div>}
      </section>;
    })}
    <StorageNotice persistent={persistent} />
  </article>;
}
