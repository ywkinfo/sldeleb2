"use client";

/* Exam state is read from the browser only after hydration, then kept in sync by the store subscription. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from "react";
import type { ExamBlueprint, ExamItemContract, ExamSession, FinalizedExamSession } from "@/lib/types";
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
import { formatRemainingTime, getTimerAnnouncement } from "@/lib/timer";
import { sitePath } from "@/lib/url";
import { EXAM_SKILL_COPY } from "@/lib/examCopy";
import { practiceSets } from "@/data/practiceSets";
import { practiceItems } from "@/data/practiceItems";
import { listeningScripts } from "@/data/listeningScripts";
import { readingTexts } from "@/data/readingTexts";
import { ExamQuestion } from "./ExamQuestion";
import { ExamAudioPlayer } from "./ExamAudioPlayer";
import { StorageNotice } from "./StorageNotice";

const content = { practiceSets, practiceItems, listeningScripts, readingTexts };

function taskLabel(task: string): string {
  return task.replace("tarea", "Tarea ");
}

function StickyBar({ children }: { children: React.ReactNode }) {
  const [top, setTop] = useState(0);
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header || typeof ResizeObserver === "undefined") return;
    const update = () => setTop(header.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="set-progress-bar" style={{ top }}>
      <div className="site-shell set-progress-row">{children}</div>
    </div>
  );
}

export function ExamSessionView({ blueprint }: { blueprint: ExamBlueprint }) {
  const examStore = getDefaultExamSessionStore();
  const attemptStore = getDefaultAttemptStore();

  const [hydrated, setHydrated] = useState(false);
  const [sessions, setSessions] = useState<readonly ExamSession[]>([]);
  const [persistent, setPersistent] = useState(true);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [announcement, setAnnouncement] = useState("");
  const [projectionWarning, setProjectionWarning] = useState(false);
  const prevRemaining = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = examStore.subscribe((next) => {
      setSessions(next.snapshot.sessions);
      setPersistent(next.persistent);
    });
    const loaded = examStore.load();
    setSessions(loaded.snapshot.sessions);
    setPersistent(loaded.persistent);

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
    return <ExamIntro blueprint={blueprint} sessions={sessions} onStart={start} persistent={persistent} />;
  }

  if (session.status !== "in-progress") {
    return (
      <ExamResult
        session={session}
        numberByItemId={numberByItemId}
        projectionWarning={projectionWarning}
        onRetryProjection={() => {
          const { applied } = applyPendingProjection(session, attemptStore, examStore);
          setProjectionWarning(!applied);
        }}
        onRestart={start}
      />
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
      <StickyBar>
        <span className={`exam-bar-timer ${remaining !== null && remaining <= 5 * 60_000 ? "low" : ""}`} aria-label="남은 시간">
          {formatRemainingTime(remaining ?? 0)}
        </span>
        <span className="set-progress-count"><strong>{answeredCount}</strong> / {totalItems} 응답{flaggedCount > 0 ? ` · ★ ${flaggedCount}` : ""}</span>
        <div className="progress set-progress-track" aria-hidden="true">
          <span style={{ width: `${totalItems ? Math.round((answeredCount / totalItems) * 100) : 0}%` }} />
        </div>
        <button className="button small" type="button" onClick={submit}>답안 제출</button>
      </StickyBar>
      <span className="sr-only" aria-live="polite">{announcement}</span>

      <section className="page-section compact">
        <div className="site-shell practice-stack">
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
                              <>
                                <h2 lang="es" id={titleId}>{textMeta.title}</h2>
                                <div className="passage" lang="es">{textMeta.passage}</div>
                              </>
                            ) : (
                              <p className="storage-warning" role="alert">지문 정보를 불러올 수 없습니다(콘텐츠 변경).</p>
                            )}
                            {entries.map(question)}
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
          <StorageNotice persistent={persistent} />
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
}: {
  blueprint: ExamBlueprint;
  sessions: readonly ExamSession[];
  onStart: () => void;
  persistent: boolean;
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
              <li>문항 수와 제한 시간은 공식 구성을 따르며, 지문 분량과 Tarea 2–4 풀이 형식은 학습용 객관식으로 근사합니다.</li>
            )}
            <li>타이머는 멈출 수 없으며 시간이 끝나면 자동 제출됩니다.</li>
            <li>진행 상태는 이 브라우저에 저장되어 새로고침해도 이어집니다.</li>
            <li>제출하면 한 번에 채점되고 오답은 복습 큐로 이어집니다.</li>
            <li>기록은 이 기기에만 남으며 최근 {MAX_TERMINAL_SESSIONS}회까지 보관됩니다. 진도 내보내기(백업)에는 포함되지 않습니다.</li>
          </ul>
          <p className="badge warning">창작 문항 모의고사 · 공식 시험 점수가 아닙니다</p>
          <div className="question-actions" style={{ marginTop: "1rem" }}>
            <button className="button" type="button" onClick={onStart}>시험 시작</button>
            <a className="button secondary" href={sitePath("/exam")}>모의고사 목록</a>
          </div>
        </article>
        {recent.length > 0 && (
          <article className="card flat">
            <h2>최근 결과</h2>
            <div className="review-list">
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
          </article>
        )}
        <StorageNotice persistent={persistent} />
      </div>
    </section>
  );
}

function ExamResult({
  session,
  numberByItemId,
  projectionWarning,
  onRetryProjection,
  onRestart,
}: {
  session: FinalizedExamSession;
  numberByItemId: Map<string, number>;
  projectionWarning: boolean;
  onRetryProjection: () => void;
  onRestart: () => void;
}) {
  // 결과 표시도 세션에 동결된 계약을 우선 사용해 배포와 무관하게 한다.
  // 계약이 없는 옛 세션만 라이브 콘텐츠로 폴백한다.
  const contractById = useMemo(() => {
    const map = new Map<string, ExamItemContract>();
    for (const section of session.sections) {
      for (const contract of section.items ?? []) map.set(contract.id, contract);
    }
    return map;
  }, [session]);
  const liveItemById = useMemo(() => new Map(practiceItems.map((item) => [item.id, item])), []);
  const pending = projectionWarning || session.progressProjection.status === "pending";
  const tasks = session.sections.map((section) => section.task);

  return (
    <section className="page-section compact">
      <div className="site-shell practice-stack">
        <article className="card" id="exam-result">
          <div className="eyebrow">{session.status === "expired" ? "시간 만료로 자동 제출" : "제출 완료"}</div>
          <h2>정답 {session.result.correct} / {session.result.total}</h2>
          <p className="badge warning">창작 문항 모의고사 결과 · 공식 DELE 점수가 아닙니다</p>
          <div className="exam-bytask">
            {tasks.map((task) => {
              const tally = session.result.byTask[task];
              return (
                <div className="stat" key={task}>
                  <span className="eyebrow">{taskLabel(task)}</span>
                  <strong>{tally ? `${tally.correct}/${tally.total}` : "–"}</strong>
                </div>
              );
            })}
          </div>
          {pending && (
            <p className="storage-warning" role="alert" style={{ marginTop: "1rem" }}>
              복습 큐 반영이 아직 완료되지 않았습니다. 저장 공간을 확인한 뒤 다시 시도해 주세요.{" "}
              <button className="button secondary small" type="button" onClick={onRetryProjection}>다시 반영</button>
            </p>
          )}
          <div className="question-actions" style={{ marginTop: "1.2rem" }}>
            <button className="button" type="button" onClick={onRestart}>다시 응시하기</button>
            <a className="button secondary" href={sitePath("/review")}>복습 큐로 가기</a>
            <a className="button secondary" href={sitePath("/exam")}>모의고사 목록</a>
          </div>
        </article>

        <article className="card flat">
          <h2>문항별 결과</h2>
          <div className="review-list">
            {session.result.items.map((entry) => {
              const contract = contractById.get(entry.itemId);
              const live = liveItemById.get(entry.itemId);
              const liveMcq = live && live.kind === "mcq" ? live : undefined;
              const prompt = contract?.prompt ?? liveMcq?.prompt ?? entry.itemId;
              const explanation = contract?.explanationKo ?? liveMcq?.explanationKo;
              return (
                <div className="review-row" key={entry.itemId}>
                  <div>
                    <strong>
                      <span className={entry.correct ? "option-state is-correct" : "option-state is-wrong"}>
                        {entry.correct ? "✓" : "✕"}
                      </span>{" "}
                      {numberByItemId.get(entry.itemId) ?? "–"}. <span lang="es">{prompt}</span>
                    </strong>
                    <div className="muted">
                      내 답 {entry.selectedAnswer ? entry.selectedAnswer.toUpperCase() : "미응답"} · 정답 {entry.correctAnswer.toUpperCase()}
                      {explanation ? ` — ${explanation}` : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );
}
