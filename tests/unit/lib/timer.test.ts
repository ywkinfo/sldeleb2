import { describe, expect, it } from "vitest";
import {
  createTimerState,
  getTimerAnnouncement,
  pauseTimer,
  resetTimer,
  startTimer,
  tickTimer,
} from "@/lib/timer";

describe("deadline timer", () => {
  it("derives remaining time from the deadline instead of interval counts", () => {
    const running = startTimer(createTimerState(10_000), 1_000);
    expect(tickTimer(running, 4_400).remainingMs).toBe(6_600);
    expect(tickTimer(running, 12_000)).toMatchObject({
      remainingMs: 0,
      status: "finished",
      deadlineMs: null,
    });
  });

  it("pauses, resumes, and resets without accumulating drift", () => {
    const running = startTimer(createTimerState(10_000), 1_000);
    const paused = pauseTimer(running, 4_000);
    expect(paused).toMatchObject({ status: "paused", remainingMs: 7_000 });

    const resumed = startTimer(paused, 20_000);
    expect(resumed.deadlineMs).toBe(27_000);
    expect(resetTimer(resumed)).toEqual(createTimerState(10_000));
  });

  it("announces only configured accessibility thresholds", () => {
    expect(getTimerAnnouncement(301_000, 299_000)).toBe("5분 남았습니다.");
    expect(getTimerAnnouncement(50_000, 31_000)).toBeNull();
    expect(getTimerAnnouncement(31_000, 29_000)).toBe("30초 남았습니다.");
    expect(getTimerAnnouncement(1_000, 0)).toBe("시간이 끝났습니다.");
  });
});
