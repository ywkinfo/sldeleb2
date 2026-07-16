"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { summarizeSetProgress } from "@/lib/progress";
import { sortPracticeSets } from "@/lib/sets";
import type {
  AttemptState,
  ExamSkill,
  PracticeSet,
  Task,
} from "@/lib/types";
import { sitePath } from "@/lib/url";
import { PracticeTabs } from "./PracticeTabs";
import { useAttempts } from "./useAttempts";

type PracticeMode = PracticeSet["mode"];

export interface PracticeCatalogFilters {
  skill: ExamSkill | "all";
  mode: PracticeMode | "all";
  task: Task | "all";
}

export type CatalogHighlight = {
  kind: "continue" | "recommended";
  set: PracticeSet;
};

const DEFAULT_FILTERS: PracticeCatalogFilters = {
  skill: "all",
  mode: "all",
  task: "all",
};

const skillOrder: readonly ExamSkill[] = [
  "reading",
  "listening",
  "writing",
  "speaking",
];
const modeOrder: readonly PracticeMode[] = ["guided", "exam-prep"];
const taskOrder: readonly Task[] = [
  "tarea1",
  "tarea2",
  "tarea3",
  "tarea4",
  "tarea5",
];

const skillLabels: Record<ExamSkill, { ko: string; es: string }> = {
  reading: { ko: "읽기", es: "Comprensión de lectura" },
  listening: { ko: "듣기", es: "Comprensión auditiva" },
  writing: { ko: "쓰기", es: "Expresión escrita" },
  speaking: { ko: "말하기", es: "Expresión oral" },
};

const modeLabels: Record<PracticeMode, string> = {
  guided: "단계별 연습",
  "exam-prep": "실전 대비",
};

export function filterPracticeSets(
  sets: readonly PracticeSet[],
  filters: PracticeCatalogFilters,
): PracticeSet[] {
  return sortPracticeSets(sets).filter((set) => {
    return (
      (filters.skill === "all" || set.skill === filters.skill) &&
      (filters.mode === "all" || set.mode === filters.mode) &&
      (filters.task === "all" || set.task === filters.task)
    );
  });
}

function latestAttemptAt(
  set: PracticeSet,
  attempts: Record<string, AttemptState>,
): number {
  return Math.max(
    0,
    ...set.itemIds.map((itemId) => attempts[itemId]?.lastAttemptedAt ?? 0),
  );
}

export function pickCatalogHighlight(
  sets: readonly PracticeSet[],
  attempts: Record<string, AttemptState>,
): CatalogHighlight | undefined {
  const ordered = sortPracticeSets(sets);
  const inProgress = ordered
    .filter(
      (set) => summarizeSetProgress(set, attempts).status === "in-progress",
    )
    .sort(
      (a, b) => latestAttemptAt(b, attempts) - latestAttemptAt(a, attempts),
    )[0];

  if (inProgress) return { kind: "continue", set: inProgress };

  const recommended = ordered.find(
    (set) =>
      set.mode === "guided" &&
      summarizeSetProgress(set, attempts).status !== "done",
  );
  return recommended ? { kind: "recommended", set: recommended } : undefined;
}

function readFilters(): PracticeCatalogFilters {
  const params = new URLSearchParams(window.location.search);
  const skillValue = params.get("skill");
  const modeValue = params.get("mode");
  const taskValue = params.get("task");

  return {
    skill: skillOrder.includes(skillValue as ExamSkill)
      ? (skillValue as ExamSkill)
      : "all",
    mode: modeOrder.includes(modeValue as PracticeMode)
      ? (modeValue as PracticeMode)
      : "all",
    task: taskOrder.includes(taskValue as Task) ? (taskValue as Task) : "all",
  };
}

function writeFilters(filters: PracticeCatalogFilters, method: "push" | "replace") {
  const url = new URL(window.location.href);
  for (const key of ["skill", "mode", "task"] as const) {
    url.searchParams.delete(key);
    if (filters[key] !== "all") url.searchParams.set(key, filters[key]);
  }
  window.history[`${method}State`]({}, "", url);
}

function SetCard({
  set,
  attempts,
  hydrated,
}: {
  set: PracticeSet;
  attempts: Record<string, AttemptState>;
  hydrated: boolean;
}) {
  const progress = hydrated
    ? summarizeSetProgress(set, attempts)
    : {
        status: "not-started" as const,
        answered: 0,
        total: set.itemIds.length,
        correct: 0,
        isMcqSet: set.skill === "reading" || set.skill === "listening",
      };

  let badge = null;
  let progressBar = null;
  if (progress.status === "in-progress") {
    const pct = Math.round((progress.answered / progress.total) * 100);
    badge = (
      <span className="badge warning">
        진행 중 · {progress.answered}/{progress.total}
      </span>
    );
    progressBar = (
      <div className="progress set-progress" aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </div>
    );
  } else if (progress.status === "done") {
    badge = (
      <span className="badge">
        {progress.isMcqSet
          ? `완료 · 정답 ${progress.correct}/${progress.total}`
          : "자기평가 완료"}
      </span>
    );
    progressBar = (
      <div className="progress set-progress" aria-hidden="true">
        <span style={{ width: "100%" }} />
      </div>
    );
  }

  return (
    <a
      href={sitePath(`/practice/set/${set.id}`)}
      className="card flat block-link practice-set-card"
      data-mode={set.mode}
    >
      <div className="practice-set-meta">
        <span>{set.task?.replace("tarea", "Tarea ") ?? "종합"}</span>
        {badge}
      </div>
      <h4>{set.title}</h4>
      <p className="muted">
        약 {set.estimatedMin}분 · {set.itemIds.length}문항
      </p>
      {progressBar}
    </a>
  );
}

export function PracticeSetList({ sets }: { sets: PracticeSet[] }) {
  const { attempts, hydrated } = useAttempts();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 620px)");
    const syncFromUrl = () => {
      const next = readFilters();
      if (mobile.matches && next.skill === "all") {
        const mobileFilters = { ...next, skill: "reading" as const };
        writeFilters(mobileFilters, "replace");
        setFilters(mobileFilters);
      } else {
        setFilters(next);
      }
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    mobile.addEventListener("change", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      mobile.removeEventListener("change", syncFromUrl);
    };
  }, []);

  const updateFilter = useCallback(
    <K extends keyof PracticeCatalogFilters>(
      key: K,
      value: PracticeCatalogFilters[K],
    ) => {
      const next = { ...filters, [key]: value };
      writeFilters(next, "push");
      setFilters(next);
    },
    [filters],
  );

  const filteredSets = useMemo(
    () => filterPracticeSets(sets, filters),
    [sets, filters],
  );
  const highlight = hydrated ? pickCatalogHighlight(sets, attempts) : undefined;
  const visibleSkills =
    filters.skill === "all"
      ? skillOrder.filter((skill) =>
          filteredSets.some((set) => set.skill === skill),
        )
      : [filters.skill];

  return (
    <>
      <section className="page-section compact practice-catalog-intro">
        <div className="site-shell">
          {hydrated ? (
            highlight ? (
              <a
                className="practice-next-action"
                href={sitePath(`/practice/set/${highlight.set.id}`)}
              >
                <span className="eyebrow">
                  {highlight.kind === "continue" ? "이어하기" : "오늘 추천"}
                </span>
                <strong>{highlight.set.title}</strong>
                <span className="muted">
                  약 {highlight.set.estimatedMin}분 · 학습 열기 →
                </span>
              </a>
            ) : (
              <div className="notice">모든 단계별 연습을 완료했습니다.</div>
            )
          ) : (
            <div className="practice-next-action" aria-busy="true">
              <span className="eyebrow">학습 기록 확인 중</span>
              <span className="progress-loading-value" aria-hidden="true">&nbsp;</span>
            </div>
          )}

          <div className="practice-catalog-filters" aria-label="연습 세트 필터">
            <div className="field">
              <label htmlFor="practice-filter-mode">연습 방식</label>
              <select
                id="practice-filter-mode"
                value={filters.mode}
                onChange={(event) =>
                  updateFilter("mode", event.target.value as PracticeCatalogFilters["mode"])
                }
              >
                <option value="all">모든 방식</option>
                <option value="guided">단계별 연습</option>
                <option value="exam-prep">실전 대비</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="practice-filter-task">Tarea</label>
              <select
                id="practice-filter-task"
                value={filters.task}
                onChange={(event) =>
                  updateFilter("task", event.target.value as PracticeCatalogFilters["task"])
                }
              >
                <option value="all">모든 Tarea</option>
                {taskOrder.map((task, index) => (
                  <option key={task} value={task}>Tarea {index + 1}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <div className="practice-catalog-nav">
        <div className="site-shell">
          <PracticeTabs
            selectedSkill={filters.skill}
            onSelect={(skill) => updateFilter("skill", skill)}
          />
        </div>
      </div>

      {visibleSkills.map((skill) => {
        const skillSets = filteredSets.filter((set) => set.skill === skill);
        if (skillSets.length === 0) return null;
        return (
          <section className="page-section compact practice-skill-section" id={skill} key={skill}>
            <div className="site-shell">
              <p className="section-kicker">{skillLabels[skill].es}</p>
              <h2>{skillLabels[skill].ko}</h2>
              {modeOrder.map((mode) => {
                const modeSets = skillSets.filter(
                  (set) => set.mode === mode,
                );
                if (modeSets.length === 0) return null;
                return (
                  <div className="practice-mode-group" key={mode}>
                    <div className="practice-mode-heading">
                      <h3>{modeLabels[mode]}</h3>
                      <span className="muted">{modeSets.length}개 세트</span>
                    </div>
                    <div className="grid cols-2">
                      {modeSets.map((set) => (
                        <SetCard
                          key={set.id}
                          set={set}
                          attempts={attempts}
                          hydrated={hydrated}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {filteredSets.length === 0 && (
        <section className="page-section compact">
          <div className="site-shell notice" role="status">
            <strong>조건에 맞는 연습 세트가 없습니다.</strong>
            <p>연습 방식이나 Tarea 필터를 ‘전체’로 바꿔 보세요.</p>
          </div>
        </section>
      )}
    </>
  );
}
