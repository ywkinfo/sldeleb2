"use client";

import { useAttempts } from "./useAttempts";
import { StorageNotice } from "./StorageNotice";
import { summarizeRate } from "@/lib/progress";

export function HomeProgress() {
  const { attempts, persistent } = useAttempts();
  const list = Object.values(attempts);
  const mcq = list.filter((a) => a.kind === "reading" || a.kind === "listening");
  const open = list.filter((a) => a.kind === "open" && a.completed);
  const correct = mcq.filter((a) => a.correct).length;
  const rate = summarizeRate(correct, mcq.length);
  return <div className="card flat accent" aria-label="이 기기의 학습 현황">
    <p className="eyebrow">이 기기의 학습 현황</p>
    <div className="grid cols-3">
      <div><strong style={{ fontSize: "1.8rem" }}>{list.length}</strong><div className="muted">시도한 문항</div></div>
      <div><strong style={{ fontSize: "1.8rem" }}>{rate.text}</strong><div className="muted">읽기·듣기 최근 정답{rate.kind === "percent" ? "률" : ""}</div></div>
      <div><strong style={{ fontSize: "1.8rem" }}>{open.length}</strong><div className="muted">자기평가 완료</div></div>
    </div>
    {!list.length && <p className="muted">첫 연습을 완료하면 여기에 기록이 쌓여요.</p>}
    <StorageNotice persistent={persistent} />
  </div>;
}
