"use client";

import { useAttempts } from "./useAttempts";
import { summarizeSetProgress } from "@/lib/progress";
import type { PracticeSet } from "@/lib/types";
import { sitePath } from "@/lib/url";

export function PracticeSetList({ sets }: { sets: PracticeSet[] }) {
  const { attempts, hydrated } = useAttempts();

  const reading = sets.filter((s) => s.skill === "reading");
  const listening = sets.filter((s) => s.skill === "listening");
  const writing = sets.filter((s) => s.skill === "writing");
  const speaking = sets.filter((s) => s.skill === "speaking");

  const renderSets = (skillSets: PracticeSet[]) => (
    <div className="grid cols-2">
      {skillSets.map((set) => {
        const prog = hydrated ? summarizeSetProgress(set, attempts) : { status: "not-started" as const, answered: 0, total: set.itemIds.length, correct: 0, isMcqSet: set.skill === "reading" || set.skill === "listening" };
        
        let badge = null;
        let progressBar = null;

        if (prog.status === "in-progress") {
          badge = <span className="badge warning" style={{ marginLeft: "0.5rem", verticalAlign: "middle" }}>진행 중 · {prog.answered}/{prog.total}</span>;
          const pct = Math.round((prog.answered / prog.total) * 100);
          progressBar = <div className="progress set-progress" aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>;
        } else if (prog.status === "done") {
          badge = <span className="badge" style={{ marginLeft: "0.5rem", verticalAlign: "middle" }}>{prog.isMcqSet ? `완료 · 정답 ${prog.correct}/${prog.total}` : (set.skill === "writing" || set.skill === "speaking" ? "자기평가 완료" : `완료 · ${prog.total}개`)}</span>;
          progressBar = <div className="progress set-progress" aria-hidden="true"><span style={{ width: '100%', backgroundColor: 'var(--color-primary)' }} /></div>;
        }

        return (
          <a key={set.id} href={sitePath(`/practice/set/${set.id}`)} className="card flat block-link" style={{ position: 'relative' }}>
            <h3>{set.title} {badge}</h3>
            <p className="muted">약 {set.estimatedMin}분 · {set.itemIds.length}문항</p>
            {progressBar}
          </a>
        );
      })}
    </div>
  );

  return (
    <>
      <section className="page-section compact" id="reading">
        <div className="site-shell">
          <p className="section-kicker">Comprensión de lectura</p>
          <h2>읽기</h2>
          {renderSets(reading)}
        </div>
      </section>

      <section className="page-section compact" id="listening">
        <div className="site-shell">
          <p className="section-kicker">Comprensión auditiva</p>
          <h2>듣기</h2>
          {renderSets(listening)}
        </div>
      </section>

      <section className="page-section compact" id="writing">
        <div className="site-shell">
          <p className="section-kicker">Expresión escrita</p>
          <h2>쓰기</h2>
          {renderSets(writing)}
        </div>
      </section>

      <section className="page-section compact" id="speaking">
        <div className="site-shell">
          <p className="section-kicker">Expresión oral</p>
          <h2>말하기</h2>
          {renderSets(speaking)}
        </div>
      </section>
    </>
  );
}
