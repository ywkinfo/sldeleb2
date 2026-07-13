"use client";

export interface McqOption {
  key: string;
  text: string;
}

export type McqOptionState = "correct" | "wrong";

/**
 * 문항 컨테이너의 keydown 공용 규약: 문자키(A~)로 선택, 방향키로 순환
 * 이동+선택, 옵션 위 Enter/Space는 해당 옵션 선택, 그 외 Enter는 onSubmit.
 * 연습(McqQuestion)과 시험(ExamQuestion)이 동일한 동작을 공유한다.
 */
export function handleMcqKeyDown(
  event: React.KeyboardEvent<HTMLElement>,
  {
    options,
    canSelect,
    currentKey,
    onSelect,
    onSubmit,
  }: {
    options: McqOption[];
    canSelect: boolean;
    currentKey?: string;
    onSelect: (key: string) => void;
    onSubmit?: () => void;
  },
) {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const target = event.target as HTMLElement;
  if (target.closest("input, textarea, select, audio")) return;

  const letterIndex = /^Key[A-Z]$/.test(event.code) ? event.code.charCodeAt(3) - 65 : -1;
  if (letterIndex >= 0 && letterIndex < options.length) {
    event.preventDefault();
    if (canSelect) {
      onSelect(options[letterIndex].key);
    }
    return;
  }

  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
    if (!canSelect) return;
    const optionNodes = Array.from(event.currentTarget.querySelectorAll('[role="radio"]')) as HTMLElement[];
    const currentIndex = currentKey ? options.findIndex((o) => o.key === currentKey) : 0;
    let nextIndex = currentIndex;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % options.length;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + options.length) % options.length;
    }
    event.preventDefault();
    onSelect(options[nextIndex].key);
    optionNodes[nextIndex]?.focus();
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    const isOption = target.getAttribute("role") === "radio";
    if (isOption) {
      if (event.key === " ") {
        event.preventDefault();
        if (canSelect) onSelect(target.getAttribute("data-key") || "");
      }
      return; // Enter는 native click을 발생시킴
    }
    if (target.closest(".question-actions")) return;
    event.preventDefault();
    if (canSelect) onSubmit?.();
  }
}

/** 선택지 radiogroup 렌더 — 선택·잠금·정오 배지 표시만 담당한다. */
export function McqOptions({
  options,
  ariaLabel,
  value,
  disabled = false,
  onSelect,
  stateByKey,
}: {
  options: McqOption[];
  ariaLabel: string;
  value?: string;
  disabled?: boolean;
  onSelect: (key: string) => void;
  stateByKey?: Partial<Record<string, McqOptionState>>;
}) {
  return (
    <div className="options" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option, index) => {
        const isSelected = value === option.key;
        const state = stateByKey?.[option.key];
        const isTabable = isSelected || (!value && index === 0);

        return (
          <button
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isTabable ? 0 : -1}
            disabled={disabled}
            data-key={option.key}
            className={`option ${isSelected ? "selected" : ""} ${state === "correct" ? "correct" : ""} ${state === "wrong" ? "wrong" : ""}`}
            key={option.key}
            onClick={() => {
              if (!disabled) onSelect(option.key);
            }}
          >
            <span className="option-key">{option.key.toUpperCase()}</span>
            <span lang="es">{option.text}</span>
            {state === "correct" && <span className="option-state is-correct">✓ 정답</span>}
            {state === "wrong" && <span className="option-state is-wrong">✕ 내 선택</span>}
          </button>
        );
      })}
    </div>
  );
}
