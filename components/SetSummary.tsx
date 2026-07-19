"use client";

import { useAttempts } from "@/hooks/useAttempts";
import { pickNextSet, summarizeSetProgress } from "@/lib/progress/summary";
import type { PracticeSet, PracticeItem } from "@/lib/types";
import { sitePath } from "@/lib/url";

export function SetSummary({ set, items, allSets }: { set: PracticeSet, items: PracticeItem[], allSets: PracticeSet[] }) {
  const { attempts, hydrated } = useAttempts();

  if (!hydrated) return null;

  const prog = summarizeSetProgress(set, attempts);
  if (prog.answered === 0) return null;

  const nextSet = pickNextSet(set.id, allSets, attempts);
  
  const wrongItems = items.filter(i => {
    const a = attempts[i.id];
    return a && (a.kind === "reading" || a.kind === "listening") && !a.correct;
  });

  return (
    <div className="card" id="set-summary" style={{ marginTop: "2rem", borderColor: "var(--accent)", borderWidth: "2px" }}>
      <h2>세트 요약</h2>
      <p className="lead" style={{ marginBottom: "1rem" }}>
        진행 상태: <strong>{prog.answered} / {prog.total} 완료</strong>
        {prog.isMcqSet && prog.status === "done" && ` (정답 ${prog.correct}/${prog.total})`}
      </p>

      {wrongItems.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <p className="muted">틀린 문항 (오답 노트에 자동 저장됨):</p>
          <ul style={{ listStyle: "none", paddingLeft: 0, marginTop: "0.5rem" }}>
            {wrongItems.map(item => (
              <li key={item.id} style={{ marginBottom: "0.25rem" }}>
                <a href={`#${item.id}`} style={{ textDecoration: "none", color: "var(--accent)", fontWeight: "bold" }}>→ {item.kind === "mcq" ? item.prompt : item.id}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {prog.status === "done" && (
        <div style={{ marginTop: "1.5rem" }}>
          {nextSet ? (
            <a className="button" href={sitePath(`/practice/set/${nextSet.id}`)}>
              다음 세트: {nextSet.title}
            </a>
          ) : (
            <a className="button" href={sitePath("/review")}>
              모든 세트 완료! 복습 큐로 가기
            </a>
          )}
        </div>
      )}
    </div>
  );
}
