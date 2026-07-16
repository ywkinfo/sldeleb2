"use client";

import type { ReadingPresentationContract } from "@/lib/types";
import { handleMcqKeyDown, type McqOption } from "./McqOptions";
import { ReadingWorkspace } from "./ReadingWorkspace";

export type NonMcqReadingPresentation = Exclude<
  ReadingPresentationContract,
  { kind: "mcq" }
>;

export interface ReadingPresentationItem {
  id: string;
  prompt: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanationKo: string;
}

export interface ReadingPresentationItemState {
  value?: string;
  disabled?: boolean;
  result?: { correct: boolean; correctAnswer: string };
}

export type ReadingPassageToken =
  | { kind: "text"; text: string }
  | { kind: "slot"; slot: number };

export function getReadingPresentationKind(
  presentation: ReadingPresentationContract | undefined,
): ReadingPresentationContract["kind"] {
  return presentation?.kind ?? "mcq";
}

export function parseReadingPresentationPassage(
  passage: string,
): ReadingPassageToken[] {
  const marker = /\[\[slot:(\d+)\]\]/g;
  const tokens: ReadingPassageToken[] = [];
  let cursor = 0;
  for (const match of passage.matchAll(marker)) {
    const index = match.index;
    if (index > cursor) tokens.push({ kind: "text", text: passage.slice(cursor, index) });
    tokens.push({ kind: "slot", slot: Number(match[1]) });
    cursor = index + match[0].length;
  }
  if (cursor < passage.length) tokens.push({ kind: "text", text: passage.slice(cursor) });
  return tokens;
}

export function findPresentationSlot(
  presentation: ReadingPresentationContract,
  slot: number,
) {
  return "slots" in presentation
    ? presentation.slots.find((candidate) => candidate.slot === slot)
    : undefined;
}

export function getDuplicateOptionKeys(
  presentation: ReadingPresentationContract,
  answers: Readonly<Record<string, string | undefined>>,
): string[] {
  const singleUse =
    (presentation.kind === "matching" && presentation.optionUse === "single-use") ||
    presentation.kind === "sentence-insertion";
  if (!singleUse) return [];

  const values = presentation.kind === "sentence-insertion"
    ? presentation.slots.map(({ itemId }) => answers[itemId])
    : Object.values(answers);
  const counts = new Map<string, number>();
  for (const value of values) {
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts)
    .filter(([, count]) => count > 1)
    .map(([key]) => key);
}

function OptionBank({
  id,
  options,
  reusable,
}: {
  id: string;
  options: McqOption[];
  reusable: boolean;
}) {
  return (
    <section className="presentation-option-bank" lang="ko" aria-labelledby={`${id}-title`}>
      <div className="presentation-option-bank-head">
        <h3 id={`${id}-title`}>공통 선택지</h3>
        <span className="badge">{reusable ? "여러 번 사용 가능" : "각 선택지 한 번 사용"}</span>
      </div>
      <ol>
        {options.map((option) => (
          <li key={option.key}>
            <strong>{option.key.toUpperCase()}</strong>
            <span lang="es">{option.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function DuplicateWarning({ compact = false }: { compact?: boolean }) {
  return (
    <p
      className={`presentation-duplicate-warning ${compact ? "compact" : ""}`}
      lang="ko"
      role="status"
    >
      같은 선택지를 다른 위치에서도 사용했습니다. 단일 사용 규칙을 다시 확인하세요.
    </p>
  );
}

function ChoiceControl({
  item,
  number,
  slot,
  options,
  state,
  duplicate,
  showOptionText,
  onSelect,
}: {
  item: ReadingPresentationItem;
  number: number;
  slot?: number;
  options: McqOption[];
  state: ReadingPresentationItemState;
  duplicate: boolean;
  showOptionText: boolean;
  onSelect: (key: string) => void;
}) {
  const context = slot === undefined ? `${number}번 매칭` : `${number}번 빈칸 ${slot}`;
  const selected = options.find((option) => option.key === state.value);

  return (
    <div
      className="presentation-choice-control"
      lang="ko"
      data-item-id={item.id}
      data-slot={slot}
      onKeyDown={(event) =>
        handleMcqKeyDown(event, {
          options,
          canSelect: !state.disabled,
          currentKey: state.value,
          onSelect,
        })
      }
    >
      <div
        className={`presentation-choice-buttons ${showOptionText ? "with-text" : "keys-only"}`}
        role="radiogroup"
        aria-label={`${context} 선택지`}
      >
        {options.map((option, index) => {
          const isSelected = state.value === option.key;
          const isCorrect = state.result?.correctAnswer === option.key;
          const isWrong = isSelected && state.result !== undefined && !state.result.correct;
          return (
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${context}, 선택지 ${option.key.toUpperCase()}: ${option.text}`}
              tabIndex={isSelected || (!state.value && index === 0) ? 0 : -1}
              disabled={state.disabled}
              data-key={option.key}
              className={`presentation-choice ${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
              key={option.key}
              onClick={() => {
                if (!state.disabled) onSelect(option.key);
              }}
            >
              <span className="option-key">{option.key.toUpperCase()}</span>
              {showOptionText && <span lang="es">{option.text}</span>}
              {isCorrect && state.disabled && <span className="option-state is-correct">✓</span>}
              {isWrong && <span className="option-state is-wrong">✕</span>}
            </button>
          );
        })}
      </div>
      {!showOptionText && selected && (
        <p className="presentation-selection muted">
          선택: <strong>{selected.key.toUpperCase()}</strong> · <span lang="es">{selected.text}</span>
        </p>
      )}
      {duplicate && <DuplicateWarning compact />}
    </div>
  );
}

function PassageWithSlots({
  presentation,
  passage,
  itemById,
  numberForItem,
  stateByItemId,
  duplicateKeys,
  onSelect,
}: {
  presentation: Extract<NonMcqReadingPresentation, { slots: unknown }>;
  passage: string;
  itemById: ReadonlyMap<string, ReadingPresentationItem>;
  numberForItem: (itemId: string) => number;
  stateByItemId: Readonly<Record<string, ReadingPresentationItemState>>;
  duplicateKeys: ReadonlySet<string>;
  onSelect: (itemId: string, key: string) => void;
}) {
  return (
    <div className="presentation-passage-slots">
      {parseReadingPresentationPassage(passage).map((token, index) => {
        if (token.kind === "text") return <span key={`text-${index}`}>{token.text}</span>;
        const mapping = findPresentationSlot(presentation, token.slot);
        const item = mapping ? itemById.get(mapping.itemId) : undefined;
        if (!mapping || !item) {
          return (
            <span className="storage-warning" lang="ko" key={`slot-${token.slot}`}>
              빈칸 {token.slot}을 불러올 수 없습니다.
            </span>
          );
        }
        const options = presentation.kind === "sentence-insertion"
          ? presentation.sharedOptions
          : item.options;
        const state = stateByItemId[item.id] ?? {};
        return (
          <section
            className="presentation-slot-control"
            lang="ko"
            id={`${item.id}-slot-control`}
            data-slot={token.slot}
            key={`slot-${token.slot}`}
            aria-labelledby={`${item.id}-slot-label`}
          >
            <h3 id={`${item.id}-slot-label`}>
              빈칸 {token.slot} <span className="muted">· {numberForItem(item.id)}번</span>
            </h3>
            <ChoiceControl
              item={item}
              number={numberForItem(item.id)}
              slot={token.slot}
              options={options}
              state={state}
              duplicate={state.value ? duplicateKeys.has(state.value) : false}
              showOptionText={presentation.kind === "cloze"}
              onSelect={(key) => onSelect(item.id, key)}
            />
          </section>
        );
      })}
    </div>
  );
}

export function ReadingPresentation({
  presentation,
  title,
  titleId,
  passage,
  items,
  numberForItem,
  stateByItemId,
  onSelect,
  renderItemSupplement,
}: {
  presentation: NonMcqReadingPresentation;
  title: string;
  titleId: string;
  passage: string;
  items: readonly ReadingPresentationItem[];
  numberForItem: (itemId: string) => number;
  stateByItemId: Readonly<Record<string, ReadingPresentationItemState>>;
  onSelect: (itemId: string, key: string) => void;
  renderItemSupplement?: (item: ReadingPresentationItem) => React.ReactNode;
}) {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const scopedAnswers = Object.fromEntries(
    items.map((item) => [item.id, stateByItemId[item.id]?.value]),
  );
  const duplicateKeys = new Set(getDuplicateOptionKeys(presentation, scopedAnswers));
  const slotByItemId = "slots" in presentation
    ? new Map(presentation.slots.map((slot) => [slot.itemId, slot.slot]))
    : new Map<string, number>();

  const sharedBank = "sharedOptions" in presentation ? (
    <OptionBank
      id={`${titleId}-bank`}
      options={presentation.sharedOptions}
      reusable={presentation.optionUse === "reusable"}
    />
  ) : null;

  const passageContent = presentation.kind === "matching" ? (
    <>
      <span>{passage}</span>
      {sharedBank}
    </>
  ) : (
    <>
      {sharedBank}
      <PassageWithSlots
        presentation={presentation}
        passage={passage}
        itemById={itemById}
        numberForItem={numberForItem}
        stateByItemId={stateByItemId}
        duplicateKeys={duplicateKeys}
        onSelect={onSelect}
      />
    </>
  );

  return (
    <div className="reading-presentation" data-presentation-kind={presentation.kind}>
      <ReadingWorkspace
        title={title}
        titleId={titleId}
        passage={passage}
        passageContent={passageContent}
      >
        {items.map((item) => {
          const state = stateByItemId[item.id] ?? {};
          const slot = slotByItemId.get(item.id);
          const selectedOption = (presentation.kind === "sentence-insertion"
            ? presentation.sharedOptions
            : item.options).find((option) => option.key === state.value);
          const duplicate = state.value ? duplicateKeys.has(state.value) : false;
          return (
            <section
              className="question presentation-question-summary"
              id={item.id}
              data-presentation-summary="true"
              key={item.id}
              aria-labelledby={`${item.id}-prompt`}
            >
              <h3 id={`${item.id}-prompt`}>
                {numberForItem(item.id)}. <span lang="es">{item.prompt}</span>
              </h3>
              {presentation.kind === "matching" ? (
                <ChoiceControl
                  item={item}
                  number={numberForItem(item.id)}
                  options={presentation.sharedOptions}
                  state={state}
                  duplicate={duplicate}
                  showOptionText={false}
                  onSelect={(key) => onSelect(item.id, key)}
                />
              ) : (
                <>
                  <p className="presentation-summary-selection">
                    빈칸 {slot ?? "–"} · {selectedOption
                      ? <><strong>{selectedOption.key.toUpperCase()}</strong> <span lang="es">{selectedOption.text}</span></>
                      : <span className="muted">아직 선택하지 않음</span>}
                  </p>
                  {duplicate && (
                    <p className="presentation-duplicate-warning compact">
                      같은 선택지가 다른 위치에서도 사용 중입니다.
                    </p>
                  )}
                </>
              )}
              {renderItemSupplement?.(item)}
            </section>
          );
        })}
      </ReadingWorkspace>
    </div>
  );
}
