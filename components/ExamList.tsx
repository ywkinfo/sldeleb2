"use client";

/* Exam state is read from the browser only after hydration, then kept in sync by the store subscription. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import type { ExamSession, FinalizedExamSession } from "@/lib/types";
import { findActiveSession, getDefaultExamSessionStore, snapshotBlueprint } from "@/lib/examSession";
import { examBlueprints } from "@/data/examBlueprints";
import { practiceSets } from "@/data/practiceSets";
import { practiceItems } from "@/data/practiceItems";
import { listeningScripts } from "@/data/listeningScripts";
import { sitePath } from "@/lib/url";

const content = { practiceSets, practiceItems, listeningScripts };

export function ExamList() {
  const store = getDefaultExamSessionStore();
  const [hydrated, setHydrated] = useState(false);
  const [sessions, setSessions] = useState<readonly ExamSession[]>([]);

  useEffect(() => {
    const unsubscribe = store.subscribe((next) => setSessions(next.snapshot.sessions));
    setSessions(store.load().snapshot.sessions);
    setHydrated(true);
    return unsubscribe;
  }, [store]);

  return (
    <div className="practice-stack">
      {examBlueprints.map((blueprint) => {
        const totalItems = snapshotBlueprint(blueprint, content).reduce(
          (sum, section) => sum + section.itemIds.length,
          0,
        );
        const active = hydrated ? findActiveSession(sessions, blueprint.id) : undefined;
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
            <div className="eyebrow">Comprensión auditiva</div>
            <h2>
              {blueprint.title}
              {active && <span className="badge warning" style={{ marginLeft: ".6rem", verticalAlign: "middle" }}>진행 중</span>}
            </h2>
            <p className="muted">{totalItems}문항 · {blueprint.timeLimitMin}분 · 제출 후 일괄 채점 · 음원 2회 재생</p>
            <div className="question-actions" style={{ marginTop: "1rem" }}>
              <a className="button" href={sitePath(`/exam/${blueprint.id}`)}>
                {active ? "이어하기" : "시작하기"}
              </a>
            </div>
            {recent.length > 0 && (
              <div className="review-list" style={{ marginTop: "1.2rem" }}>
                {recent.map((finished) => (
                  <div className="review-row" key={finished.id}>
                    <div>
                      <strong>{finished.result.correct} / {finished.result.total} 정답</strong>
                      <div className="muted">
                        {new Date(finished.submittedAt).toLocaleDateString("ko-KR")} · {finished.status === "expired" ? "시간 만료 자동 제출" : "제출 완료"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
