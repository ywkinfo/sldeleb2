import { describe, expect, it } from "vitest";
import { getPaletteItemState } from "../components/ExamQuestionPalette";
import {
  isHistorySessionDeletable,
  sortExamHistorySessions,
} from "../components/ExamHistory";
import { buildExamResultRows } from "../components/ExamResultView";
import type { FinalizedExamSession } from "../lib/types";

function terminal(
  id: string,
  submittedAt: number,
  projection: FinalizedExamSession["progressProjection"] = { status: "complete" },
): FinalizedExamSession {
  return {
    id,
    blueprintId: "exam-reading-b2",
    blueprintVersion: 1,
    sections: [],
    startedAt: submittedAt - 100,
    deadlineAt: submittedAt,
    answers: {},
    flaggedItemIds: [],
    playbacks: {},
    status: "submitted",
    submittedAt,
    result: { correct: 0, total: 0, byTask: {}, items: [] },
    progressProjection: projection,
  };
}

describe("exam question palette", () => {
  it("keeps answer, flag and current state independent", () => {
    expect(getPaletteItemState("q1", { q1: "a" }, ["q1"], "q1")).toEqual({
      answerState: "answered",
      flagged: true,
      current: true,
    });
    expect(getPaletteItemState("q2", {}, [], "q1")).toEqual({
      answerState: "unanswered",
      flagged: false,
      current: false,
    });
  });
});

describe("exam history presentation", () => {
  it("sorts terminal sessions most recent first without mutating input", () => {
    const sessions = [terminal("old", 10), terminal("new", 20)];
    expect(sortExamHistorySessions(sessions).map((session) => session.id)).toEqual(["new", "old"]);
    expect(sessions.map((session) => session.id)).toEqual(["old", "new"]);
  });

  it("only allows deletion after progress projection completes", () => {
    expect(isHistorySessionDeletable(terminal("done", 10))).toBe(true);
    expect(
      isHistorySessionDeletable(
        terminal("pending", 10, { status: "pending", attempts: [] }),
      ),
    ).toBe(false);
  });

  it("keeps an explicit unavailable row for a legacy item missing from live content", () => {
    const session = terminal("legacy-missing", 10);
    session.sections = [{
      task: "tarea1",
      setId: "removed-set",
      itemIds: ["removed-item"],
      scriptIds: [],
    }];
    session.result = {
      correct: 0,
      total: 1,
      byTask: { tarea1: { correct: 0, total: 1 } },
      items: [],
    };

    expect(buildExamResultRows(session)).toEqual([
      { itemId: "removed-item", task: "tarea1", entry: undefined },
    ]);
  });
});
