import type { Metadata } from "next";
import { ExamList } from "@/components/ExamList";
import { absoluteUrl } from "@/lib/url";

export const metadata: Metadata = {
  title: "DELE B2 모의고사",
  description: "실제 시험 시간과 음원 재생 제한으로 풀고 제출 후 한 번에 채점하는 듣기 모의고사. 결과는 이 기기에만 저장됩니다.",
  alternates: { canonical: absoluteUrl("/exam") },
};

export default function ExamPage() {
  return (
    <>
      <header className="page-hero">
        <div className="site-shell">
          <p className="section-kicker">Simulacro</p>
          <h1>실전처럼, 모의고사</h1>
          <p className="lead">실제 시험 시간과 재생 제한 안에서 풀고, 제출 후 한 번에 채점하세요. 오답은 복습 큐로 이어집니다.</p>
        </div>
      </header>
      <section className="page-section compact">
        <div className="site-shell">
          <ExamList />
        </div>
      </section>
      <section className="page-section compact">
        <div className="site-shell">
          <div className="notice">
            <strong>창작 문항 모의고사입니다.</strong>
            <p>공식 기출이 아닌 창작 문항으로 구성되며, 결과는 공식 DELE 점수가 아닙니다. 기록은 이 기기의 브라우저에만 저장됩니다.</p>
          </div>
        </div>
      </section>
    </>
  );
}
