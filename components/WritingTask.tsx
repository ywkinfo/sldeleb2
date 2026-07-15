"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { WritingTaskItem } from "@/lib/types";
import { Timer } from "./Timer";
import { SelfAssessment } from "./SelfAssessment";
import { useAttempts } from "./useAttempts";

const AUTOSAVE_DELAY_MS = 1500;

export function WritingTask({ item }: { item: WritingTaskItem }) {
  const { attempts, hydrated, persistent, update } = useAttempts();
  const [localDraft, setLocalDraft] = useState<string | null>(null);

  const attempt = attempts[item.id];
  const storedDraft = attempt?.kind === "open" ? attempt.draft || "" : "";
  const draft = localDraft !== null ? localDraft : (hydrated ? storedDraft : "");

  // 이벤트 핸들러·이탈 cleanup이 stale closure 없이 최신값을 저장하도록 ref에 동기화.
  // (ref 쓰기는 렌더가 아니라 effect에서 — react-hooks/refs 규칙 준수.)
  const latest = useRef({ localDraft, storedDraft, attempt });
  useEffect(() => {
    latest.current = { localDraft, storedDraft, attempt };
  });

  // 현재 초안이 저장본과 다르면 즉시 저장한다. update는 안정적이고 store가 동기
  // 저장하므로 언마운트 도중 호출돼도 초안은 유실되지 않는다.
  const flush = useCallback(() => {
    const { localDraft: current, storedDraft: stored, attempt: prev } = latest.current;
    if (current === null || current === stored) return;
    if (prev?.kind === "open") {
      update({ ...prev, draft: current, lastAttemptedAt: Date.now() });
    } else {
      update({
        itemId: item.id,
        kind: "open",
        completed: false,
        flagged: false,
        attemptCount: 1,
        lastAttemptedAt: Date.now(),
        draft: current,
      });
    }
  }, [item.id, update]);

  // 디바운스 자동저장 — 마지막 입력 1.5초 뒤 저장.
  useEffect(() => {
    if (localDraft === null || localDraft === storedDraft) return;
    const timer = setTimeout(flush, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [localDraft, storedDraft, flush]);

  // 이탈 시 즉시 flush. 언마운트(SPA 이동)·pagehide(전체 이동)·백그라운드 전환에서
  // 디바운스 대기분이 유실되지 않도록 한다. flush가 안정적이라 리스너는 1회만 등록된다.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
  }, [flush]);

  const count = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const [minWords, maxWords] = item.wordCount;
  const wcState = count === 0 ? "idle" : count < minWords ? "under" : count > maxWords ? "over" : "ok";
  const wcLabel = {
    idle: `권장 ${minWords}–${maxWords} palabras`,
    under: `권장 ${minWords}–${maxWords} · ${minWords - count} palabras 부족`,
    ok: `권장 범위 안 (${minWords}–${maxWords})`,
    over: `권장 ${minWords}–${maxWords} · ${count - maxWords} palabras 초과`,
  }[wcState];

  // 저장 상태 — 편집 전에는 표시 안 함. 영속 저장 실패 시 "저장됨"으로 오인시키지 않는다.
  const saveStatus =
    localDraft === null
      ? null
      : localDraft !== storedDraft
        ? "저장 중…"
        : persistent
          ? "저장됨"
          : "임시 저장됨 · 창을 닫으면 사라집니다";
  return <article className="card" id={item.id}>
    <div className="eyebrow">Expresión escrita · {item.task.replace("tarea", "Tarea ")}</div>
    <h2>쓰기 과제</h2><p className="badge warning">창작 과제 · 공식 기출 아님</p>
    <p lang="es" className="lead">{item.prompt}</p>
    <Timer minutes={item.timeLimitMin} label="쓰기" />
    <div className="field" style={{ marginTop: "1rem" }}><label htmlFor={`${item.id}-draft`}>연습 답안 — 브라우저 로컬 저장소에 자동 저장됩니다</label><textarea id={`${item.id}-draft`} lang="es" value={draft} onChange={(e) => setLocalDraft(e.target.value)} onBlur={() => flush()} placeholder="Escribe aquí…" /><span className={`wordcount ${wcState === "ok" ? "ok" : wcState === "idle" ? "" : "out"}`} aria-live="polite">{count} palabras · {wcLabel}{saveStatus ? ` · ${saveStatus}` : ""}</span></div>
    <div className="grid cols-2" style={{ marginTop: "1.2rem" }}><div><h3>B2 체크리스트</h3><ul className="checklist">{item.checklistKo.map((line) => <li key={line}>{line}</li>)}</ul></div><div><details><summary><strong>모범 개요 보기</strong></summary><div className="outline-box">{item.modelOutlineKo}</div></details><details style={{ marginTop: ".6rem" }}><summary><strong>모범답안 · <span lang="es">español</span></strong></summary><div className="passage outline-box" lang="es">{item.modelAnswerEs}</div></details></div></div>
    <SelfAssessment itemId={item.id} skill="writing" />
  </article>;
}
