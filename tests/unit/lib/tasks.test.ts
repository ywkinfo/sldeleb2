import { describe, it, expect } from "vitest";
import { getTaskForItem } from "@/lib/tasks";
import { practiceItems } from "@/data/practiceItems";
import type { PracticeItem } from "@/lib/types";

function itemById(id: string): PracticeItem {
  const item = practiceItems.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`fixture item not found: ${id}`);
  return item;
}

describe("getTaskForItem", () => {
  it("reads reading Tarea through the referenced text", () => {
    // r-lib-01 → reading-t1-biblioteca-objetos → tarea1
    expect(getTaskForItem(itemById("r-lib-01"))).toBe("tarea1");
  });

  it("reads the listening Tarea from the script field, not the id string", () => {
    // 회귀 가드: id는 'l-t4-...'이고 scriptId는 'listening-t4-...'이지만 실제 task는 tarea3.
    expect(getTaskForItem(itemById("l-t4-artista-01"))).toBe("tarea3");
  });

  it("returns the task directly for writing (kind: open)", () => {
    expect(getTaskForItem(itemById("w-neighborhood-noise"))).toBe("tarea1");
  });

  it("returns the task directly for speaking (kind: oral)", () => {
    expect(getTaskForItem(itemById("s-public-space"))).toBe("tarea1");
  });

  it("returns undefined when the referenced text/script is missing", () => {
    const orphan = {
      id: "r-orphan",
      skill: "reading",
      kind: "mcq",
      textId: "reading-does-not-exist",
      prompt: "",
      options: [],
      correctAnswer: "a",
      explanationKo: "",
      tags: [],
      status: "published",
      reviewedBy: "",
      reviewedAt: "",
    } as unknown as PracticeItem;
    expect(getTaskForItem(orphan)).toBeUndefined();
  });
});
