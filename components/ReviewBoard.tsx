"use client";

import { useMemo } from "react";
import {
  buildAttemptEntries,
  toReviewEntries,
  summarizeTareaRates,
  analyzeVulnerableTags,
  pickTodaysReview,
  type ReviewItemMeta,
} from "@/lib/review";
import { useAttempts } from "./useAttempts";
import { StorageNotice } from "./StorageNotice";
import { sitePath } from "@/lib/url";
import { getSetIdForItem } from "@/lib/sets";
import { summarizeRate, RATE_MIN_ATTEMPTS } from "@/lib/progress";
import { ReviewTareaStats } from "./ReviewTareaStats";
import { ReviewQueue } from "./ReviewQueue";
import { SyncProgress } from "./SyncProgress";

const SUMMARY_CARDS = ["읽기", "듣기", "쓰기·말하기", "다시 볼 항목"];

export function ReviewBoard({ items }: { items: ReviewItemMeta[] }) {
  const { attempts, persistent, recovered, hydrated, remove } = useAttempts();
  const metaById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const entries = useMemo(() => buildAttemptEntries(attempts, metaById), [attempts, metaById]);

  // 하이드레이션 전에는 로컬 기록을 못 읽으므로, 개인화 영역 전체에 안정적 로딩 상태를 보여준다.
  if (!hydrated) {
    return <>
      <div className="review-summary">{SUMMARY_CARDS.map((label) => (
        <div className="card flat" key={label}><span className="eyebrow">{label}</span><h3 aria-hidden="true">···</h3><span className="muted">불러오는 중…</span></div>
      ))}</div>
      <p className="muted" role="status" style={{ marginTop: "1.2rem" }}>이 기기에 저장된 학습 기록을 불러오는 중입니다…</p>
    </>;
  }

  const list = Object.values(attempts);
  const reading = list.filter((a) => a.kind === "reading");
  const listening = list.filter((a) => a.kind === "listening");
  const openDone = list.filter((a) => a.kind === "open" && a.completed);
  const readingRate = summarizeRate(reading.filter((a) => a.correct).length, reading.length);
  const listeningRate = summarizeRate(listening.filter((a) => a.correct).length, listening.length);
  const avg = openDone.length
    ? (openDone.reduce((sum, a) => sum + (a.kind === "open" && a.completed ? a.selfScore : 0), 0) / openDone.length).toFixed(1)
    : "–";

  const reviewEntries = toReviewEntries(entries);
  const tareaRates = summarizeTareaRates(entries);
  const vulnerableTags = analyzeVulnerableTags(entries);
  const todaysReview = pickTodaysReview(entries, vulnerableTags);
  const hasMcq = reading.length + listening.length > 0;

  return <>
    <StorageNotice persistent={persistent} recovered={recovered} />
    <div className="review-summary">
      <div className="card flat"><span className="eyebrow">읽기</span><h3>{readingRate.text}</h3><span className="muted">{readingRate.kind === "percent" ? "최근 시도 기준 정답률" : `최근 시도 기준 (${RATE_MIN_ATTEMPTS}문항부터 %)`}</span><div className="progress"><span style={{ width: `${readingRate.pct}%` }} /></div></div>
      <div className="card flat"><span className="eyebrow">듣기</span><h3>{listeningRate.text}</h3><span className="muted">{listeningRate.kind === "percent" ? "최근 시도 기준 정답률" : `최근 시도 기준 (${RATE_MIN_ATTEMPTS}문항부터 %)`}</span><div className="progress"><span style={{ width: `${listeningRate.pct}%` }} /></div></div>
      <div className="card flat"><span className="eyebrow">쓰기·말하기</span><h3>{avg} / 3</h3><span className="muted">완료한 자기평가 평균</span></div>
      <div className="card flat"><span className="eyebrow">다시 볼 항목</span><h3>{reviewEntries.length}개</h3><span className="muted">오답·낮은 자기평가·별표</span></div>
    </div>

    <ReviewTareaStats reading={tareaRates.reading} listening={tareaRates.listening} />

    {todaysReview.length > 0 && (
      <div className="card" style={{ marginTop: "1.2rem", borderColor: "var(--accent)", borderWidth: "2px" }}>
        <h2>🎯 오늘의 맞춤 복습</h2>
        {vulnerableTags.length > 0 && (
          <p className="muted" style={{ marginBottom: "1rem" }}>
            발견된 취약 태그: {vulnerableTags.map((t) => <span key={t.tag} className="badge warning" style={{ marginRight: "0.5rem" }}>{t.tag} ({t.rate}% 오답)</span>)}
          </p>
        )}
        <div className="review-list">{todaysReview.map((entry) => {
          const itemId = entry.attempt.itemId;
          const setId = getSetIdForItem(itemId);
          const targetUrl = setId ? sitePath(`/practice/set/${setId}#${itemId}`) : sitePath("/practice");
          return <div className="review-row" key={itemId}><div><strong>{entry.meta?.label ?? "알 수 없는 문항"}</strong></div><div className="question-actions"><a className="button small" href={targetUrl}>우선 복습하기</a></div></div>;
        })}</div>
      </div>
    )}

    <ReviewQueue entries={reviewEntries} onRemove={remove} />
    {hasMcq && <p className="muted" style={{ marginTop: "0.5rem" }}>정답률은 각 읽기·듣기 문항의 가장 최근 시도로 계산합니다. 자기평가는 공식 DELE 점수가 아닙니다.</p>}
    <SyncProgress />
  </>;
}
