"use client";

import { useState } from "react";
import type { ListeningMCQItem, ListeningScript } from "@/lib/types";
import { gradeListeningAttempt, setAttemptFlag } from "@/lib/grading";
import { useAttempts } from "./useAttempts";
import { StorageNotice } from "./StorageNotice";

export function PracticeListening({ script, items }: { script: ListeningScript; items: ListeningMCQItem[] }) {
  const { attempts, persistent, update } = useAttempts();
  const [selections, setSelections] = useState<Record<string, string>>({});
  const answer = (item: ListeningMCQItem) => {
    const selected = selections[item.id];
    if (!selected) return;
    const previous = attempts[item.id]?.kind === "listening" ? attempts[item.id] : undefined;
    update(gradeListeningAttempt(item, selected, previous));
  };
  return <article className="card" id={script.id}>
    <div className="eyebrow">Audición · {script.task.replace("tarea", "Tarea ")}</div>
    <h2 lang="es">{script.title}</h2>
    <p className="badge warning">창작 스크립트 · 합성 음성(TTS) · 공식 기출 아님</p>
    <audio controls preload="metadata" src={script.audioSrc}>이 브라우저는 오디오 재생을 지원하지 않습니다.</audio>
    <details className="transcript">
      <summary>대본 보기 — 먼저 듣고 문제를 푼 뒤 확인하세요</summary>
      <div className="passage" lang="es">{script.transcript}</div>
    </details>
    {items.map((item, index) => {
      const stored = attempts[item.id];
      const attempt = stored?.kind === "listening" ? stored : undefined;
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
