"use client";

/* The current path exists only in the browser; it is read once after hydration. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { sitePath } from "@/lib/url";

function normalize(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

export function NavLinks({ items }: { items: ReadonlyArray<readonly [string, string]> }) {
  const [path, setPath] = useState<string | null>(null);

  useEffect(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    let current = window.location.pathname;
    if (basePath && current.startsWith(basePath)) current = current.slice(basePath.length) || "/";
    setPath(normalize(current));
  }, []);

  return (
    <>
      {items.map(([label, href]) => {
        const active = path !== null && (path === href || path.startsWith(`${href}/`));
        return (
          <a key={href} href={sitePath(href)} aria-current={active ? "page" : undefined}>
            {label}
          </a>
        );
      })}
    </>
  );
}
