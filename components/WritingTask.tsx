"use client";

import { useState } from "react";
import type { WritingTaskItem } from "@/lib/types";
import { Timer } from "./Timer";
import { SelfAssessment } from "./SelfAssessment";

export function WritingTask({ item }: { item: WritingTaskItem }) {
  const [draft, setDraft] = useState("");
  const count = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  return <article className="card" id={item.id}>
    <div className="eyebrow">Expresión escrita · {item.task.replace("tarea", "Tarea ")}</div>
    <h2>쓰기 과제</h2><p className="badge warning">창작 과제 · 공식 기출 아님</p>
    <p lang="es" className="lead">{item.prompt}</p>
    <Timer minutes={item.timeLimitMin} label="쓰기" />
    <div className="field" style={{ marginTop: "1rem" }}><label htmlFor={`${item.id}-draft`}>연습 답안 — 브라우저를 닫으면 사라집니다</label><textarea id={`${item.id}-draft`} lang="es" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Escribe aquí…" /><span className="muted" aria-live="polite">{count} palabras · 권장 {item.wordCount[0]}–{item.wordCount[1]} palabras</span></div>
    <div className="grid cols-2" style={{ marginTop: "1.2rem" }}><div><h3>B2 체크리스트</h3><ul className="checklist">{item.checklistKo.map((line) => <li key={line}>{line}</li>)}</ul></div><details><summary><strong>모범 개요 보기</strong></summary><div className="outline-box">{item.modelOutlineKo}</div></details></div>
    <SelfAssessment itemId={item.id} />
  </article>;
}
