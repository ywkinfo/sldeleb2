import { describe, expect, it } from "vitest";
import type { ReadingPresentationContract } from "@/lib/types";
import {
  findPresentationSlot,
  getDuplicateOptionKeys,
  getReadingPresentationKind,
  parseReadingPresentationPassage,
} from "@/components/ReadingPresentation";

describe("reading presentation helpers", () => {
  it("falls back to mcq when no presentation contract is stored", () => {
    expect(getReadingPresentationKind(undefined)).toBe("mcq");
    expect(getReadingPresentationKind({ kind: "mcq" })).toBe("mcq");
  });

  it("replaces exact slot markers with ordered slot tokens", () => {
    expect(
      parseReadingPresentationPassage(
        "Antes [[slot:1]] después.\nLuego [[slot:2]].",
      ),
    ).toEqual([
      { kind: "text", text: "Antes " },
      { kind: "slot", slot: 1 },
      { kind: "text", text: " después.\nLuego " },
      { kind: "slot", slot: 2 },
      { kind: "text", text: "." },
    ]);
  });

  it("reports duplicate keys only for single-use presentations", () => {
    const singleUse: ReadingPresentationContract = {
      kind: "sentence-insertion",
      optionUse: "single-use",
      sharedOptions: [
        { key: "a", text: "A" },
        { key: "b", text: "B" },
      ],
      slots: [
        { slot: 1, itemId: "q1" },
        { slot: 2, itemId: "q2" },
      ],
    };
    const reusable: ReadingPresentationContract = {
      kind: "matching",
      optionUse: "reusable",
      sharedOptions: singleUse.sharedOptions,
    };

    expect(getDuplicateOptionKeys(singleUse, { q1: "a", q2: "a", q3: "b" })).toEqual(["a"]);
    expect(getDuplicateOptionKeys(reusable, { q1: "a", q2: "a" })).toEqual([]);
  });

  it("uses explicit slot to item mappings", () => {
    const presentation: ReadingPresentationContract = {
      kind: "cloze",
      slots: [
        { slot: 1, itemId: "q2" },
        { slot: 2, itemId: "q1" },
      ],
    };
    expect(findPresentationSlot(presentation, 1)?.itemId).toBe("q2");
    expect(findPresentationSlot(presentation, 3)).toBeUndefined();
  });
});
