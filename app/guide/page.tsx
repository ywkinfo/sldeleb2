import type { Metadata } from "next";
import { Glossary } from "@/components/Glossary";
import { glossary } from "@/data/glossary";
import { absoluteUrl } from "@/lib/url";

export const metadata: Metadata = { title: "DELE B2 시험 가이드", description: "DELE B2 시험 구조, 시간, 합격 그룹과 영역별 준비법을 한국어로 확인하세요.", alternates: { canonical: absoluteUrl("/guide") } };
const tests = [
  ["읽기", "Comprensión de lectura", "70분", "4 Tareas"],
  ["듣기", "Comprensión auditiva", "40분", "5 Tareas"],
  ["쓰기", "Expresión escrita", "80분", "2 Tareas"],
  ["말하기", "Expresión oral", "20분", "3 Tareas + 별도 준비 20분"],
] as const;
export default function GuidePage() { return <><header className="page-hero"><div className="site-shell"><p className="section-kicker">Guía del examen</p><h1>B2 시험, 한국어로 한눈에</h1><p className="lead">영역별 시간과 채점 구조를 먼저 이해하면 연습의 우선순위가 분명해집니다.</p></div></header>
  <section className="page-section compact"><div className="site-shell"><h2>시험 구성</h2><div className="guide-timeline">{tests.map(([ko,es,time,tasks]) => <div key={ko}><span className="eyebrow" lang="es">{es}</span><h3>{ko}</h3><strong>{time}</strong><div className="muted">{tasks}</div></div>)}</div><p className="muted">시험 시간과 구성은 Instituto Cervantes의 공식 B2 안내를 기준으로 하며 변경될 수 있습니다.</p></div></section>
  <section className="page-section compact"><div className="site-shell grid cols-2"><article className="card flat accent"><p className="eyebrow">Grupo 1</p><h2>읽기 + 쓰기</h2><p>두 영역 합계 50점 중 최소 <strong>30점</strong>이 필요합니다.</p></article><article className="card flat accent"><p className="eyebrow">Grupo 2</p><h2>듣기 + 말하기</h2><p>두 영역 합계 50점 중 최소 <strong>30점</strong>이 필요합니다.</p></article></div><div className="site-shell"><p className="notice">한 그룹의 높은 점수로 다른 그룹의 부족한 점수를 상쇄할 수 없습니다.</p></div></section>
  <section className="page-section compact"><div className="site-shell"><p className="section-kicker">Estrategia</p><h2>영역별 준비법</h2><div className="grid cols-2"><article className="card flat"><h3>읽기 · Lectura</h3><p>질문에서 요구하는 정보와 글쓴이의 태도를 먼저 구분하세요. 연결어, 지시어, 문단 기능을 근거로 답을 좁힙니다.</p></article><article className="card flat"><h3>듣기 · Audición</h3><p>문항을 먼저 읽고 인물·장소·목적을 예측하세요. 한 단어보다 발화자의 의도와 의견 변화에 집중합니다.</p></article><article className="card flat"><h3>쓰기 · Escritura</h3><p>독자와 목적에 맞는 문체를 정한 뒤 서론·근거·반론·결론의 구조를 먼저 잡으세요.</p></article><article className="card flat"><h3>말하기 · Habla</h3><p>완벽한 문장보다 논리적 연결과 자기수정 능력이 중요합니다. 준비시간에는 핵심어만 메모하세요.</p></article></div></div></section>
  <section className="page-section compact"><div className="site-shell"><p className="section-kicker">Glosario</p><h2>시험 용어 사전</h2><Glossary entries={glossary} /></div></section>
  <section className="page-section compact"><div className="site-shell notice"><strong>최신 정보는 공식 사이트에서 확인하세요.</strong><p>시험 일정과 세부 운영은 매년 달라질 수 있습니다.</p><p><a href="https://examenes.cervantes.es/es/dele/examenes/b2" target="_blank" rel="noreferrer">Instituto Cervantes B2 안내 ↗</a></p></div></section></>; }
