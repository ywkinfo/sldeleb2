"use client";

import { useState, useEffect } from "react";
import type { WritingTaskItem } from "@/lib/types";
import { Timer } from "./Timer";
import { SelfAssessment } from "./SelfAssessment";
import { useAttempts } from "./useAttempts";

export function WritingTask({ item }: { item: WritingTaskItem }) {
  const { attempts, hydrated, update } = useAttempts();
  const [localDraft, setLocalDraft] = useState<string | null>(null);

  const attempt = attempts[item.id];
  const storedDraft = attempt?.kind === "open" ? attempt.draft || "" : "";
  const draft = localDraft !== null ? localDraft : (hydrated ? storedDraft : "");

  useEffect(() => {
    if (localDraft === null) return;
    const timer = setTimeout(() => {
      if (localDraft !== storedDraft) {
        if (attempt?.kind === "open") {
          update({ ...attempt, draft: localDraft, lastAttemptedAt: Date.now() });
        } else {
          update({
            itemId: item.id,
            kind: "open",
            completed: false,
            flagged: false,
            attemptCount: 1,
            lastAttemptedAt: Date.now(),
            draft: localDraft,
          });
        }
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [localDraft, storedDraft, attempt, item.id, update]);

  const count = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  return <article className="card" id={item.id}>
    <div className="eyebrow">Expresión escrita · {item.task.replace("tarea", "Tarea ")}</div>
    <h2>쓰기 과제</h2><p className="badge warning">창작 과제 · 공식 기출 아님</p>
    <p lang="es" className="lead">{item.prompt}</p>
    <Timer minutes={item.timeLimitMin} label="쓰기" />
    <div className="field" style={{ marginTop: "1rem" }}><label htmlFor={`${item.id}-draft`}>연습 답안 — 브라우저 로컬 저장소에 자동 저장됩니다</label><textarea id={`${item.id}-draft`} lang="es" value={draft} onChange={(e) => setLocalDraft(e.target.value)} placeholder="Escribe aquí…" /><span className="muted" aria-live="polite">{count} palabras · 권장 {item.wordCount[0]}–{item.wordCount[1]} palabras</span></div>
    <div className="grid cols-2" style={{ marginTop: "1.2rem" }}><div><h3>B2 체크리스트</h3><ul className="checklist">{item.checklistKo.map((line) => <li key={line}>{line}</li>)}</ul></div><details><summary><strong>모범 개요 보기</strong></summary><div className="outline-box">{item.modelOutlineKo}</div></details></div>
    <SelfAssessment itemId={item.id} />
  </article>;
}
