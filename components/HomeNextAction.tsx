"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import {
  findNextInProgressDeadline,
  getDefaultExamSessionStore,
} from "@/lib/examSession";
import { summarizeSetProgress } from "@/lib/progress";
import { getReviewReasons } from "@/lib/review";
import { sortPracticeSets } from "@/lib/sets";
import type { AttemptState, ExamSession, PracticeSet } from "@/lib/types";
import { sitePath } from "@/lib/url";
import { useAttempts } from "@/hooks/useAttempts";

export interface HomeExamSessionMeta {
  blueprintId: string;
  status: ExamSession["status"];
  startedAt: number;
  deadlineAt: number;
}

export interface HomeAction {
  kind: "active-exam" | "expired-exam" | "practice" | "review" | "starter";
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  notice?: string;
}

interface HomeActionInput {
  sessions: readonly HomeExamSessionMeta[];
  sets: readonly PracticeSet[];
  attempts: Record<string, AttemptState>;
  /** 답 제출 전 별표(itemId → 별표 시각). 복습 수에는 포함하되 "이어하기" 판단에는 쓰지 않는다. */
  pendingFlags?: Record<string, number>;
  now: number;
}

function latestSession(sessions: readonly HomeExamSessionMeta[]): HomeExamSessionMeta | undefined {
  return [...sessions].sort((a, b) => b.startedAt - a.startedAt)[0];
}

function starterAction(sets: readonly PracticeSet[]): HomeAction | null {
  const starter = sets.find(
    (set) => set.skill === "reading" && set.mode === "guided",
  );
  if (!starter) return null;
  return {
    kind: "starter",
    href: `/practice/set/${starter.id}`,
    eyebrow: "Práctica · 추천 시작",
    title: starter.title,
    description: `약 ${starter.estimatedMin}분 · ${starter.itemIds.length}문항`,
    notice: "공식 기출이 아닌 창작 연습문항",
  };
}

/** 홈에서 콘텐츠를 불러오거나 시험을 최종화하지 않고 다음 행동만 선택한다. */
export function selectHomeNextAction({
  sessions,
  sets,
  attempts,
  pendingFlags,
  now,
}: HomeActionInput): HomeAction | null {
  const inProgress = sessions.filter((session) => session.status === "in-progress");
  const active = latestSession(inProgress.filter((session) => session.deadlineAt > now));
  if (active) {
    return {
      kind: "active-exam",
      href: `/exam/${active.blueprintId}`,
      eyebrow: "Simulacro · 이어하기",
      title: "진행 중인 모의고사",
      description: "저장된 지점에서 시험을 계속하세요.",
    };
  }

  const expired = latestSession(inProgress.filter((session) => session.deadlineAt <= now));
  if (expired) {
    return {
      kind: "expired-exam",
      href: `/exam/${expired.blueprintId}`,
      eyebrow: "Simulacro · 시간 만료",
      title: "모의고사 결과 확인",
      description: "제한 시간이 끝났습니다. 시험 페이지에서 자동 제출된 결과를 확인하세요.",
    };
  }

  const orderedSets = sortPracticeSets(sets);
  const incomplete = orderedSets
    .map((set) => {
      const touched = set.itemIds
        .map((itemId) => attempts[itemId]?.lastAttemptedAt)
        .filter((value): value is number => value !== undefined);
      return {
        set,
        lastAttemptedAt: touched.length > 0 ? Math.max(...touched) : -1,
        progress: summarizeSetProgress(set, attempts),
      };
    })
    .filter(({ lastAttemptedAt, progress }) => lastAttemptedAt >= 0 && progress.status !== "done")
    .sort((a, b) => b.lastAttemptedAt - a.lastAttemptedAt)[0];
  if (incomplete) {
    return {
      kind: "practice",
      href: `/practice/set/${incomplete.set.id}`,
      eyebrow: "Práctica · 이어하기",
      title: incomplete.set.title,
      description: `${incomplete.progress.answered}/${incomplete.progress.total}개 완료 · 약 ${incomplete.set.estimatedMin}분`,
      notice: "공식 기출이 아닌 창작 연습문항",
    };
  }

  // 미풀이 별표(attempt 없음)도 복습 대상으로 센다. attempt가 있는 문항의
  // 별표는 저장 시점에 attempt.flagged로 흡수되므로 중복 집계는 없다.
  const pendingOnlyCount = Object.keys(pendingFlags ?? {}).filter(
    (itemId) => attempts[itemId] === undefined,
  ).length;
  const reviewCount =
    Object.values(attempts).filter((attempt) => getReviewReasons(attempt).length > 0).length +
    pendingOnlyCount;
  if (reviewCount > 0) {
    return {
      kind: "review",
      href: "/review",
      eyebrow: "Repaso · 오늘의 추천",
      title: `맞춤 복습 ${Math.min(reviewCount, 3)}개`,
      description: "오답·낮은 자기평가·별표 기록을 우선 복습하세요.",
    };
  }

  return starterAction(orderedSets);
}

function toMeta(session: ExamSession): HomeExamSessionMeta {
  return {
    blueprintId: session.blueprintId,
    status: session.status,
    startedAt: session.startedAt,
    deadlineAt: session.deadlineAt,
  };
}

function HomeActionLink({ action, busy = false }: { action: HomeAction; busy?: boolean }) {
  return <a href={sitePath(action.href)} className="block-link" aria-busy={busy || undefined}>
    <div className="hero-note">
      <span className="eyebrow">{action.eyebrow}</span>
      <strong>{action.title}</strong>
      <p>{action.description}</p>
      {action.notice && <p className="badge warning" style={{ marginTop: ".8rem" }}>{action.notice}</p>}
      {busy && <span className="sr-only" role="status">이 기기의 학습 기록을 불러오는 중입니다.</span>}
    </div>
  </a>;
}

export function HomeNextAction({ sets }: { sets: readonly PracticeSet[] }) {
  const { attempts, pendingFlags, hydrated: progressHydrated } = useAttempts();
  const examStore = getDefaultExamSessionStore();
  const [sessions, setSessions] = useState<HomeExamSessionMeta[]>([]);
  const [examHydrated, setExamHydrated] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = (next: readonly ExamSession[]) => setSessions(next.map(toMeta));
    const unsubscribe = examStore.subscribe((next) => update(next.snapshot.sessions));
    update(examStore.load().snapshot.sessions);
    setNow(Date.now());
    setExamHydrated(true);
    return unsubscribe;
  }, [examStore]);

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

  if (!progressHydrated || !examHydrated || now === null) {
    const fallback = starterAction(sortPracticeSets(sets));
    return fallback ? <HomeActionLink action={fallback} busy /> : (
      <div className="hero-note" aria-busy="true">
        <strong>다음 학습을 찾는 중…</strong>
        <p className="muted" role="status">이 기기의 학습 기록을 불러오고 있습니다.</p>
      </div>
    );
  }

  const action = selectHomeNextAction({ sessions, sets, attempts, pendingFlags, now });
  if (!action) {
    return <div className="hero-note">
      <strong>오늘의 짧은 읽기</strong>
      <p>한 Tarea 단위로 부담 없이 시작하세요.</p>
    </div>;
  }

  return <HomeActionLink action={action} />;
}
