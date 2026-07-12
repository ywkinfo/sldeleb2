import type { Metadata } from "next";
import { PracticeListening } from "@/components/PracticeListening";
import { PracticeReading } from "@/components/PracticeReading";
import { SpeakingTask } from "@/components/SpeakingTask";
import { WritingTask } from "@/components/WritingTask";
import { listeningScripts } from "@/data/listeningScripts";
import { practiceItems } from "@/data/practiceItems";
import { readingTexts } from "@/data/readingTexts";
import type { ListeningMCQItem, PracticeItem, ReadingMCQItem, SpeakingTaskItem, WritingTaskItem } from "@/lib/types";

export const metadata: Metadata = { title: "DELE B2 연습", description: "B2 읽기·듣기 창작문항, 쓰기와 말하기 과제를 한국어 해설 및 자기평가와 함께 연습하세요.", alternates: { canonical: "/practice" } };
export default function PracticePage() {
  const allItems: PracticeItem[] = practiceItems;
  const publishedItems = allItems.filter((item) => item.status === "published");
  const texts = readingTexts.filter((text) => text.status === "published");
  const scripts = listeningScripts.filter((script) => script.status === "published");
  const reading = publishedItems.filter((item): item is ReadingMCQItem => item.kind === "mcq" && item.skill === "reading");
  const listening = publishedItems.filter((item): item is ListeningMCQItem => item.kind === "mcq" && item.skill === "listening");
  const writing = publishedItems.filter((item): item is WritingTaskItem => item.kind === "open" && item.skill === "writing");
  const speaking = publishedItems.filter((item): item is SpeakingTaskItem => item.kind === "oral");
  return <><header className="page-hero"><div className="site-shell"><p className="section-kicker">Práctica guiada</p><h1>짧게, 제대로 연습</h1><p className="lead">한 번에 한 Tarea. 정답보다 근거를 확인하고, 쓰기와 말하기는 스스로 다음 연습점을 기록하세요.</p><nav className="practice-tabs" aria-label="연습 영역 바로가기"><a href="#reading">읽기</a><a href="#listening">듣기</a><a href="#writing">쓰기</a><a href="#speaking">말하기</a></nav></div></header>
    <section className="page-section compact" id="reading"><div className="site-shell"><p className="section-kicker">Comprensión de lectura</p><h2>읽기</h2><p className="muted">Tarea 1·2·3·4 유형을 참고한 창작 지문입니다. 답을 고른 뒤 한국어 해설에서 근거를 확인하세요.</p><div className="practice-stack">{texts.map((text) => <PracticeReading key={text.id} text={text} items={reading.filter((item) => item.textId === text.id)} />)}</div></div></section>
    <section className="page-section compact" id="listening"><div className="site-shell"><p className="section-kicker">Comprensión auditiva</p><h2>듣기</h2><p className="muted">Tarea 3·5 유형을 참고한 창작 스크립트를 합성 음성(TTS)으로 녹음했습니다. 먼저 듣고 문제를 푼 뒤 대본과 해설을 확인하세요.</p><div className="practice-stack">{scripts.map((script) => <PracticeListening key={script.id} script={script} items={listening.filter((item) => item.scriptId === script.id)} />)}</div></div></section>
    <section className="page-section compact" id="writing"><div className="site-shell"><p className="section-kicker">Expresión escrita</p><h2>쓰기</h2><div className="practice-stack">{writing.map((item) => <WritingTask key={item.id} item={item} />)}</div></div></section>
    <section className="page-section compact" id="speaking"><div className="site-shell"><p className="section-kicker">Expresión oral</p><h2>말하기</h2><div className="practice-stack">{speaking.map((item) => <SpeakingTask key={item.id} item={item} />)}</div></div></section></>;
}
