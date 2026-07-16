import type {
  ExamItemContract,
  PresentationSlot,
  ReadingPresentationContract,
} from "./types";

export interface ReadingPresentationValidationIssue {
  field: "presentation" | "passage";
  message: string;
}

export interface ReadingPresentationValidationInput {
  presentation: unknown;
  itemIds: readonly string[];
  items: readonly Pick<ExamItemContract, "id" | "options" | "correctAnswer">[];
  passages: readonly string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
}

function validateSharedOptions(value: unknown): ReadingPresentationValidationIssue[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [{ field: "presentation", message: "Shared options must be a non-empty array" }];
  }

  const keys: string[] = [];
  for (const option of value) {
    if (
      !isRecord(option) ||
      !hasExactKeys(option, ["key", "text"]) ||
      typeof option.key !== "string" ||
      typeof option.text !== "string" ||
      !option.key.trim() ||
      !option.text.trim()
    ) {
      return [
        {
          field: "presentation",
          message: "Shared option keys and text must be non-empty strings",
        },
      ];
    }
    keys.push(option.key);
  }
  if (new Set(keys).size !== keys.length) {
    return [{ field: "presentation", message: "Shared option keys must be unique" }];
  }
  return [];
}

function validateSlots(value: unknown): ReadingPresentationValidationIssue[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [{ field: "presentation", message: "Presentation slots must be a non-empty array" }];
  }
  for (const slot of value) {
    if (
      !isRecord(slot) ||
      !hasExactKeys(slot, ["slot", "itemId"]) ||
      typeof slot.slot !== "number" ||
      !Number.isInteger(slot.slot) ||
      slot.slot < 1 ||
      typeof slot.itemId !== "string" ||
      !slot.itemId.trim()
    ) {
      return [
        {
          field: "presentation",
          message: "Each presentation slot needs a positive integer slot and non-empty itemId",
        },
      ];
    }
  }
  return [];
}

export function validateReadingPresentationShape(
  value: unknown,
): ReadingPresentationValidationIssue[] {
  if (!isRecord(value) || typeof value.kind !== "string") {
    return [{ field: "presentation", message: "Invalid reading presentation contract" }];
  }

  if (value.kind === "mcq") {
    return hasExactKeys(value, ["kind"])
      ? []
      : [{ field: "presentation", message: "Invalid MCQ presentation contract" }];
  }

  if (value.kind === "matching") {
    if (!hasExactKeys(value, ["kind", "sharedOptions", "optionUse"])) {
      return [{ field: "presentation", message: "Invalid matching presentation contract" }];
    }
    if (value.optionUse !== "single-use" && value.optionUse !== "reusable") {
      return [{ field: "presentation", message: "Invalid matching optionUse" }];
    }
    return validateSharedOptions(value.sharedOptions);
  }

  if (value.kind === "sentence-insertion") {
    if (!hasExactKeys(value, ["kind", "sharedOptions", "optionUse", "slots"])) {
      return [
        { field: "presentation", message: "Invalid sentence-insertion presentation contract" },
      ];
    }
    if (value.optionUse !== "single-use") {
      return [{ field: "presentation", message: "Invalid sentence-insertion optionUse" }];
    }
    return [
      ...validateSharedOptions(value.sharedOptions),
      ...validateSlots(value.slots),
    ];
  }

  if (value.kind === "cloze") {
    if (!hasExactKeys(value, ["kind", "slots"])) {
      return [{ field: "presentation", message: "Invalid cloze presentation contract" }];
    }
    return validateSlots(value.slots);
  }

  return [{ field: "presentation", message: "Invalid reading presentation contract" }];
}

export function isReadingPresentationContract(
  value: unknown,
): value is ReadingPresentationContract {
  return validateReadingPresentationShape(value).length === 0;
}

export function cloneReadingPresentationContract(
  presentation: ReadingPresentationContract,
): ReadingPresentationContract {
  switch (presentation.kind) {
    case "mcq":
      return { kind: "mcq" };
    case "matching":
      return {
        kind: "matching",
        sharedOptions: presentation.sharedOptions.map((option) => ({ ...option })),
        optionUse: presentation.optionUse,
      };
    case "sentence-insertion":
      return {
        kind: "sentence-insertion",
        sharedOptions: presentation.sharedOptions.map((option) => ({ ...option })),
        optionUse: "single-use",
        slots: presentation.slots.map((slot) => ({ ...slot })),
      };
    case "cloze":
      return {
        kind: "cloze",
        slots: presentation.slots.map((slot) => ({ ...slot })),
      };
  }
}

export function scanReadingSlotMarkers(passage: string): {
  slots: number[];
  malformed: boolean;
} {
  // slot처럼 보이는 모든 괄호 토큰을 먼저 잡고 exact 계약으로 판정한다.
  // 콜론이 빠진 [[slot 2]], 구분자가 틀린 [[slot-2]]도 평문으로 새지 않는다.
  const markerLike = /\[+\s*slot[^\]\r\n]*(?:\]+|$)/gi;
  const slots: number[] = [];
  let malformed = false;
  for (const match of passage.matchAll(markerLike)) {
    const exact = /^\[\[slot:([1-9]\d*)\]\]$/.exec(match[0]);
    if (exact) slots.push(Number(exact[1]));
    else malformed = true;
  }
  return { slots, malformed };
}

function validateSlotMapping(
  slots: readonly PresentationSlot[],
  itemIds: readonly string[],
): ReadingPresentationValidationIssue[] {
  const slotNumbers = slots.map((entry) => entry.slot);
  const expectedNumbers = slots.map((_, index) => index + 1);
  if (slotNumbers.some((slot, index) => slot !== expectedNumbers[index])) {
    return [{ field: "presentation", message: "Slots must be contiguous from 1 in order" }];
  }

  const mappedItemIds = slots.map((entry) => entry.itemId);
  if (new Set(mappedItemIds).size !== mappedItemIds.length) {
    return [{ field: "presentation", message: "Slot item IDs must be unique" }];
  }
  const expectedIds = new Set(itemIds);
  if (
    mappedItemIds.length !== itemIds.length ||
    mappedItemIds.some((itemId) => !expectedIds.has(itemId))
  ) {
    return [
      {
        field: "presentation",
        message: "Slots and set item IDs must have a one-to-one mapping",
      },
    ];
  }
  return [];
}

function optionsMatch(
  sharedOptions: readonly { key: string; text: string }[],
  itemOptions: readonly { key: string; text: string }[],
): boolean {
  if (sharedOptions.length !== itemOptions.length) return false;
  const itemByKey = new Map(itemOptions.map((option) => [option.key, option.text]));
  return sharedOptions.every((option) => itemByKey.get(option.key) === option.text);
}

export function validateReadingPresentationContent({
  presentation,
  itemIds,
  items,
  passages,
}: ReadingPresentationValidationInput): ReadingPresentationValidationIssue[] {
  const shapeIssues = validateReadingPresentationShape(presentation);
  if (shapeIssues.length > 0) return shapeIssues;

  const contract = presentation as ReadingPresentationContract;
  const issues: ReadingPresentationValidationIssue[] = [];
  if (contract.kind === "matching" || contract.kind === "sentence-insertion") {
    for (const item of items) {
      if (!optionsMatch(contract.sharedOptions, item.options)) {
        issues.push({
          field: "presentation",
          message: `Item ${item.id} options do not match the shared option key and text contract`,
        });
      }
    }
    if (contract.optionUse === "single-use") {
      const answers = items.map((item) => item.correctAnswer);
      if (new Set(answers).size !== answers.length) {
        issues.push({
          field: "presentation",
          message: "Single-use presentations require unique correct answers",
        });
      }
    }
  }

  if (contract.kind === "sentence-insertion" || contract.kind === "cloze") {
    issues.push(...validateSlotMapping(contract.slots, itemIds));

    const scans = passages.map(scanReadingSlotMarkers);
    if (scans.some((scan) => scan.malformed)) {
      issues.push({ field: "passage", message: "Passage contains a malformed slot marker" });
    }
    const markerCounts = new Map<number, number>();
    for (const scan of scans) {
      for (const slot of scan.slots) {
        markerCounts.set(slot, (markerCounts.get(slot) ?? 0) + 1);
      }
    }
    const expectedSlots = new Set(contract.slots.map((entry) => entry.slot));
    if (
      contract.slots.some((entry) => markerCounts.get(entry.slot) !== 1) ||
      [...markerCounts.keys()].some((slot) => !expectedSlots.has(slot))
    ) {
      issues.push({
        field: "passage",
        message: "Every presentation slot marker must appear exactly once with no extras",
      });
    }
  }

  return issues;
}
