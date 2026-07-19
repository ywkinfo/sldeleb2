import { describe, expect, it } from "vitest";
import { examBlueprints } from "@/data/examBlueprints";
import { listeningScripts } from "@/data/listeningScripts";
import { officialResources } from "@/data/officialResources";
import { practiceItems } from "@/data/practiceItems";
import {
  anioFueraOptions,
  semanaCuatroFragments,
} from "@/data/readingPresentationOptions";
import { practiceSets } from "@/data/practiceSets";
import { readingTexts } from "@/data/readingTexts";
import { isReadingPresentationContract } from "@/lib/readingPresentation";
import type {
  PracticeItem,
  PracticeSet,
  ReadingPresentationContract,
  ReadingText,
} from "@/lib/types";
import { validateContent, type ContentCollections } from "@/lib/validate";

const real: ContentCollections = {
  officialResources,
  readingTexts,
  listeningScripts,
  practiceItems,
  practiceSets,
  examBlueprints,
};

function findSet(id: string): PracticeSet {
  const set = practiceSets.find((candidate) => candidate.id === id);
  if (!set) throw new Error(`Missing set fixture: ${id}`);
  return set;
}

function withSet(id: string, update: (set: PracticeSet) => PracticeSet): ContentCollections {
  return {
    ...real,
    practiceSets: practiceSets.map((set) => (set.id === id ? update(set) : set)),
  };
}

function withText(id: string, passage: string): ContentCollections {
  return {
    ...real,
    readingTexts: readingTexts.map((text) =>
      text.id === id ? ({ ...text, passage } satisfies ReadingText) : text,
    ),
  };
}

function withItem(id: string, update: (item: PracticeItem) => PracticeItem): ContentCollections {
  return {
    ...real,
    practiceItems: practiceItems.map((item) => (item.id === id ? update(item) : item)),
  };
}

const presentationIssues = (collections: ContentCollections) =>
  validateContent(collections).filter(
    (issue) => issue.field === "presentation" || issue.field === "passage",
  );

describe("reading presentation shape", () => {
  it("accepts all supported kinds and rejects malformed exact shapes", () => {
    const valid: ReadingPresentationContract[] = [
      { kind: "mcq" },
      { kind: "matching", sharedOptions: anioFueraOptions, optionUse: "reusable" },
      {
        kind: "sentence-insertion",
        sharedOptions: semanaCuatroFragments,
        optionUse: "single-use",
        slots: [{ slot: 1, itemId: "item-1" }],
      },
      { kind: "cloze", slots: [{ slot: 1, itemId: "item-1" }] },
    ];
    const invalid = [
      { kind: "mcq", slots: [] },
      { kind: "matching", sharedOptions: anioFueraOptions, optionUse: "sometimes" },
      { kind: "matching", sharedOptions: [{ key: "", text: "A" }], optionUse: "reusable" },
      {
        kind: "sentence-insertion",
        sharedOptions: semanaCuatroFragments,
        optionUse: "reusable",
        slots: [{ slot: 1, itemId: "item-1" }],
      },
      { kind: "cloze", slots: [{ slot: 0, itemId: "item-1" }] },
    ];

    expect(valid.every(isReadingPresentationContract)).toBe(true);
    expect(invalid.every((value) => !isReadingPresentationContract(value))).toBe(true);
  });
});

describe("shipped reading presentation content", () => {
  it("ships blueprint v2 and explicit Tarea 1–4 contracts", () => {
    expect(examBlueprints.find((blueprint) => blueprint.id === "exam-reading-b2")?.version).toBe(2);
    expect(findSet("set-reading-library").presentation).toEqual({ kind: "mcq" });
    expect(findSet("set-reading-anio-fuera").presentation).toMatchObject({
      kind: "matching",
      optionUse: "reusable",
    });
    expect(findSet("set-reading-semana-cuatro").presentation).toEqual({
      kind: "sentence-insertion",
      sharedOptions: semanaCuatroFragments,
      optionUse: "single-use",
      slots: Array.from({ length: 6 }, (_, index) => ({
        slot: index + 1,
        itemId: `r-sem4-${String(index + 1).padStart(2, "0")}`,
      })),
    });
    expect(findSet("set-reading-podcast").presentation).toEqual({
      kind: "cloze",
      slots: Array.from({ length: 14 }, (_, index) => ({
        slot: index + 1,
        itemId: `r-pod-${String(index + 1).padStart(2, "0")}`,
      })),
    });
  });

  it("reuses shared option constants in both sets and every item", () => {
    const matching = findSet("set-reading-anio-fuera").presentation;
    const insertion = findSet("set-reading-semana-cuatro").presentation;
    if (matching?.kind !== "matching" || insertion?.kind !== "sentence-insertion") {
      throw new Error("Expected shared-option presentations");
    }
    expect(matching.sharedOptions).toBe(anioFueraOptions);
    expect(insertion.sharedOptions).toBe(semanaCuatroFragments);
    for (const item of practiceItems) {
      if (item.kind !== "mcq") continue;
      if (item.id.startsWith("r-anio-")) expect(item.options).toBe(anioFueraOptions);
      if (item.id.startsWith("r-sem4-")) expect(item.options).toBe(semanaCuatroFragments);
    }
  });

  it("uses one canonical marker for each Tarea 3 and 4 slot and remains valid", () => {
    for (const [textId, count] of [
      ["reading-t3-semana-cuatro", 6],
      ["reading-t4-podcast", 14],
    ] as const) {
      const passage = readingTexts.find((text) => text.id === textId)?.passage ?? "";
      expect(
        [...passage.matchAll(/\[\[slot:([1-9]\d*)\]\]/g)].map((match) => Number(match[1])),
      ).toEqual(Array.from({ length: count }, (_, index) => index + 1));
    }
    expect(validateContent(real)).toEqual([]);
  });
});

describe("reading presentation validation", () => {
  it("rejects non-reading ownership and malformed contracts", () => {
    const listening = withSet("set-listening-t1", (set) => ({
      ...set,
      presentation: { kind: "mcq" },
    }));
    const malformed = withSet("set-reading-anio-fuera", (set) => ({
      ...set,
      presentation: {
        kind: "matching",
        sharedOptions: anioFueraOptions,
        optionUse: "sometimes",
      } as never,
    }));
    expect(presentationIssues(listening).some((issue) => /reading/i.test(issue.message))).toBe(true);
    expect(presentationIssues(malformed).some((issue) => /invalid/i.test(issue.message))).toBe(true);
  });

  it("rejects non-contiguous, duplicate, missing and extra slot mappings", () => {
    const original = findSet("set-reading-semana-cuatro").presentation;
    if (original?.kind !== "sentence-insertion") throw new Error("Expected insertion");
    const cases: ReadingPresentationContract[] = [
      { ...original, slots: original.slots.map((slot, index) => (index ? slot : { ...slot, slot: 2 })) },
      { ...original, slots: original.slots.map((slot, index) => (index === 1 ? { ...slot, itemId: original.slots[0].itemId } : slot)) },
      { ...original, slots: original.slots.slice(0, -1) },
      { ...original, slots: [...original.slots, { slot: 7, itemId: "ghost" }] },
    ];
    for (const presentation of cases) {
      const issues = presentationIssues(
        withSet("set-reading-semana-cuatro", (set) => ({ ...set, presentation })),
      );
      expect(issues.some((issue) => /slot|item/i.test(issue.message))).toBe(true);
    }
  });

  it("rejects missing, duplicate, extra and malformed sentence markers", () => {
    const text = readingTexts.find((candidate) => candidate.id === "reading-t3-semana-cuatro");
    if (!text) throw new Error("Expected insertion passage");
    const cases = [
      text.passage.replace("[[slot:1]]", ""),
      `${text.passage}\n[[slot:1]]`,
      `${text.passage}\n[[slot:7]]`,
      `${text.passage}\n[[slot 99]]`,
      `${text.passage}\n[[slot-7]]`,
      text.passage.replace("[[slot:1]]", "[[slot:x]]"),
      text.passage.replace("[[slot:1]]", "[[slot:1]]]"),
    ];
    for (const passage of cases) {
      expect(
        presentationIssues(withText(text.id, passage)).some((issue) => /marker/i.test(issue.message)),
      ).toBe(true);
    }
  });

  it("applies the same exact-once marker rule to cloze passages", () => {
    const text = readingTexts.find((candidate) => candidate.id === "reading-t4-podcast");
    if (!text) throw new Error("Expected cloze passage");
    const passage = text.passage.replace("[[slot:14]]", "[[slot:13]]");
    expect(
      presentationIssues(withText(text.id, passage)).some((issue) => /marker/i.test(issue.message)),
    ).toBe(true);
  });

  it("rejects shared key duplication/emptiness and item option key/text drift", () => {
    const original = findSet("set-reading-anio-fuera").presentation;
    if (original?.kind !== "matching") throw new Error("Expected matching");
    const duplicate: ReadingPresentationContract = {
      ...original,
      sharedOptions: original.sharedOptions.map((option, index) =>
        index === 1 ? { ...option, key: original.sharedOptions[0].key } : option,
      ),
    };
    const empty: ReadingPresentationContract = {
      ...original,
      sharedOptions: original.sharedOptions.map((option, index) =>
        index === 0 ? { ...option, key: "" } : option,
      ),
    };
    for (const presentation of [duplicate, empty]) {
      expect(
        presentationIssues(
          withSet("set-reading-anio-fuera", (set) => ({ ...set, presentation })),
        ).some((issue) => /shared option/i.test(issue.message)),
      ).toBe(true);
    }

    const drift = withItem("r-anio-01", (item) =>
      item.kind === "mcq"
        ? {
            ...item,
            options: item.options.map((option, index) =>
              index === 0 ? { ...option, text: `${option.text} cambiado` } : option,
            ),
          }
        : item,
    );
    expect(presentationIssues(drift).some((issue) => /shared option/i.test(issue.message))).toBe(true);
  });

  it("rejects duplicate answers for single-use while reusable matching remains valid", () => {
    const duplicateInsertion = withItem("r-sem4-02", (item) =>
      item.kind === "mcq" ? { ...item, correctAnswer: "c" } : item,
    );
    const singleUseMatching = withSet("set-reading-anio-fuera", (set) => {
      const presentation = set.presentation;
      return presentation?.kind === "matching"
        ? { ...set, presentation: { ...presentation, optionUse: "single-use" } }
        : set;
    });
    expect(
      presentationIssues(duplicateInsertion).some((issue) => /single-use/i.test(issue.message)),
    ).toBe(true);
    expect(
      presentationIssues(singleUseMatching).some((issue) => /single-use/i.test(issue.message)),
    ).toBe(true);
    expect(validateContent(real)).toEqual([]);
  });
});
