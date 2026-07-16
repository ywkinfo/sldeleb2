"use client";

import { useLayoutEffect, useRef } from "react";
import { sitePath } from "@/lib/url";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ITEMS = [
  ["공식 자료", "/materials"],
  ["연습", "/practice"],
  ["모의고사", "/exam"],
  ["복습", "/review"],
  ["시험 가이드", "/guide"],
] as const;

export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const root = document.documentElement;
    const updateHeight = () => {
      root.style.setProperty("--header-height", `${header.getBoundingClientRect().height}px`);
    };

    updateHeight();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <header ref={headerRef} className="site-header">
      <div className="site-shell header-row">
        <a className="brand" href={sitePath("/")} aria-label="Spanish Lab DELE B2 홈">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span className="brand-copy">
            <strong>Spanish Lab · DELE B2</strong>
            <span>스페인어 연구소</span>
          </span>
        </a>
        <nav className="site-nav desktop-nav" aria-label="주요 메뉴">
          <NavLinks items={NAV_ITEMS} />
        </nav>
        <ThemeToggle />
      </div>
      <nav className="mobile-nav" aria-label="모바일 메뉴">
        <div className="site-shell">
          <NavLinks items={NAV_ITEMS} autoRevealActive />
        </div>
      </nav>
    </header>
  );
}
