import { describe, it, expect } from "vitest";
import { getPublishedSets, orderItemsBySet, sortPracticeSets } from "../lib/sets";
import type { PracticeSet } from "../lib/types";

describe("orderItemsBySet", () => {
  it("orders items according to the set's itemIds", () => {
    const set = {
      id: "test-set",
      itemIds: ["item-3", "item-1", "item-2"],
    } as PracticeSet;

    const items = [
      { id: "item-1" },
      { id: "item-2" },
      { id: "item-3" },
      { id: "item-4" },
    ];

    const ordered = orderItemsBySet(set, items);
    expect(ordered).toEqual([
      { id: "item-3" },
      { id: "item-1" },
      { id: "item-2" },
    ]);
  });

  it("ignores itemIds that do not exist in the provided items array", () => {
    const set = {
      id: "test-set",
      itemIds: ["item-1", "item-missing", "item-2"],
    } as PracticeSet;

    const items = [
      { id: "item-1" },
      { id: "item-2" },
    ];

    const ordered = orderItemsBySet(set, items);
    expect(ordered).toEqual([
      { id: "item-1" },
      { id: "item-2" },
    ]);
  });
});

describe("practice set catalog order", () => {
  it("sorts by skill, mode, task and sequence without mutating the input", () => {
    const sets = [
      { id: "r-exam", skill: "reading", mode: "exam-prep", task: "tarea2", sequence: 1 },
      { id: "l-guided", skill: "listening", mode: "guided", task: "tarea1", sequence: 1 },
      { id: "r-guided-2", skill: "reading", mode: "guided", task: "tarea1", sequence: 2 },
      { id: "r-guided-1", skill: "reading", mode: "guided", task: "tarea1", sequence: 1 },
    ] as PracticeSet[];

    expect(sortPracticeSets(sets).map((set) => set.id)).toEqual([
      "r-guided-1",
      "r-guided-2",
      "r-exam",
      "l-guided",
    ]);
    expect(sets[0].id).toBe("r-exam");
  });

  it("ships all sets with explicit catalog metadata and only three exam-prep sets", () => {
    const sets = getPublishedSets();
    expect(sets).toHaveLength(28);
    expect(sets.filter((set) => set.mode === "exam-prep").map((set) => set.id)).toEqual([
      "set-reading-anio-fuera",
      "set-reading-semana-cuatro",
      "set-reading-podcast",
    ]);
    expect(sets.every((set) => set.task && set.sequence >= 1)).toBe(true);

    const groups = new Map<string, number[]>();
    for (const set of sets) {
      const key = `${set.skill}:${set.mode}:${set.task}`;
      groups.set(key, [...(groups.get(key) ?? []), set.sequence]);
    }
    for (const sequences of groups.values()) {
      expect(sequences).toEqual(Array.from({ length: sequences.length }, (_, index) => index + 1));
    }
  });

  it("publishes the five Task 5 sets with their intended item and sequence", () => {
    const setsById = new Map(getPublishedSets().map((set) => [set.id, set]));
    expect(
      [
        "set-writing-claim",
        "set-writing-tourism",
        "set-speaking-teletrabajo",
        "set-speaking-photo-mudanza",
        "set-speaking-survey-ocio",
      ].map((id) => {
        const set = setsById.get(id);
        return set && {
          id: set.id,
          itemIds: set.itemIds,
          sequence: set.sequence,
        };
      }),
    ).toEqual([
      { id: "set-writing-claim", itemIds: ["w-flight-claim"], sequence: 3 },
      { id: "set-writing-tourism", itemIds: ["w-tourism-opinion"], sequence: 3 },
      { id: "set-speaking-teletrabajo", itemIds: ["s-remote-work-debate"], sequence: 2 },
      { id: "set-speaking-photo-mudanza", itemIds: ["s-photo-mudanza"], sequence: 2 },
      { id: "set-speaking-survey-ocio", itemIds: ["s-survey-tiempo-libre"], sequence: 2 },
    ]);
  });
});
