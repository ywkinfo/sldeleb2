export type TimerStatus = "idle" | "running" | "paused" | "finished";

export interface TimerState {
  durationMs: number;
  remainingMs: number;
  deadlineMs: number | null;
  status: TimerStatus;
}

function validDuration(durationMs: number): number {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new RangeError("Timer duration must be a positive finite number");
  }
  return Math.ceil(durationMs);
}

export function createTimerState(durationMs: number): TimerState {
  const duration = validDuration(durationMs);
  return {
    durationMs: duration,
    remainingMs: duration,
    deadlineMs: null,
    status: "idle",
  };
}

export function startTimer(state: TimerState, now = Date.now()): TimerState {
  if (state.status === "running") return tickTimer(state, now);
  const remainingMs = state.status === "finished" ? state.durationMs : state.remainingMs;
  return {
    ...state,
    remainingMs,
    deadlineMs: now + remainingMs,
    status: "running",
  };
}

export function tickTimer(state: TimerState, now = Date.now()): TimerState {
  if (state.status !== "running" || state.deadlineMs === null) return state;
  const remainingMs = Math.max(0, state.deadlineMs - now);
  if (remainingMs === 0) {
    return { ...state, remainingMs: 0, deadlineMs: null, status: "finished" };
  }
  return { ...state, remainingMs };
}

export function pauseTimer(state: TimerState, now = Date.now()): TimerState {
  const current = tickTimer(state, now);
  if (current.status !== "running") return current;
  return { ...current, deadlineMs: null, status: "paused" };
}

export function resetTimer(
  state: TimerState,
  durationMs = state.durationMs,
): TimerState {
  return createTimerState(durationMs);
}

const ANNOUNCEMENT_THRESHOLDS = [300_000, 60_000, 30_000, 10_000, 0] as const;

function announcementFor(threshold: number): string {
  if (threshold === 300_000) return "5분 남았습니다.";
  if (threshold === 60_000) return "1분 남았습니다.";
  if (threshold === 30_000) return "30초 남았습니다.";
  if (threshold === 10_000) return "10초 남았습니다.";
  return "시간이 끝났습니다.";
}

export function getTimerAnnouncement(
  previousRemainingMs: number,
  nextRemainingMs: number,
): string | null {
  if (nextRemainingMs >= previousRemainingMs) return null;
  const crossed = ANNOUNCEMENT_THRESHOLDS.find(
    (threshold) =>
      previousRemainingMs > threshold && nextRemainingMs <= threshold,
  );
  return crossed === undefined ? null : announcementFor(crossed);
}

export function formatRemainingTime(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
