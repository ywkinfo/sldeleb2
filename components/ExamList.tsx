"use client";

/* Exam state is read from the browser only after hydration, then kept in sync by the store subscription. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import type { ExamSession, FinalizedExamSession } from "@/lib/types";
import { findActiveSession, findNextInProgressDeadline } from "@/lib/exam/session";
import { getDefaultExamSessionStore } from "@/lib/exam/store";
import { examBlueprints } from "@/data/examBlueprints";
import { practiceSets } from "@/data/practiceSets";
import { sitePath } from "@/lib/url";
import { EXAM_SKILL_COPY } from "@/lib/examCopy";

// 목록 카드는 세트 크기만 필요하다. snapshotBlueprint를 호출하면 읽기 지문 전문이
// 목록 client bundle로 끌려오므로, itemIds 길이로만 문항 수를 계산한다.
const setById = new Map(practiceSets.map((set) => [set.id, set]));

export function ExamList() {
  const store = getDefaultExamSessionStore();
  const [hydrated, setHydrated] = useState(false);
  const [sessions, setSessions] = useState<readonly ExamSession[]>([]);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = store.subscribe((next) => setSessions(next.snapshot.sessions));
    setSessions(store.load().snapshot.sessions);
    setNow(Date.now());
    setHydrated(true);
    return unsubscribe;
  }, [store]);

  useEffect(() => {
    if (now === null) return;
    const deadline = findNextInProgressDeadline(sessions, now);
    if (deadline === undefined) return;
    const delay = Math.min(
      Math.max(0, deadline - Date.now() + 25),
      2_147_483_647,
    );
    const timer = window.setTimeout(() => setNow(Date.now()), delay);
    return () => window.clearTimeout(timer);
  }, [sessions, now]);

  return (
    <div className="practice-stack">
      <div className="exam-list-actions">
        <a className="button secondary" href={sitePath("/exam/history")}>전체 시험 기록</a>
      </div>
      {examBlueprints.map((blueprint) => {
        const totalItems = blueprint.sections.reduce(
          (sum, section) => sum + (setById.get(section.setId)?.itemIds.length ?? 0),
          0,
        );
        const copy = EXAM_SKILL_COPY[blueprint.skill];
        const active = hydrated ? findActiveSession(sessions, blueprint.id) : undefined;
        const expired = active !== undefined && now !== null && active.deadlineAt <= now;
        const recent = hydrated
          ? sessions
              .filter(
                (candidate): candidate is FinalizedExamSession =>
                  candidate.status !== "in-progress" && candidate.blueprintId === blueprint.id,
              )
              .sort((a, b) => b.submittedAt - a.submittedAt)
              .slice(0, 3)
          : [];

        return (
          <article className="card" key={blueprint.id}>
            <div className="eyebrow">{copy.areaLabel}</div>
            <h2>
              {blueprint.title}
              {active && <span className="badge warning" style={{ marginLeft: ".6rem", verticalAlign: "middle" }}>{expired ? "시간 만료" : "진행 중"}</span>}
            </h2>
            <p className="muted">{totalItems}문항 · {blueprint.timeLimitMin}분 · {copy.formatNote}</p>
            <div className="question-actions" style={{ marginTop: "1rem" }}>
              <a className="button" href={sitePath(`/exam/${blueprint.id}`)}>
                {expired ? "결과 확인" : active ? "이어하기" : "시작하기"}
              </a>
            </div>
            {recent.length > 0 && (
              <div className="review-list" style={{ marginTop: "1.2rem" }}>
                {recent.map((finished) => (
                  <a className="review-row block-link" key={finished.id} href={sitePath(`/exam/history?session=${encodeURIComponent(finished.id)}`)}>
                    <div>
                      <strong>{finished.result.correct} / {finished.result.total} 정답</strong>
                      <div className="muted">
                        {new Date(finished.submittedAt).toLocaleDateString("ko-KR")} · {finished.status === "expired" ? "시간 만료 자동 제출" : "제출 완료"}
                      </div>
                    </div>
                    <span aria-hidden="true">결과 보기 →</span>
                  </a>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
