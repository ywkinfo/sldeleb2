"use client";

import type { ListeningMCQItem, ListeningScript } from "@/lib/types";
import { useAttempts } from "./useAttempts";
import { sitePath } from "@/lib/url";
import { StorageNotice } from "./StorageNotice";
import { McqQuestion } from "./McqQuestion";

export function PracticeListening({ script, items, numberByItemId }: { script: ListeningScript; items: ListeningMCQItem[]; numberByItemId: Record<string, number> }) {
  const { persistent } = useAttempts();

  return <article className="card" id={script.id}>
    <div className="eyebrow">Audición · {script.task.replace("tarea", "Tarea ")}</div>
    <h2 lang="es">{script.title}</h2>
    <p className="badge warning">창작 스크립트 · 합성 음성(TTS) · 공식 기출 아님</p>
    <audio controls preload="metadata" src={sitePath(script.audioSrc)}>이 브라우저는 오디오 재생을 지원하지 않습니다.</audio>
    <details className="transcript">
      <summary>대본 보기 — 먼저 듣고 문제를 푼 뒤 확인하세요</summary>
      <div className="passage" lang="es">{script.transcript}</div>
    </details>
    {items.map((item) => (
      <McqQuestion key={item.id} item={item} number={numberByItemId[item.id]} />
    ))}
    <StorageNotice persistent={persistent} />
  </article>;
}
