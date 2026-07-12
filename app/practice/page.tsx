import type { Metadata } from "next";
import { getPublishedSets } from "@/lib/sets";
import { PracticeSetList } from "@/components/PracticeSetList";
import { PracticeTabs } from "@/components/PracticeTabs";
import { absoluteUrl } from "@/lib/url";

export const metadata: Metadata = { title: "DELE B2 연습", description: "B2 읽기·듣기 창작문항, 쓰기와 말하기 과제를 한국어 해설 및 자기평가와 함께 연습하세요.", alternates: { canonical: absoluteUrl("/practice") } };

export default function PracticePage() {
  const sets = getPublishedSets();

  return (
    <>
      <header className="page-hero">
        <div className="site-shell">
          <p className="section-kicker">Práctica guiada</p>
          <h1>짧게, 제대로 연습</h1>
          <p className="lead">한 번에 한 Tarea. 정답보다 근거를 확인하고, 쓰기와 말하기는 스스로 다음 연습점을 기록하세요.</p>
          <PracticeTabs />
        </div>
      </header>

      <PracticeSetList sets={sets} />
    </>
  );
}
