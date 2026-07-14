import type { Metadata } from "next";
import { ReviewBoard } from "@/components/ReviewBoard";
import { practiceItems } from "@/data/practiceItems";
import { getTaskForItem } from "@/lib/tasks";
import type { ReviewItemMeta } from "@/lib/review";
import type { PracticeItem } from "@/lib/types";
import { absoluteUrl } from "@/lib/url";

export const metadata: Metadata = { title: "나의 DELE B2 복습", description: "이 기기에 저장된 읽기·듣기 오답과 쓰기·말하기 자기평가를 모아 다시 연습하세요.", alternates: { canonical: absoluteUrl("/review") } };

function metaLabel(item: PracticeItem): string {
  if (item.kind === "mcq") return `${item.skill === "listening" ? "듣기" : "읽기"} · ${item.prompt}`;
  return `${item.skill === "writing" ? "쓰기" : "말하기"} · ${item.task.replace("tarea", "Tarea ")}`;
}

// heavy한 지문/대본 데이터는 서버에 두고, 복습 보드로는 compact meta만 전달한다.
const reviewItems: ReviewItemMeta[] = practiceItems
  .filter((item) => item.status === "published")
  .map((item) => ({
    id: item.id,
    skill: item.skill,
    kind: item.kind,
    task: getTaskForItem(item),
    tags: item.tags,
    label: metaLabel(item),
  }));

export default function ReviewPage() { return <><header className="page-hero"><div className="site-shell"><p className="section-kicker">Repaso local</p><h1>다시 보면, 내 것이 됩니다</h1><p className="lead">읽기·듣기 오답과 별표 문항, 낮은 자기평가를 한곳에서 확인하세요. 기록은 이 기기에만 저장됩니다.</p></div></header><section className="page-section compact"><div className="site-shell"><ReviewBoard items={reviewItems} /></div></section></>; }
