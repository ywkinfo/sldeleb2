"use client";

import type { ReadingMCQItem, ReadingText } from "@/lib/types";
import { useAttempts } from "./useAttempts";
import { StorageNotice } from "./StorageNotice";
import { McqQuestion } from "./McqQuestion";

export function PracticeReading({ text, items, numberByItemId }: { text: ReadingText; items: ReadingMCQItem[]; numberByItemId: Record<string, number> }) {
  const { persistent } = useAttempts();

  return <article className="card" id={text.id}>
    <div className="eyebrow">Lectura · {text.task.replace("tarea", "Tarea ")}</div>
    <h2 lang="es">{text.title}</h2>
    <p className="badge warning">창작 지문 · 공식 기출 아님</p>
    <div className="passage" lang="es">{text.passage}</div>
    {items.map((item) => (
      <McqQuestion key={item.id} item={item} number={numberByItemId[item.id]} />
    ))}
    <StorageNotice persistent={persistent} />
  </article>;
}
