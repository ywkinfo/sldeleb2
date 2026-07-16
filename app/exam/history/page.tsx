import type { Metadata } from "next";
import { ExamHistory } from "@/components/ExamHistory";
import { absoluteUrl } from "@/lib/url";

export const metadata: Metadata = {
  title: "DELE B2 모의고사 기록",
  description: "이 브라우저에 저장된 DELE B2 읽기·듣기 모의고사 결과와 문항별 해설을 다시 확인하세요.",
  alternates: { canonical: absoluteUrl("/exam/history") },
};

export default function ExamHistoryPage() {
  return (
    <>
      <header className="page-hero">
        <div className="site-shell">
          <p className="section-kicker">Historial local</p>
          <h1>모의고사 기록</h1>
          <p className="lead">이 기기에 저장된 종료 시험의 점수와 문항별 결과를 다시 확인하세요.</p>
        </div>
      </header>
      <section className="page-section compact">
        <div className="site-shell"><ExamHistory /></div>
      </section>
    </>
  );
}
