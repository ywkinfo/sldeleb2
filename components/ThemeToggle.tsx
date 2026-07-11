"use client";

/* The inline pre-hydration script owns the initial theme; this effect only mirrors it into the button label. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => { setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light"); }, []);
  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try { localStorage.setItem("dele-b2:theme:v1", next); } catch { /* Theme still applies for this session. */ }
  };
  return <button className="theme-toggle" type="button" onClick={toggle} aria-label={`${theme === "dark" ? "라이트" : "다크"} 모드로 전환`}><span aria-hidden="true">{theme === "dark" ? "☀" : "◐"}</span><span className="theme-label">{theme === "dark" ? "라이트" : "다크"}</span></button>;
}
