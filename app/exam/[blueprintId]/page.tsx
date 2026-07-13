import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { examBlueprints, getBlueprintById } from "@/data/examBlueprints";
import { ExamSessionView } from "@/components/ExamSessionView";
import { absoluteUrl } from "@/lib/url";

export async function generateStaticParams() {
  return examBlueprints.map((blueprint) => ({ blueprintId: blueprint.id }));
}

export async function generateMetadata(props: { params: Promise<{ blueprintId: string }> }): Promise<Metadata> {
  const params = await props.params;
  const blueprint = getBlueprintById(params.blueprintId);
  if (!blueprint) return { title: "Exam Not Found" };
  return {
    title: `${blueprint.title} | 모의고사`,
    description: `${blueprint.timeLimitMin}분 제한 시간의 DELE B2 ${blueprint.skill === "listening" ? "듣기" : "읽기"} 모의고사`,
    alternates: { canonical: absoluteUrl(`/exam/${blueprint.id}`) },
  };
}

export default async function ExamBlueprintPage(props: { params: Promise<{ blueprintId: string }> }) {
  const params = await props.params;
  const blueprint = getBlueprintById(params.blueprintId);
  if (!blueprint) notFound();

  return (
    <>
      <header className="page-hero">
        <div className="site-shell">
          <p className="section-kicker">Simulacro: {blueprint.skill}</p>
          <h1>{blueprint.title}</h1>
        </div>
      </header>
      <ExamSessionView blueprint={blueprint} />
    </>
  );
}
