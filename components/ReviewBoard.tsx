"use client";

import type { PracticeItem } from "@/lib/types";
import { useAttempts } from "./useAttempts";
import { StorageNotice } from "./StorageNotice";
import { sitePath } from "@/lib/url";
import { getSetIdForItem } from "@/lib/sets";

import { SyncProgress } from "./SyncProgress";

function itemLabel(item: PracticeItem | undefined) {
  if (!item) return "알 수 없는 문항";
  if (item.kind === "mcq") return `${item.skill === "listening" ? "듣기" : "읽기"} · ${item.prompt}`;
  return `${item.skill === "writing" ? "쓰기" : "말하기"} · ${item.task.replace("tarea", "Tarea ")}`;
}

export function ReviewBoard({ items }: { items: PracticeItem[] }) {
  const { attempts, persistent, remove } = useAttempts();
  const list = Object.values(attempts);
  const reading = list.filter((a) => a.kind === "reading");
  const listening = list.filter((a) => a.kind === "listening");
  const open = list.filter((a) => a.kind === "open" && a.completed);
  const mcq = [...reading, ...listening];
  const incorrect = mcq.filter((a) => !a.correct);
  const readingRate = reading.length ? Math.round(reading.filter((a) => a.correct).length / reading.length * 100) : 0;
  const listeningRate = listening.length ? Math.round(listening.filter((a) => a.correct).length / listening.length * 100) : 0;
  const avg = open.length ? (open.reduce((sum, a) => sum + (a.kind === "open" && a.completed ? a.selfScore : 0), 0) / open.length).toFixed(1) : "–";
  const review = list.filter((a) => a.flagged || (a.kind === "open" ? a.completed && a.selfScore === 1 : !a.correct));

  // 취약 태그 분석
  const tagStats = new Map<string, { total: number; incorrect: number }>();
  mcq.forEach(attempt => {
    const item = items.find(i => i.id === attempt.itemId);
    if (!item || !("tags" in item)) return;
    item.tags.forEach(tag => {
      const stats = tagStats.get(tag) || { total: 0, incorrect: 0 };
      stats.total += 1;
      if (!attempt.correct) stats.incorrect += 1;
      tagStats.set(tag, stats);
    });
  });

  const vulnerableTags = Array.from(tagStats.entries())
    .filter(([_, stats]) => stats.total >= 2) // 최소 2번 이상 푼 태그
    .map(([tag, stats]) => ({ tag, rate: Math.round(stats.incorrect / stats.total * 100) }))
    .filter(t => t.rate >= 30) // 오답률 30% 이상만
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 2);

  const vulnerableTagsSet = new Set(vulnerableTags.map(v => v.tag));
  let recommended = incorrect
    .filter(a => {
      const item = items.find(i => i.id === a.itemId);
      return item && "tags" in item && item.tags?.some(tag => vulnerableTagsSet.has(tag));
    });
  
  if (recommended.length === 0) recommended = incorrect;
  const todaysReview = recommended.sort((a, b) => a.lastAttemptedAt - b.lastAttemptedAt).slice(0, 3);

  return <>
    <StorageNotice persistent={persistent} />
    <div className="review-summary">
      <div className="card flat"><span className="eyebrow">읽기</span><h3>{readingRate}%</h3><span className="muted">최근 시도 기준 정답률</span><div className="progress"><span style={{ width: `${readingRate}%` }} /></div></div>
      <div className="card flat"><span className="eyebrow">듣기</span><h3>{listeningRate}%</h3><span className="muted">최근 시도 기준 정답률</span><div className="progress"><span style={{ width: `${listeningRate}%` }} /></div></div>
      <div className="card flat"><span className="eyebrow">쓰기·말하기</span><h3>{avg} / 3</h3><span className="muted">완료한 자기평가 평균</span></div>
      <div className="card flat"><span className="eyebrow">다시 볼 항목</span><h3>{review.length}개</h3><span className="muted">오답·낮은 자기평가·플래그</span></div>
    </div>

    {todaysReview.length > 0 && (
      <div className="card" style={{ marginTop: "1.2rem", borderColor: "var(--color-primary)", borderWidth: "2px" }}>
        <h2>🎯 오늘의 맞춤 복습</h2>
        {vulnerableTags.length > 0 && (
          <p className="muted" style={{ marginBottom: "1rem" }}>
            발견된 취약 태그: {vulnerableTags.map(t => <span key={t.tag} className="badge warning" style={{ marginRight: "0.5rem" }}>{t.tag} ({t.rate}% 오답)</span>)}
          </p>
        )}
        <div className="review-list">{todaysReview.map((attempt) => {
          const item = items.find((candidate) => candidate.id === attempt.itemId);
          const setId = item ? getSetIdForItem(item.id) : null;
          const targetUrl = setId ? sitePath(`/practice/set/${setId}#${item!.id}`) : sitePath("/practice");
          return <div className="review-row" key={attempt.itemId}><div><strong>{itemLabel(item)}</strong></div><div className="question-actions"><a className="button small primary" href={targetUrl}>우선 복습하기</a></div></div>;
        })}</div>
      </div>
    )}

    <div className="card flat" style={{ marginTop: "1.2rem" }}><h2>전체 복습 대기열</h2>
      {!review.length ? <div><p className="muted">아직 복습할 문항이 없어요. 연습에서 틀린 문항이나 별표 표시한 과제가 여기에 모입니다.</p><a className="button" href={sitePath("/practice")}>연습 시작</a></div> : <div className="review-list">{review.map((attempt) => {
        const item = items.find((candidate) => candidate.id === attempt.itemId);
        const setId = item ? getSetIdForItem(item.id) : null;
        const targetUrl = setId ? sitePath(`/practice/set/${setId}#${item!.id}`) : sitePath("/practice");
        return <div className="review-row" key={attempt.itemId}><div><strong>{itemLabel(item)}</strong><div className="muted">{attempt.kind === "open" ? (attempt.completed ? `자기평가 ${attempt.selfScore}/3` : "미완료") : attempt.correct ? "정답" : "오답"} · {attempt.attemptCount}회 시도</div></div><div className="question-actions"><a className="button small" href={targetUrl}>다시 연습</a><button className="button secondary small" type="button" onClick={() => remove(attempt.itemId)}>기록 삭제</button></div></div>;
      })}</div>}
    </div>
    {incorrect.length > 0 && <p className="muted" style={{ marginTop: "0.5rem" }}>정답률은 각 읽기·듣기 문항의 가장 최근 시도로 계산합니다. 자기평가는 공식 DELE 점수가 아닙니다.</p>}
    <SyncProgress />
  </>;
}
