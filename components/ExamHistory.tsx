"use client";

/* Exam history is browser-local and only becomes available after hydration. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import {
  applyPendingProjection,
  getDefaultExamSessionStore,
} from "@/lib/examSession";
import { getDefaultAttemptStore } from "@/lib/progress/store";
import type { ExamSession, FinalizedExamSession } from "@/lib/types";
import { sitePath } from "@/lib/url";
import { ExamResultView } from "./ExamResultView";
import { StorageNotice } from "./StorageNotice";

export function sortExamHistorySessions(
  sessions: readonly ExamSession[],
): FinalizedExamSession[] {
  return sessions
    .filter(
      (session): session is FinalizedExamSession => session.status !== "in-progress",
    )
    .sort((a, b) => b.submittedAt - a.submittedAt);
}

export function isHistorySessionDeletable(session: FinalizedExamSession): boolean {
  return session.progressProjection.status === "complete";
}

function selectedSessionFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get("session");
}

function writeSelectedSession(sessionId: string | null, method: "push" | "replace") {
  const url = new URL(window.location.href);
  if (sessionId) url.searchParams.set("session", sessionId);
  else url.searchParams.delete("session");
  window.history[`${method}State`]({}, "", url);
}

export function ExamHistory() {
  const store = getDefaultExamSessionStore();
  const attemptStore = getDefaultAttemptStore();
  const [hydrated, setHydrated] = useState(false);
  const [sessions, setSessions] = useState<readonly ExamSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [persistent, setPersistent] = useState(true);
  const [recovered, setRecovered] = useState(false);

  useEffect(() => {
    const syncUrl = () => setSelectedId(selectedSessionFromUrl());
    const unsubscribe = store.subscribe((next) => {
      setSessions(next.snapshot.sessions);
      setPersistent(next.persistent);
      setRecovered(next.recovered);
    });
    const loaded = store.load();
    setSessions(loaded.snapshot.sessions);
    setPersistent(loaded.persistent);
    setRecovered(loaded.recovered);
    syncUrl();
    setHydrated(true);
    window.addEventListener("popstate", syncUrl);
    return () => {
      unsubscribe();
      window.removeEventListener("popstate", syncUrl);
    };
  }, [store]);

  const terminal = useMemo(() => sortExamHistorySessions(sessions), [sessions]);
  const selected = terminal.find((session) => session.id === selectedId);

  const select = (sessionId: string | null, method: "push" | "replace" = "push") => {
    writeSelectedSession(sessionId, method);
    setSelectedId(sessionId);
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  const deleteOne = (session: FinalizedExamSession) => {
    if (!isHistorySessionDeletable(session)) return;
    if (!window.confirm("이 시험 기록을 삭제할까요? 삭제 후에는 복구할 수 없습니다.")) return;
    const result = store.deleteSession(session.id);
    setPersistent(result.persistent);
    if (result.deleted && selectedId === session.id) select(null, "replace");
  };

  const deleteAll = () => {
    const count = terminal.filter(isHistorySessionDeletable).length;
    if (count === 0) return;
    if (!window.confirm(`복습 반영이 끝난 시험 기록 ${count}개를 모두 삭제할까요?`)) return;
    const result = store.deleteCompletedTerminalSessions();
    setPersistent(result.persistent);
    if (result.deleted > 0 && selected && isHistorySessionDeletable(selected)) {
      select(null, "replace");
    }
  };

  if (!hydrated) {
    return <p className="muted" aria-busy="true">시험 기록을 불러오는 중…</p>;
  }

  if (selected) {
    return (
      <div className="exam-history-detail practice-stack">
        <div className="exam-history-detail-head">
          <button className="button secondary" type="button" onClick={() => select(null)}>← 기록 목록</button>
          <div>
            <strong>{new Date(selected.submittedAt).toLocaleString("ko-KR")}</strong>
            <div className="muted">{selected.status === "expired" ? "시간 만료 자동 제출" : "제출 완료"}</div>
          </div>
          <button
            className="button secondary small"
            type="button"
            disabled={!isHistorySessionDeletable(selected)}
            title={isHistorySessionDeletable(selected) ? undefined : "복습 큐 반영 후 삭제할 수 있습니다."}
            onClick={() => deleteOne(selected)}
          >
            이 기록 삭제
          </button>
        </div>
        {!isHistorySessionDeletable(selected) && (
          <p className="storage-warning">복습 큐 반영이 끝날 때까지 이 기록은 보호됩니다.</p>
        )}
        <ExamResultView
          session={selected}
          onRetryProjection={
            selected.progressProjection.status === "pending"
              ? () => applyPendingProjection(selected, attemptStore, store)
              : undefined
          }
        />
        <StorageNotice persistent={persistent} recovered={recovered} />
      </div>
    );
  }

  return (
    <div className="practice-stack">
      <div className="exam-history-actions">
        <p className="muted">종료된 시험만 표시됩니다. 진행 중이거나 복습 반영 대기 중인 기록은 삭제 시 보호됩니다.</p>
        <button
          className="button secondary small"
          type="button"
          disabled={!terminal.some(isHistorySessionDeletable)}
          onClick={deleteAll}
        >
          완료 기록 모두 삭제
        </button>
      </div>
      {terminal.length === 0 ? (
        <div className="content-group">
          <h2>아직 완료한 모의고사가 없습니다.</h2>
          <p className="muted">읽기나 듣기 모의고사를 제출하면 이곳에서 문항별 결과를 다시 볼 수 있습니다.</p>
          <a className="button" href={sitePath("/exam")}>모의고사 선택</a>
        </div>
      ) : (
        <div className="exam-history-list" aria-label="종료된 모의고사 기록">
          {terminal.map((session) => (
            <a
              className="exam-history-row"
              key={session.id}
              href={sitePath(`/exam/history?session=${encodeURIComponent(session.id)}`)}
              onClick={(event) => {
                event.preventDefault();
                select(session.id);
              }}
            >
              <div>
                <span className="eyebrow">{session.blueprintId.includes("reading") ? "읽기" : "듣기"}</span>
                <h2>{session.result.correct} / {session.result.total} 정답</h2>
                <p className="muted">
                  {new Date(session.submittedAt).toLocaleString("ko-KR")} · {session.status === "expired" ? "시간 만료" : "제출 완료"}
                </p>
              </div>
              <span aria-hidden="true">결과 보기 →</span>
            </a>
          ))}
        </div>
      )}
      <StorageNotice persistent={persistent} recovered={recovered} />
    </div>
  );
}
