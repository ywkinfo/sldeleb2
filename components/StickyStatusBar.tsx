"use client";

import { useLayoutEffect, useRef } from "react";

export function StickyStatusBar({ children }: { children: React.ReactNode }) {
  const barRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const root = document.documentElement;
    const updateHeight = () => {
      root.style.setProperty("--context-bar-height", `${bar.getBoundingClientRect().height}px`);
    };

    updateHeight();
    if (typeof ResizeObserver === "undefined") {
      return () => root.style.setProperty("--context-bar-height", "0px");
    }
    const observer = new ResizeObserver(updateHeight);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      root.style.setProperty("--context-bar-height", "0px");
    };
  }, []);

  return (
    <div ref={barRef} className="set-progress-bar sticky-status-bar">
      <div className="site-shell set-progress-row">{children}</div>
    </div>
  );
}
