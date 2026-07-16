"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ExamSectionSnapshot } from "@/lib/types";

type PaletteFilter = "all" | "answered" | "unanswered" | "flagged";

export interface ExamQuestionPaletteHandle {
  open: (opener: HTMLButtonElement) => void;
}

export function getPaletteItemState(
  itemId: string,
  answers: Record<string, string>,
  flaggedItemIds: readonly string[],
  currentItemId: string | null,
) {
  return {
    answerState: answers[itemId] ? ("answered" as const) : ("unanswered" as const),
    flagged: flaggedItemIds.includes(itemId),
    current: currentItemId === itemId,
  };
}

function useCurrentQuestion(itemIds: readonly string[]) {
  const [currentItemId, setCurrentItemId] = useState<string | null>(itemIds[0] ?? null);
  // ExamStore는 저장 후 JSON을 다시 읽어 동일한 section을 새 배열로 전달한다.
  // 문항 구성이 같을 때 observer를 재설치하면 방금 선택한 현재 문항이 초기
  // 측정으로 덮일 수 있으므로 실제 ID 목록이 바뀔 때만 effect를 갱신한다.
  const itemIdsKey = JSON.stringify(itemIds);

  useEffect(() => {
    const trackedItemIds = JSON.parse(itemIdsKey) as string[];
    if (trackedItemIds.length === 0) return;
    let frame = 0;
    let interactionLockUntil = 0;

    const markCurrent = (itemId: string) => {
      setCurrentItemId((previous) => (previous === itemId ? previous : itemId));
      for (const id of trackedItemIds) {
        const element = document.getElementById(id);
        if (element) element.dataset.current = id === itemId ? "true" : "false";
      }
    };

    const measure = () => {
      frame = 0;
      // Focusing a control can create a scroll just before pointerdown. Keep
      // that queued measurement from overwriting the question just operated.
      if (performance.now() < interactionLockUntil) return;
      const rootStyle = getComputedStyle(document.documentElement);
      const header = Number.parseFloat(rootStyle.getPropertyValue("--header-height")) || 0;
      const toolbar = Number.parseFloat(rootStyle.getPropertyValue("--context-bar-height")) || 0;
      const anchor = header + toolbar + 24;
      const entries = trackedItemIds
        .map((id) => ({ id, rect: document.getElementById(id)?.getBoundingClientRect() }))
        .filter((entry): entry is { id: string; rect: DOMRect } => entry.rect !== undefined);
      if (entries.length === 0) return;

      const covering = entries.filter(
        ({ rect }) => rect.top <= anchor && rect.bottom > anchor,
      );
      const nearest = covering.at(-1) ??
        entries
          .filter(({ rect }) => rect.top > anchor)
          .sort((a, b) => a.rect.top - b.rect.top)[0] ??
        entries.at(-1);
      if (nearest) markCurrent(nearest.id);
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };
    const markInteractedQuestion = (event: Event) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>("[data-item-id]")
        : null;
      const itemId = target?.dataset.itemId;
      if (itemId && trackedItemIds.includes(itemId)) {
        interactionLockUntil = performance.now() + 500;
        markCurrent(itemId);
      }
    };
    const observer = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(schedule, {
          rootMargin: "-15% 0px -65% 0px",
          threshold: [0, 0.01, 0.5, 1],
        });
    for (const id of trackedItemIds) {
      const element = document.getElementById(id);
      if (element) observer?.observe(element);
    }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // T3/T4 선택기는 sticky passage의 독립 scroll 또는 mobile dialog 안에 있어
    // main summary 위치가 변하지 않는다. 실제 조작 대상을 현재 문항으로 삼는다.
    document.addEventListener("focusin", markInteractedQuestion);
    document.addEventListener("pointerdown", markInteractedQuestion);
    schedule();
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("focusin", markInteractedQuestion);
      document.removeEventListener("pointerdown", markInteractedQuestion);
      for (const id of trackedItemIds) document.getElementById(id)?.removeAttribute("data-current");
    };
  }, [itemIdsKey]);

  return { currentItemId, setCurrentItemId };
}

export const ExamQuestionPalette = forwardRef<
  ExamQuestionPaletteHandle,
  {
    sections: readonly ExamSectionSnapshot[];
    answers: Record<string, string>;
    flaggedItemIds: readonly string[];
    numberByItemId: ReadonlyMap<string, number>;
  }
>(function ExamQuestionPalette(
  { sections, answers, flaggedItemIds, numberByItemId },
  ref,
) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const [filter, setFilter] = useState<PaletteFilter>("all");
  const itemIds = useMemo(
    () => sections.flatMap((section) => section.itemIds),
    [sections],
  );
  const { currentItemId, setCurrentItemId } = useCurrentQuestion(itemIds);

  useImperativeHandle(ref, () => ({
    open(opener) {
      openerRef.current = opener;
      if (window.matchMedia("(min-width: 901px)").matches) {
        asideRef.current?.focus();
      } else {
        dialogRef.current?.showModal();
      }
    },
  }), []);

  const closeDialog = () => dialogRef.current?.close();
  const navigate = (itemId: string) => {
    const reveal = () => {
      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;
      // 현재 문항 확정 전에 smooth scroll 중간 지점을 observer가 다시 선택하지 않게 한다.
      root.style.scrollBehavior = "auto";
      document.getElementById(itemId)?.scrollIntoView({ block: "start" });
      root.style.scrollBehavior = previousScrollBehavior;
      setCurrentItemId(itemId);
      for (const id of itemIds) {
        const element = document.getElementById(id);
        if (element) element.dataset.current = id === itemId ? "true" : "false";
      }
    };

    if (dialogRef.current?.open) {
      // WebKit은 dialog close의 포커스 복원으로 진행 중인 scroll을 취소할 수 있다.
      // 먼저 닫고 포커스가 opener로 돌아간 다음 실제 문항을 이동한다.
      closeDialog();
      window.requestAnimationFrame(reveal);
    } else {
      reveal();
    }
  };

  const content = (surface: "desktop" | "dialog") => (
    <div className="exam-palette-content" data-surface={surface}>
      <div className="exam-palette-filters" aria-label="문항 상태 필터">
        {([
          ["all", "전체"],
          ["answered", "응답"],
          ["unanswered", "미응답"],
          ["flagged", "별표"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="exam-palette-legend muted">
        <span><i data-state="answered" /> 응답</span>
        <span><i data-state="unanswered" /> 미응답</span>
        <span>★ 별표</span>
      </div>
      {sections.map((section) => {
        const visible = section.itemIds.filter((itemId) => {
          const state = getPaletteItemState(itemId, answers, flaggedItemIds, currentItemId);
          if (filter === "answered") return state.answerState === "answered";
          if (filter === "unanswered") return state.answerState === "unanswered";
          if (filter === "flagged") return state.flagged;
          return true;
        });
        if (visible.length === 0) return null;
        return (
          <section className="exam-palette-section" key={section.task}>
            <h3>{section.task.replace("tarea", "Tarea ")}</h3>
            <div className="exam-palette-grid">
              {visible.map((itemId) => {
                const state = getPaletteItemState(itemId, answers, flaggedItemIds, currentItemId);
                const number = numberByItemId.get(itemId) ?? 0;
                return (
                  <button
                    key={itemId}
                    type="button"
                    data-item-id={itemId}
                    data-state={state.answerState}
                    data-flagged={String(state.flagged)}
                    aria-current={state.current ? "true" : undefined}
                    aria-label={`${number}번 · ${state.answerState === "answered" ? "응답" : "미응답"}${state.flagged ? " · 별표" : ""}`}
                    onClick={() => navigate(itemId)}
                  >
                    {state.flagged && <span aria-hidden="true">★</span>}
                    {number}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );

  return (
    <>
      <aside
        ref={asideRef}
        className="exam-question-palette"
        aria-label="문항 목록"
        tabIndex={-1}
      >
        <h2>문항 목록</h2>
        {content("desktop")}
      </aside>
      <dialog
        ref={dialogRef}
        className="exam-palette-dialog"
        aria-labelledby="exam-palette-dialog-title"
        onClose={() => openerRef.current?.focus()}
      >
        <div className="dialog-heading">
          <h2 id="exam-palette-dialog-title">문항 목록</h2>
          <button className="button secondary small" type="button" onClick={closeDialog}>닫기</button>
        </div>
        {content("dialog")}
      </dialog>
    </>
  );
});
