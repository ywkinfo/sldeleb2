import type { Metadata } from "next";
import { ReviewBoard } from "@/components/ReviewBoard";
import { practiceItems } from "@/data/practiceItems";
import { absoluteUrl } from "@/lib/url";

export const metadata: Metadata = { title: "나의 DELE B2 복습", description: "이 기기에 저장된 읽기 오답과 쓰기·말하기 자기평가를 모아 다시 연습하세요.", alternates: { canonical: absoluteUrl("/review") } };
export default function ReviewPage() { return <><header className="page-hero"><div className="site-shell"><p className="section-kicker">Repaso local</p><h1>다시 보면, 내 것이 됩니다</h1><p className="lead">읽기 오답과 별표 문항, 낮은 자기평가를 한곳에서 확인하세요. 기록은 이 기기에만 저장됩니다.</p></div></header><section className="page-section compact"><div className="site-shell"><ReviewBoard items={practiceItems.filter((item) => item.status === "published")} /></div></section></>; }
