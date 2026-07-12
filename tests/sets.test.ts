import { describe, it, expect } from "vitest";
import { orderItemsBySet } from "../lib/sets";
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
