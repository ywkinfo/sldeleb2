"use client";

import { useRef, useState } from "react";
import type { ExamPlayback } from "@/lib/types";
import { MAX_PLAYBACKS_PER_SCRIPT } from "@/lib/examSession";
import { sitePath } from "@/lib/url";

function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}

/**
 * 시험용 오디오 플레이어 — seek UI 없음, 배속 없음, 스크립트당 재생 슬롯 2회.
 * 슬롯은 실제 재생 시작(playing)에 예약되고, ended로 완료, 오류 시 환불된다.
 * 예약·완료·환불의 멱등성은 도메인 함수가 보장하므로 이벤트는 그대로 전달한다.
 */
export function ExamAudioPlayer({
  title,
  audioSrc,
  playback,
  disabled,
  onReserve,
  onComplete,
  onRefund,
}: {
  title: string;
  audioSrc: string;
  playback: ExamPlayback;
  disabled: boolean;
  onReserve: () => void;
  onComplete: () => void;
  onRefund: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string>();

  const exhausted = !playback.active && playback.used >= MAX_PLAYBACKS_PER_SCRIPT;
  const canStart = !disabled && !exhausted;

  const play = async () => {
    const audio = audioRef.current;
    if (!audio || !canStart) return;
    setError(undefined);
    try {
      await audio.play();
    } catch {
      // 재생이 시작되지 못했으면 예약된 슬롯이 없으므로 환불은 no-op이다.
      onRefund();
      setPlaying(false);
      setError("재생을 시작할 수 없어요. 다시 시도해 주세요. (이번 재생 횟수는 차감되지 않았습니다)");
    }
  };

  const pause = () => audioRef.current?.pause();

  return (
    <div className="exam-player">
      <div className="exam-player-head">
        <strong lang="es">{title}</strong>
        <span className="badge">재생 {playback.used}/{MAX_PLAYBACKS_PER_SCRIPT}{playing ? " · 재생 중" : ""}</span>
      </div>
      <audio
        ref={audioRef}
        preload="metadata"
        src={sitePath(audioSrc)}
        onPlaying={() => {
          setPlaying(true);
          onReserve();
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          onComplete();
        }}
        onError={() => {
          setPlaying(false);
          onRefund();
          setError("음원을 재생할 수 없어요. 다시 시도해 주세요. (이번 재생 횟수는 차감되지 않았습니다)");
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
      />
      <div className="exam-player-controls">
        {!playing ? (
          <button className="button small" type="button" onClick={play} disabled={!canStart}>
            ▶ 재생
          </button>
        ) : (
          <button className="button secondary small" type="button" onClick={pause}>
            ⏸ 일시정지
          </button>
        )}
        <span className="exam-player-time" aria-hidden="true">
          {formatClock(currentTime)}{duration ? ` / ${formatClock(duration)}` : ""}
        </span>
        {exhausted && <span className="muted">재생 횟수를 모두 사용했어요.</span>}
      </div>
      {error && <p className="storage-warning" role="alert">{error}</p>}
    </div>
  );
}
