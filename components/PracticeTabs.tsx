"use client";

import { useEffect, useState } from "react";

const tabs = [
  ["읽기", "#reading"],
  ["듣기", "#listening"],
  ["쓰기", "#writing"],
  ["말하기", "#speaking"],
] as const;

export function PracticeTabs() {
  const [hash, setHash] = useState("");

  useEffect(() => {
    const update = () => setHash(window.location.hash);
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  return (
    <nav className="practice-tabs" aria-label="연습 영역 바로가기">
      {tabs.map(([label, href]) => (
        <a key={href} href={href} aria-current={hash === href ? "location" : undefined}>
          {label}
        </a>
      ))}
    </nav>
  );
}
