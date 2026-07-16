"use client";

import { useState } from "react";
import type { ExamSkill, OfficialResource } from "@/lib/types";
import { RightsBadge } from "./RightsBadge";

const skillLabels: Record<ExamSkill, string> = { reading: "읽기", listening: "듣기", writing: "쓰기", speaking: "말하기" };
const typeLabels: Record<string, string> = { booklet: "문제지", audio: "오디오", transcript: "전사", answers: "정답", interactive: "인터랙티브" };

function skillsLabel(skills: OfficialResource["skills"]): string {
  return skills.length === 4 ? "전체 영역" : skills.map((value) => skillLabels[value]).join(" · ");
}

export function MaterialsFilter({ resources }: { resources: OfficialResource[] }) {
  const [skill, setSkill] = useState<ExamSkill | "all">("all");
  const [task, setTask] = useState("all");
  const [type, setType] = useState("all");
  const [year, setYear] = useState("all");
  const years = [...new Set(resources.map((r) => r.year).filter((v): v is number => typeof v === "number"))].sort((a,b) => b-a);
  const hasTasks = resources.some(r => r.task);
  const filtered = resources.filter((r) =>
    (skill === "all" || r.skills.includes(skill)) &&
    (task === "all" || !hasTasks || r.task === task) &&
    (type === "all" || r.resourceType === type) &&
    (year === "all" || (year === "none" ? r.year === null : String(r.year) === year))
  );
  return <>
    <div className="filters" aria-label="공식 자료 필터">
      <div className="field"><label htmlFor="filter-year">연도</label><select id="filter-year" value={year} onChange={(e) => setYear(e.target.value)}><option value="all">모든 연도</option><option value="none">연도 없는 모델</option>{years.map((v) => <option key={v}>{v}</option>)}</select></div>
      <div className="field"><label htmlFor="filter-skill">영역</label><select id="filter-skill" value={skill} onChange={(e) => setSkill(e.target.value as ExamSkill | "all")}><option value="all">모든 영역</option>{Object.entries(skillLabels).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      {hasTasks && <div className="field"><label htmlFor="filter-task">과제</label><select id="filter-task" value={task} onChange={(e) => setTask(e.target.value)}><option value="all">모든 Tarea</option>{[1,2,3,4,5].map((n) => <option key={n} value={`tarea${n}`}>Tarea {n}</option>)}</select></div>}
      <div className="field"><label htmlFor="filter-type">자료 유형</label><select id="filter-type" value={type} onChange={(e) => setType(e.target.value)}><option value="all">모든 유형</option>{Object.entries(typeLabels).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
    </div>
    <p className="result-count" role="status">자료 {filtered.length}개</p>
    {filtered.length ? <div className="grid cols-3">{filtered.map((resource) => <article className="card flat resource-card" key={resource.id}>
      <div className="eyebrow">{skillsLabel(resource.skills)}{resource.task ? ` · ${resource.task.replace("tarea", "Tarea ")}` : ""}</div>
      <h3>{resource.title}</h3>
      <p className="muted">{resource.year ?? "공식 모델"} · {typeLabels[resource.resourceType]}<br />{resource.sourceLabel}</p>
      <RightsBadge note={resource.rightsNote} />
      <div className="resource-actions"><a className="button small" href={resource.officialUrl} target="_blank" rel="noreferrer">공식 자료 열기 ↗</a>{resource.fallbackUrl && <a className="button secondary small" href={resource.fallbackUrl} target="_blank" rel="noreferrer">포털에서 찾기 ↗</a>}</div>
    </article>)}</div> : <div className="card flat"><h3>조건에 맞는 자료가 없어요.</h3><p className="muted">필터를 하나씩 ‘전체’로 바꿔 보세요.</p></div>}
  </>;
}
