import type { Metadata } from "next";
import { HomeProgress } from "@/components/HomeProgress";
import { practiceSets } from "@/data/practiceSets";

export const metadata: Metadata = { title: "한국어 DELE B2 학습 도구", description: "공식 자료를 찾고, 창작 문제를 짧게 연습하고, 오답을 다시 복습하세요." };

const exam = [
  ["Comprensión de lectura", "읽기", "70분 · 4 Tareas"],
  ["Comprensión auditiva", "듣기", "40분 · 5 Tareas"],
  ["Expresión escrita", "쓰기", "80분 · 2 Tareas"],
  ["Expresión oral", "말하기", "20분 · 3 Tareas"],
] as const;

export default function Home() {
  const starter = practiceSets[0];
  return <>
    <section className="hero"><div className="site-shell hero-grid"><div><p className="section-kicker">Spanish Lab · 스페인어 연구소</p><h1>기출 유형을<br />내 것으로.</h1><p className="lead">흩어진 공식 자료는 한곳에서 찾고, B2 문제는 한국어 해설과 함께 짧게 연습하세요. 로그인도 결제도 필요 없습니다.</p><div className="hero-actions"><a className="button" href="/practice">짧은 Tarea 연습</a><a className="button secondary" href="/materials">공식 자료 찾기</a></div></div><div className="hero-note"><strong>{starter?.title ?? "오늘의 짧은 읽기"}</strong><p>{starter ? `약 ${starter.estimatedMin}분 · ${starter.itemIds.length}문항` : "한 Tarea 단위로 부담 없이 시작하세요."}</p><p className="badge warning" style={{ marginTop: ".8rem" }}>공식 기출이 아닌 창작 연습문항</p></div></div></section>
    <section className="page-section compact"><div className="site-shell"><p className="section-kicker">Examen B2</p><h2>시험의 큰 그림부터</h2><div className="grid cols-4 card flat">{exam.map(([es,ko,time]) => <div className="stat" key={es}><span lang="es" className="eyebrow">{es}</span><strong>{ko}</strong><span>{time}</span></div>)}</div><p className="muted">말하기에는 별도 준비시간 20분이 있습니다. 합격은 그룹 1(읽기+쓰기), 그룹 2(듣기+말하기) 각각 최소 30/50점이 필요합니다.</p></div></section>
    <section className="page-section compact"><div className="site-shell grid cols-2"><div><p className="section-kicker">Local first</p><h2>배운 흔적은<br />내 기기에만.</h2><p className="lead">오답, 다시 보기, 쓰기·말하기 자기평가는 이 브라우저에만 남습니다. 서버 전송이나 계정 생성은 없습니다.</p></div><HomeProgress /></div></section>
    <section className="page-section compact"><div className="site-shell"><div className="notice"><strong>비공식 학습 도구입니다.</strong><p>공식 자료는 Instituto Cervantes 원문으로 연결하며 재배포하지 않습니다. 창작 연습문항은 공식 기출과 명확히 구분합니다.</p></div></div></section>
  </>;
}
