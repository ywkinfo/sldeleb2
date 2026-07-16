"use client";

import { useMemo } from "react";
import { practiceItems } from "@/data/practiceItems";
import type {
  ExamItemContract,
  ExamResultItem,
  FinalizedExamSession,
  Task,
} from "@/lib/types";
import { sitePath } from "@/lib/url";

function taskLabel(task: string): string {
  return task.replace("tarea", "Tarea ");
}

export interface ExamResultRow {
  itemId: string;
  task: Task;
  entry?: ExamResultItem;
}

/** 옛 세션에서 live 콘텐츠가 사라져 result.items가 빠져도 모든 문항 자리를 보존한다. */
export function buildExamResultRows(session: FinalizedExamSession): ExamResultRow[] {
  const resultById = new Map(session.result.items.map((entry) => [entry.itemId, entry]));
  const rows = session.sections.flatMap((section) =>
    section.itemIds.map((itemId) => ({
      itemId,
      task: section.task,
      entry: resultById.get(itemId),
    })),
  );
  const listed = new Set(rows.map((row) => row.itemId));
  for (const entry of session.result.items) {
    if (!listed.has(entry.itemId)) {
      rows.push({ itemId: entry.itemId, task: entry.task, entry });
    }
  }
  return rows;
}

export function ExamResultView({
  session,
  projectionWarning = false,
  onRetryProjection,
  onRestart,
}: {
  session: FinalizedExamSession;
  projectionWarning?: boolean;
  onRetryProjection?: () => void;
  onRestart?: () => void;
}) {
  const contractById = useMemo(() => {
    const map = new Map<string, ExamItemContract>();
    for (const section of session.sections) {
      for (const contract of section.items ?? []) map.set(contract.id, contract);
    }
    return map;
  }, [session]);
  const liveItemById = useMemo(
    () => new Map(practiceItems.map((item) => [item.id, item])),
    [],
  );
  const numberByItemId = useMemo(() => {
    const map = new Map<string, number>();
    session.sections.flatMap((section) => section.itemIds).forEach((itemId, index) => {
      map.set(itemId, index + 1);
    });
    return map;
  }, [session]);
  const pending = projectionWarning || session.progressProjection.status === "pending";
  const resultRows = useMemo(() => buildExamResultRows(session), [session]);

  return (
    <div className="practice-stack exam-result-view">
      <article className="card" id="exam-result">
        <div className="eyebrow">{session.status === "expired" ? "시간 만료로 자동 제출" : "제출 완료"}</div>
        <h2>정답 {session.result.correct} / {session.result.total}</h2>
        <p className="badge warning">창작 문항 모의고사 결과 · 공식 DELE 점수가 아닙니다</p>
        <div className="exam-bytask">
          {session.sections.map((section) => {
            const tally = session.result.byTask[section.task];
            return (
              <div className="stat" key={section.task}>
                <span className="eyebrow">{taskLabel(section.task)}</span>
                <strong>{tally ? `${tally.correct}/${tally.total}` : "–"}</strong>
              </div>
            );
          })}
        </div>
        {pending && (
          <p className="storage-warning" role="alert" style={{ marginTop: "1rem" }}>
            복습 큐 반영이 아직 완료되지 않았습니다. 저장 공간을 확인한 뒤 다시 시도해 주세요.{" "}
            {onRetryProjection && (
              <button className="button secondary small" type="button" onClick={onRetryProjection}>다시 반영</button>
            )}
          </p>
        )}
        <div className="question-actions" style={{ marginTop: "1.2rem" }}>
          {onRestart ? (
            <button className="button" type="button" onClick={onRestart}>다시 응시하기</button>
          ) : (
            <a className="button" href={sitePath(`/exam/${session.blueprintId}`)}>다시 응시하기</a>
          )}
          <a className="button secondary" href={sitePath("/review")}>복습 큐로 가기</a>
          <a className="button secondary" href={sitePath(`/exam/history?session=${encodeURIComponent(session.id)}`)}>시험 기록</a>
          <a className="button secondary" href={sitePath("/exam")}>모의고사 목록</a>
        </div>
      </article>

      <section className="content-group exam-result-items" aria-labelledby={`result-items-${session.id}`}>
        <h2 id={`result-items-${session.id}`}>문항별 결과</h2>
        <div className="review-list">
          {resultRows.map(({ itemId, entry }) => {
            const contract = contractById.get(itemId);
            const live = liveItemById.get(itemId);
            const liveMcq = live && live.kind === "mcq" ? live : undefined;
            const unavailable = entry === undefined || (!contract && !liveMcq);
            const prompt = contract?.prompt ?? liveMcq?.prompt ?? "문항 내용을 불러올 수 없습니다.";
            const explanation = contract?.explanationKo ?? liveMcq?.explanationKo;
            return (
              <div className="review-row" key={itemId}>
                <div>
                  <strong>
                    <span className={entry?.correct ? "option-state is-correct" : "option-state is-wrong"}>
                      {entry?.correct ? "✓" : "✕"}
                    </span>{" "}
                    {numberByItemId.get(itemId) ?? "–"}. <span lang="es">{prompt}</span>
                  </strong>
                  <div className="muted">
                    내 답 {entry?.selectedAnswer ? entry.selectedAnswer.toUpperCase() : "미응답"} · 정답 {entry ? entry.correctAnswer.toUpperCase() : "확인 불가"}
                    {explanation ? ` — ${explanation}` : ""}
                  </div>
                  {unavailable && (
                    <div className="storage-warning exam-result-unavailable">
                      {entry
                        ? "콘텐츠가 변경되어 저장된 정오 정보만 표시합니다."
                        : "콘텐츠가 변경되어 이 문항의 정답과 해설을 불러올 수 없습니다."}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
