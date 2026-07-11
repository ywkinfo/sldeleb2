"use client";

import { useMemo, useState } from "react";
import type { GlossaryEntry } from "@/lib/types";

export function Glossary({ entries }: { entries: GlossaryEntry[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("ko");
    return !q ? entries : entries.filter((entry) => `${entry.termEs} ${entry.termKo} ${entry.definitionKo}`.toLocaleLowerCase("ko").includes(q));
  }, [entries, query]);
  return <div><div className="field glossary-search"><label htmlFor="glossary-search">용어 검색</label><input id="glossary-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="예: enunciado, 지시문" /></div>
    <dl className="glossary-grid">{filtered.map((entry) => <div className="glossary-item" key={entry.id}><dt><span lang="es">{entry.termEs}</span> · {entry.termKo}</dt><dd>{entry.definitionKo}</dd></div>)}</dl>
    {!filtered.length && <p className="muted" role="status">일치하는 용어가 없습니다.</p>}
  </div>;
}
