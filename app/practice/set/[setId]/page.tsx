import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedSets, getSetById, orderItemsBySet } from "@/lib/sets";
import { practiceItems } from "@/data/practiceItems";
import { readingTexts } from "@/data/readingTexts";
import { listeningScripts } from "@/data/listeningScripts";
import { PracticeReading } from "@/components/PracticeReading";
import { PracticeListening } from "@/components/PracticeListening";
import { WritingTask } from "@/components/WritingTask";
import { SpeakingTask } from "@/components/SpeakingTask";
import { SetSummary } from "@/components/SetSummary";
import { SetProgressBar } from "@/components/SetProgressBar";
import type { PracticeItem, ReadingMCQItem, ListeningMCQItem, WritingTaskItem, SpeakingTaskItem } from "@/lib/types";

export async function generateStaticParams() {
  const sets = getPublishedSets();
  return sets.map((set) => ({ setId: set.id }));
}

export async function generateMetadata(props: { params: Promise<{ setId: string }> }): Promise<Metadata> {
  const params = await props.params;
  const set = getSetById(params.setId);
  if (!set) return { title: "Set Not Found" };
  return { title: `${set.title} | 연습`, description: `${set.estimatedMin}분 분량의 DELE B2 ${set.skill} 영역 연습` };
}

export default async function PracticeSetPage(props: { params: Promise<{ setId: string }> }) {
  const params = await props.params;
  const set = getSetById(params.setId);
  if (!set || set.status !== "published") notFound();

  const items: PracticeItem[] = orderItemsBySet(set, practiceItems);
  const numberByItemId = Object.fromEntries(items.map((item, index) => [item.id, index + 1]));

  const reading = items.filter((item): item is ReadingMCQItem => item.kind === "mcq" && item.skill === "reading");
  const listening = items.filter((item): item is ListeningMCQItem => item.kind === "mcq" && item.skill === "listening");
  const writing = items.filter((item): item is WritingTaskItem => item.kind === "open" && item.skill === "writing");
  const speaking = items.filter((item): item is SpeakingTaskItem => item.kind === "oral");

  return (
    <>
      <header className="page-hero">
        <div className="site-shell">
          <p className="section-kicker">Práctica: {set.skill}</p>
          <h1>{set.title}</h1>
          <p className="lead">
            예상 소요 시간: {set.estimatedMin}분 · 총 {set.itemIds.length}문항
          </p>
        </div>
      </header>

      <SetProgressBar set={set} />

      {reading.length > 0 && (
        <section className="page-section compact" id="reading">
          <div className="site-shell">
            <div className="practice-stack">
              {Array.from(new Set(reading.map((i) => i.textId))).map((textId) => {
                const text = readingTexts.find((t) => t.id === textId);
                if (!text) return null;
                return <PracticeReading key={text.id} text={text} items={reading.filter((i) => i.textId === text.id)} numberByItemId={numberByItemId} />;
              })}
            </div>
          </div>
        </section>
      )}

      {listening.length > 0 && (
        <section className="page-section compact" id="listening">
          <div className="site-shell">
            <div className="practice-stack">
              {Array.from(new Set(listening.map((i) => i.scriptId))).map((scriptId) => {
                const script = listeningScripts.find((s) => s.id === scriptId);
                if (!script) return null;
                return <PracticeListening key={script.id} script={script} items={listening.filter((i) => i.scriptId === script.id)} numberByItemId={numberByItemId} />;
              })}
            </div>
          </div>
        </section>
      )}

      {writing.length > 0 && (
        <section className="page-section compact" id="writing">
          <div className="site-shell">
            <div className="practice-stack">
              {writing.map((item) => <WritingTask key={item.id} item={item} />)}
            </div>
          </div>
        </section>
      )}

      {speaking.length > 0 && (
        <section className="page-section compact" id="speaking">
          <div className="site-shell">
            <div className="practice-stack">
              {speaking.map((item) => <SpeakingTask key={item.id} item={item} />)}
            </div>
          </div>
        </section>
      )}

      <section className="page-section compact">
        <div className="site-shell">
          <SetSummary set={set} items={items} allSets={getPublishedSets()} />
        </div>
      </section>
    </>
  );
}
