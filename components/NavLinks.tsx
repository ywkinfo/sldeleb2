"use client";

/* The current path exists only in the browser; it is read once after hydration. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import { sitePath } from "@/lib/url";

function normalize(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

export function NavLinks({
  items,
  autoRevealActive = false,
}: {
  items: ReadonlyArray<readonly [string, string]>;
  autoRevealActive?: boolean;
}) {
  const [path, setPath] = useState<string | null>(null);
  const linksRef = useRef(new Map<string, HTMLAnchorElement>());

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    let current = window.location.pathname;
    if (basePath && current.startsWith(basePath)) current = current.slice(basePath.length) || "/";
    setPath(normalize(current));
  }, []);

  useEffect(() => {
    if (!autoRevealActive || path === null) return;
    const activeHref = items.find(([, href]) => path === href || path.startsWith(`${href}/`))?.[1];
    if (!activeHref) return;
    linksRef.current.get(activeHref)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [autoRevealActive, items, path]);

  return (
    <>
      {items.map(([label, href]) => {
        const active = path !== null && (path === href || path.startsWith(`${href}/`));
        return (
          <a
            key={href}
            ref={(node) => {
              if (node) linksRef.current.set(href, node);
              else linksRef.current.delete(href);
            }}
            href={sitePath(href)}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </a>
        );
      })}
    </>
  );
}
