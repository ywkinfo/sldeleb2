import type { Metadata } from "next";
import { getPublishedSets } from "@/lib/sets";
import { sitePath } from "@/lib/url";

export const metadata: Metadata = { title: "DELE B2 연습", description: "B2 읽기·듣기 창작문항, 쓰기와 말하기 과제를 한국어 해설 및 자기평가와 함께 연습하세요.", alternates: { canonical: "/practice" } };

export default function PracticePage() {
  const sets = getPublishedSets();
  const reading = sets.filter((s) => s.skill === "reading");
  const listening = sets.filter((s) => s.skill === "listening");
  const writing = sets.filter((s) => s.skill === "writing");
  const speaking = sets.filter((s) => s.skill === "speaking");

  return (
    <>
      <header className="page-hero">
        <div className="site-shell">
          <p className="section-kicker">Práctica guiada</p>
          <h1>짧게, 제대로 연습</h1>
          <p className="lead">한 번에 한 Tarea. 정답보다 근거를 확인하고, 쓰기와 말하기는 스스로 다음 연습점을 기록하세요.</p>
          <nav className="practice-tabs" aria-label="연습 영역 바로가기">
            <a href="#reading">읽기</a>
            <a href="#listening">듣기</a>
            <a href="#writing">쓰기</a>
            <a href="#speaking">말하기</a>
          </nav>
        </div>
      </header>

      <section className="page-section compact" id="reading">
        <div className="site-shell">
          <p className="section-kicker">Comprensión de lectura</p>
          <h2>읽기</h2>
          <div className="grid cols-2">
            {reading.map((set) => (
              <a key={set.id} href={sitePath(`/practice/set/${set.id}`)} className="card flat block-link">
                <h3>{set.title}</h3>
                <p className="muted">약 {set.estimatedMin}분 · {set.itemIds.length}문항</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section compact" id="listening">
        <div className="site-shell">
          <p className="section-kicker">Comprensión auditiva</p>
          <h2>듣기</h2>
          <div className="grid cols-2">
            {listening.map((set) => (
              <a key={set.id} href={sitePath(`/practice/set/${set.id}`)} className="card flat block-link">
                <h3>{set.title}</h3>
                <p className="muted">약 {set.estimatedMin}분 · {set.itemIds.length}문항</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section compact" id="writing">
        <div className="site-shell">
          <p className="section-kicker">Expresión escrita</p>
          <h2>쓰기</h2>
          <div className="grid cols-2">
            {writing.map((set) => (
              <a key={set.id} href={sitePath(`/practice/set/${set.id}`)} className="card flat block-link">
                <h3>{set.title}</h3>
                <p className="muted">약 {set.estimatedMin}분 · {set.itemIds.length}문항</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section compact" id="speaking">
        <div className="site-shell">
          <p className="section-kicker">Expresión oral</p>
          <h2>말하기</h2>
          <div className="grid cols-2">
            {speaking.map((set) => (
              <a key={set.id} href={sitePath(`/practice/set/${set.id}`)} className="card flat block-link">
                <h3>{set.title}</h3>
                <p className="muted">약 {set.estimatedMin}분 · {set.itemIds.length}문항</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
