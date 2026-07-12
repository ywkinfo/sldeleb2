import type { Metadata } from "next";
import { MaterialsFilter } from "@/components/MaterialsFilter";
import { officialResources } from "@/data/officialResources";
import { absoluteUrl } from "@/lib/url";

export const metadata: Metadata = { title: "DELE B2 공식 자료", description: "Instituto Cervantes의 DELE B2 모델 시험, 오디오, 전사와 정답 자료를 빠르게 찾으세요.", alternates: { canonical: absoluteUrl("/materials") } };
export default function MaterialsPage() { return <><header className="page-hero"><div className="site-shell"><p className="section-kicker">Materiales oficiales</p><h1>공식 자료실</h1><p className="lead">문제지, 오디오, 전사와 정답을 영역별로 찾아 공식 원문에서 확인하세요.</p></div></header><section className="page-section compact"><div className="site-shell"><div className="notice" style={{ marginBottom: "1.5rem" }}><strong>링크만 제공합니다.</strong><p>모든 자료는 Instituto Cervantes 또는 CVC의 공식 페이지에서 열립니다. 링크가 열리지 않으면 각 카드의 공식 포털을 이용하세요.</p></div><MaterialsFilter resources={officialResources} /></div></section></>; }
