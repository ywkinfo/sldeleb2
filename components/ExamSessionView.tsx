"use client";

/* Exam state is read from the browser only after hydration, then kept in sync by the store subscription. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from "react";
import type { ExamBlueprint, ExamSession, FinalizedExamSession } from "@/lib/types";
import {
  answerExamItem,
  applyPendingProjection,
  closeActivePlaybacks,
  completePlayback,
  createExamSession,
  finalizeExamSession,
  findActiveSession,
  findPendingProjectionSessions,
  getDefaultExamSessionStore,
  MAX_TERMINAL_SESSIONS,
  refundPlayback,
  reservePlayback,
  resolveSections,
  snapshotBlueprint,
  toggleExamFlag,
  type ResolvedExamItem,
} from "@/lib/examSession";
import { getDefaultAttemptStore } from "@/lib/storage";
import { getTimerAnnouncement } from "@/lib/timer";
import { sitePath } from "@/lib/url";
import { EXAM_SKILL_COPY } from "@/lib/examCopy";
import { practiceSets } from "@/data/practiceSets";
import { practiceItems } from "@/data/practiceItems";
import { listeningScripts } from "@/data/listeningScripts";
import { readingTexts } from "@/data/readingTexts";
import { ExamQuestion } from "./ExamQuestion";
import { ExamAudioPlayer } from "./ExamAudioPlayer";
import { ExamQuestionPalette, type ExamQuestionPaletteHandle } from "./ExamQuestionPalette";
import { ExamResultView } from "./ExamResultView";
import { ExamToolbar } from "./ExamToolbar";
import { ReadingPresentation } from "./ReadingPresentation";
import { ReadingWorkspace } from "./ReadingWorkspace";
import { StorageNotice } from "./StorageNotice";

const content = { practiceSets, practiceItems, listeningScripts, readingTexts };

function taskLabel(task: string): string {
  return task.replace("tarea", "Tarea ");
}

export function ExamSessionView({ blueprint }: { blueprint: ExamBlueprint }) {
  const examStore = getDefaultExamSessionStore();
  const attemptStore = getDefaultAttemptStore();

  const [hydrated, setHydrated] = useState(false);
  const [sessions, setSessions] = useState<readonly ExamSession[]>([]);
  const [persistent, setPersistent] = useState(true);
  const [recovered, setRecovered] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [announcement, setAnnouncement] = useState("");
  const [projectionWarning, setProjectionWarning] = useState(false);
  const prevRemaining = useRef<number | null>(null);
  const paletteRef = useRef<ExamQuestionPaletteHandle>(null);

  useEffect(() => {
    const unsubscribe = examStore.subscribe((next) => {
      setSessions(next.snapshot.sessions);
      setPersistent(next.persistent);
      setRecovered(next.recovered);
    });
    const loaded = examStore.load();
    setSessions(loaded.snapshot.sessions);
    setPersistent(loaded.persistent);
    setRecovered(loaded.recovered);

    // 이어하기: 진행 중 세션이 있으면 복원하고 active 재생 슬롯을 닫는다.
    const active = findActiveSession(loaded.snapshot.sessions, blueprint.id);
    if (active) {
      setCurrentId(active.id);
      const closed = closeActivePlaybacks(active, Date.now());
      if (closed !== active) examStore.upsertSession(closed);
    }
    // 이전 방문에서 반영되지 못한 pending projection을 재시도한다.
    for (const pending of findPendingProjectionSessions(loaded.snapshot.sessions)) {
      applyPendingProjection(pending, attemptStore, examStore);
    }
    setHydrated(true);
    return unsubscribe;
  }, [examStore, attemptStore, blueprint.id]);

  const session = useMemo(
    () => sessions.find((candidate) => candidate.id === currentId),
    [sessions, currentId],
  );

  const resolution = useMemo(
    () => (session ? resolveSections(session.sections, content) : null),
    // sections는 세션 생성 시 고정되므로 세션 id 기준으로만 다시 계산한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.id],
  );

  const numberByItemId = useMemo(() => {
    const map = new Map<string, number>();
    session?.sections.flatMap((section) => section.itemIds).forEach((itemId, index) => {
      map.set(itemId, index + 1);
    });
    return map;
  }, [session]);

  // 연속 조작의 lost update를 막기 위해 항상 저장소의 최신 세션을 기준으로 변경한다.
  const latestSession = (): ExamSession | undefined =>
    examStore.load().snapshot.sessions.find((candidate) => candidate.id === currentId);

  const finalize = (reason: "submit" | "expire") => {
    const current = latestSession();
    if (!current || current.status !== "in-progress" || !resolution) return;
    const previous = attemptStore.load().snapshot.attempts;
    const next = finalizeExamSession(current, resolution.resolved, previous, Date.now(), reason);
    if (next === current || next.status === "in-progress") return;
    examStore.upsertSession(next);
    const { applied } = applyPendingProjection(next, attemptStore, examStore);
    setProjectionWarning(!applied);
  };

  // deadlineAt이 유일한 진실 — interval은 표시용이고, 포커스·가시성 변화 때도 재검사한다.
  const inProgress = session?.status === "in-progress";
  const deadlineAt = session?.deadlineAt;
  useEffect(() => {
    const root = document.documentElement;
    if (inProgress) root.dataset.examActive = "true";
    else delete root.dataset.examActive;
    return () => {
      delete root.dataset.examActive;
    };
  }, [inProgress]);

  useEffect(() => {
    if (!inProgress) return;
    const check = () => {
      const t = Date.now();
      setNow(t);
      if (deadlineAt !== undefined && t >= deadlineAt) finalize("expire");
    };
    check();
    const id = window.setInterval(check, 500);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inProgress, deadlineAt, session?.id]);

  const remaining = session?.status === "in-progress" ? Math.max(0, session.deadlineAt - now) : null;
  useEffect(() => {
    if (remaining === null) {
      prevRemaining.current = null;
      return;
    }
    if (prevRemaining.current !== null) {
      const next = getTimerAnnouncement(prevRemaining.current, remaining);
      if (next) setAnnouncement(next);
    }
    prevRemaining.current = remaining;
  }, [remaining]);

  const mutate = (fn: (current: ExamSession, at: number) => ExamSession) => {
    const current = latestSession();
    if (!current) return;
    // 이벤트 핸들러에서만 호출되는 헬퍼 — 렌더 경로가 아니므로 Date.now()가 안전하다.
    // eslint-disable-next-line react-hooks/purity
    const next = fn(current, Date.now());
    if (next !== current) examStore.upsertSession(next);
  };

  const start = () => {
    const sections = snapshotBlueprint(blueprint, content);
    const created = createExamSession(blueprint, sections, Date.now());
    examStore.upsertSession(created);
    setProjectionWarning(false);
    setCurrentId(created.id);
  };

  const totalItems = session
    ? session.sections.reduce((sum, section) => sum + section.itemIds.length, 0)
    : 0;

  if (!hydrated) {
    return (
      <section className="page-section compact">
        <div className="site-shell"><p className="muted">모의고사 정보를 불러오는 중…</p></div>
      </section>
    );
  }

  if (!session) {
    return (
      <ExamIntro
        blueprint={blueprint}
        sessions={sessions}
        onStart={start}
        persistent={persistent}
        recovered={recovered}
      />
    );
  }

  if (session.status !== "in-progress") {
    return (
      <section className="page-section compact">
        <div className="site-shell">
          <ExamResultView
            session={session}
            projectionWarning={projectionWarning}
            onRetryProjection={() => {
              const { applied } = applyPendingProjection(session, attemptStore, examStore);
              setProjectionWarning(!applied);
            }}
            onRestart={start}
          />
        </div>
      </section>
    );
  }

  const answeredCount = Object.keys(session.answers).length;
  const flaggedCount = session.flaggedItemIds.length;
  const copy = EXAM_SKILL_COPY[blueprint.skill];

  const submit = () => {
    const unanswered = totalItems - answeredCount;
    const detail = [
      unanswered > 0 ? `미응답 ${unanswered}문항` : null,
      flaggedCount > 0 ? `검토 표시 ${flaggedCount}문항` : null,
    ].filter(Boolean).join(" · ");
    const message = `답안을 제출할까요? 제출 후에는 수정할 수 없습니다.${detail ? `\n${detail}` : ""}`;
    if (window.confirm(message)) finalize("submit");
  };

  return (
    <>
      <ExamToolbar
        remaining={remaining ?? 0}
        answered={answeredCount}
        total={totalItems}
        persistent={persistent}
        onOpenPalette={(opener) => paletteRef.current?.open(opener)}
        onSubmit={submit}
      />
      <span className="sr-only" aria-live="polite">{announcement}</span>

      <section className="page-section compact exam-active-content">
        <div className="site-shell exam-session-layout">
          <div className="practice-stack exam-session-main">
            {resolution && resolution.missingItemIds.length > 0 && (
              <p className="storage-warning" role="alert">
                콘텐츠 변경으로 {resolution.missingItemIds.length}개 문항을 불러올 수 없어 미응답으로 처리됩니다.
              </p>
            )}
            {session.sections.map((section) => {
            const entryById = new Map(
              (resolution?.resolved ?? [])
                .filter((entry) => section.itemIds.includes(entry.item.id))
                .map((entry) => [entry.item.id, entry]),
            );
            const question = (entry: ResolvedExamItem) => (
              <ExamQuestion
                key={entry.item.id}
                item={entry.item}
                number={numberByItemId.get(entry.item.id) ?? 0}
                value={session.answers[entry.item.id]}
                flagged={session.flaggedItemIds.includes(entry.item.id)}
                disabled={false}
                onSelect={(key) => mutate((current, at) => answerExamItem(current, entry.item.id, key, at))}
                onToggleFlag={() => mutate((current, at) => toggleExamFlag(current, entry.item.id, at))}
              />
            );
            return (
              <article className="card" key={section.task} id={`exam-${section.task}`}>
                <div className="eyebrow">{copy.sectionEyebrow} · {taskLabel(section.task)}</div>
                <p className="badge warning">{copy.contentBadge}</p>
                {blueprint.skill === "reading"
                  ? // 읽기: 문항의 textId를 첫 등장 순서로 묶는다(section.textIds에 의존하지 않아
                    // 옛 세션도 동일하게 복원된다). 지문 → 문항 순으로 렌더.
                    (() => {
                      const order: string[] = [];
                      const byText = new Map<string, ResolvedExamItem[]>();
                      for (const itemId of section.itemIds) {
                        const entry = entryById.get(itemId);
                        if (!entry || entry.item.kind !== "mcq" || entry.item.skill !== "reading") continue;
                        const textId = entry.item.textId;
                        if (!byText.has(textId)) {
                          order.push(textId);
                          byText.set(textId, []);
                        }
                        byText.get(textId)!.push(entry);
                      }
                      return order.map((textId) => {
                        const entries = byText.get(textId)!;
                        const textMeta = entries.find((entry) => entry.textMeta)?.textMeta;
                        const titleId = `exam-${section.task}-${textId}-title`;
                        return (
                          <section
                            key={textId}
                            className="exam-script-block"
                            aria-labelledby={textMeta ? titleId : undefined}
                          >
                            {textMeta ? (
                              section.presentation && section.presentation.kind !== "mcq" ? (
                                <ReadingPresentation
                                  presentation={section.presentation}
                                  title={textMeta.title}
                                  titleId={titleId}
                                  passage={textMeta.passage}
                                  items={entries.map((entry) => entry.item)}
                                  numberForItem={(itemId) => numberByItemId.get(itemId) ?? 0}
                                  stateByItemId={Object.fromEntries(
                                    entries.map((entry) => [
                                      entry.item.id,
                                      { value: session.answers[entry.item.id], disabled: false },
                                    ]),
                                  )}
                                  onSelect={(itemId, key) =>
                                    mutate((current, at) => answerExamItem(current, itemId, key, at))
                                  }
                                  renderItemSupplement={(item) => {
                                    const flagged = session.flaggedItemIds.includes(item.id);
                                    return (
                                      <div className="question-actions">
                                        <button
                                          className="button secondary small"
                                          type="button"
                                          aria-pressed={flagged}
                                          onClick={() =>
                                            mutate((current, at) => toggleExamFlag(current, item.id, at))
                                          }
                                        >
                                          {flagged ? "★ 검토 표시 해제" : "☆ 검토 표시"}
                                        </button>
                                      </div>
                                    );
                                  }}
                                />
                              ) : (
                                <ReadingWorkspace
                                  title={textMeta.title}
                                  titleId={titleId}
                                  passage={textMeta.passage}
                                >
                                  {entries.map(question)}
                                </ReadingWorkspace>
                              )
                            ) : (
                              <p className="storage-warning" role="alert">지문 정보를 불러올 수 없습니다(콘텐츠 변경).</p>
                            )}
                          </section>
                        );
                      });
                    })()
                  : section.scriptIds.map((scriptId) => {
                      const scriptEntries = section.itemIds
                        .map((itemId) => entryById.get(itemId))
                        .filter((entry): entry is ResolvedExamItem =>
                          entry !== undefined && entry.item.kind === "mcq" && entry.item.skill === "listening" && entry.item.scriptId === scriptId,
                        );
                      const scriptMeta = scriptEntries.find((entry) => entry.scriptMeta)?.scriptMeta;
                      return (
                        <div key={scriptId} className="exam-script-block">
                          {scriptMeta ? (
                            <ExamAudioPlayer
                              title={scriptMeta.title}
                              audioSrc={scriptMeta.audioSrc}
                              playback={session.playbacks[scriptId] ?? { used: 0, active: false }}
                              disabled={false}
                              onReserve={() => mutate((current, at) => reservePlayback(current, scriptId, at))}
                              onComplete={() => mutate((current, at) => completePlayback(current, scriptId, at))}
                              onRefund={() => mutate((current, at) => refundPlayback(current, scriptId, at))}
                            />
                          ) : (
                            <p className="storage-warning" role="alert">음원 정보를 불러올 수 없습니다(콘텐츠 변경).</p>
                          )}
                          {scriptEntries.map(question)}
                        </div>
                      );
                    })}
              </article>
            );
            })}
            <div className="card flat">
              <h2>제출</h2>
              <p className="muted">제출하면 전체 문항이 한 번에 채점되고, 오답은 복습 큐에 반영됩니다. 제한 시간이 끝나면 자동 제출됩니다.</p>
              <div className="question-actions">
                <button className="button" type="button" onClick={submit}>답안 제출</button>
              </div>
            </div>
            <StorageNotice persistent={persistent} recovered={recovered} />
          </div>
          <ExamQuestionPalette
            ref={paletteRef}
            sections={session.sections}
            answers={session.answers}
            flaggedItemIds={session.flaggedItemIds}
            numberByItemId={numberByItemId}
          />
        </div>
      </section>
    </>
  );
}

function ExamIntro({
  blueprint,
  sessions,
  onStart,
  persistent,
  recovered,
}: {
  blueprint: ExamBlueprint;
  sessions: readonly ExamSession[];
  onStart: () => void;
  persistent: boolean;
  recovered: boolean;
}) {
  const sections = snapshotBlueprint(blueprint, content);
  const totalItems = sections.reduce((sum, section) => sum + section.itemIds.length, 0);
  const copy = EXAM_SKILL_COPY[blueprint.skill];
  const recent = sessions
    .filter((candidate): candidate is FinalizedExamSession => candidate.status !== "in-progress" && candidate.blueprintId === blueprint.id)
    .sort((a, b) => b.submittedAt - a.submittedAt)
    .slice(0, 3);

  return (
    <section className="page-section compact">
      <div className="site-shell practice-stack">
        <article className="card">
          <div className="eyebrow">Simulacro · {copy.areaLabel}</div>
          <h2>{blueprint.title}</h2>
          <p className="lead">{totalItems}문항 · {blueprint.timeLimitMin}분 · 제출 후 일괄 채점</p>
          <ul className="checklist">
            {blueprint.skill === "listening" ? (
              <li>음원은 스크립트당 2회까지만 재생할 수 있고, 위치 이동(탐색)은 없습니다.</li>
            ) : (
              <li>문항 수와 제한 시간, Tarea 2 매칭·Tarea 3 문장 삽입·Tarea 4 빈칸 형식을 반영한 창작 모의고사입니다.</li>
            )}
            <li>타이머는 멈출 수 없으며 시간이 끝나면 자동 제출됩니다.</li>
            <li>진행 상태는 이 브라우저에 저장되어 새로고침해도 이어집니다.</li>
            <li>제출하면 한 번에 채점되고 오답은 복습 큐로 이어집니다.</li>
            <li>종료된 시험 기록은 일반적으로 최근 {MAX_TERMINAL_SESSIONS}회까지 보관되며, 복습 반영 대기 기록은 완료될 때까지 보호됩니다. 진도 백업에도 함께 포함됩니다.</li>
          </ul>
          <p className="badge warning">창작 문항 모의고사 · 공식 시험 점수가 아닙니다</p>
          <div className="question-actions" style={{ marginTop: "1rem" }}>
            <button className="button" type="button" onClick={onStart}>시험 시작</button>
            <a className="button secondary" href={sitePath("/exam")}>모의고사 목록</a>
            <a className="button secondary" href={sitePath("/exam/history")}>시험 기록</a>
          </div>
        </article>
        {recent.length > 0 && (
          <article className="card flat">
            <h2>최근 결과</h2>
            <div className="review-list">
              {recent.map((finished) => (
                <a
                  className="review-row block-link"
                  key={finished.id}
                  href={sitePath(`/exam/history?session=${encodeURIComponent(finished.id)}`)}
                >
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
          </article>
        )}
        <StorageNotice persistent={persistent} recovered={recovered} />
      </div>
    </section>
  );
}
