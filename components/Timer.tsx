"use client";

import { useEffect, useRef, useState } from "react";
import { createTimerState, getTimerAnnouncement, pauseTimer, resetTimer, startTimer, tickTimer } from "@/lib/timer";

export function Timer({ minutes, label }: { minutes: number; label: string }) {
  const durationMs = minutes * 60_000;
  const [state, setState] = useState(() => createTimerState(durationMs));
  const [announcement, setAnnouncement] = useState("");
  const previous = useRef(state.remainingMs);
  useEffect(() => {
    if (state.status !== "running") return;
    const id = window.setInterval(() => setState((current) => tickTimer(current, Date.now())), 250);
    return () => window.clearInterval(id);
  }, [state.status]);
  useEffect(() => {
    const nextAnnouncement = getTimerAnnouncement(previous.current, state.remainingMs);
    if (nextAnnouncement) setAnnouncement(nextAnnouncement);
    previous.current = state.remainingMs;
  }, [state.remainingMs]);
  const seconds = Math.ceil(state.remainingMs / 1000);
  const formatted = `${String(Math.floor(seconds / 60)).padStart(2,"0")}:${String(seconds % 60).padStart(2,"0")}`;
  return <div className="timer" aria-label={`${label} 타이머`}>
    <span className="eyebrow">{label}</span><span className="timer-readout" aria-hidden="true">{formatted}</span>
    <span className="sr-only" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>{announcement}</span>
    {state.status !== "running" && state.remainingMs > 0 ? <button className="button small" type="button" onClick={() => setState((v) => startTimer(v, Date.now()))}>{state.status === "idle" ? "시작" : "계속"}</button> : null}
    {state.status === "running" && <button className="button secondary small" type="button" onClick={() => setState((v) => pauseTimer(v, Date.now()))}>일시정지</button>}
    <button className="button secondary small" type="button" onClick={() => { setAnnouncement(""); setState((v) => resetTimer(v, durationMs)); }}>초기화</button>
  </div>;
}
