"use client";

import { useEffect, useRef, useState } from "react";
import type { SpeakingTaskItem } from "@/lib/types";
import { Timer } from "./Timer";
import { SelfAssessment } from "./SelfAssessment";

function preferredMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  return ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function SpeakingTask({ item }: { item: SpeakingTaskItem }) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>();
  const [error, setError] = useState<string>();
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const cleanupUrl = () => setAudioUrl((url) => { if (url) URL.revokeObjectURL(url); return undefined; });
  const stopTracks = () => { stream.current?.getTracks().forEach((track) => track.stop()); stream.current = null; };
  useEffect(() => () => {
    if (recorder.current?.state === "recording") recorder.current.stop();
    stopTracks();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);
  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setError("이 브라우저에서는 녹음을 지원하지 않아요. 타이머와 체크리스트로 연습해 주세요."); return; }
    cleanupUrl(); setError(undefined); chunks.current = [];
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = preferredMimeType();
      const next = new MediaRecorder(stream.current, mimeType ? { mimeType } : undefined);
      recorder.current = next;
      next.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      next.onstop = () => { const blob = new Blob(chunks.current, { type: next.mimeType || "audio/webm" }); setAudioUrl(URL.createObjectURL(blob)); setRecording(false); stopTracks(); };
      next.start(); setRecording(true);
    } catch { setError("마이크 권한을 사용할 수 없어요. 권한 없이도 타이머와 자가점검은 계속 이용할 수 있습니다."); stopTracks(); }
  };
  const stop = () => { if (recorder.current?.state === "recording") recorder.current.stop(); };
  return <article className="card" id={item.id}>
    <div className="eyebrow">Expresión oral · {item.task.replace("tarea", "Tarea ")}</div><h2>말하기 과제</h2><p className="badge warning">창작 과제 · 공식 기출 아님</p>
    <p lang="es" className="lead">{item.prompt}</p>
    <div className="grid cols-2"><Timer minutes={item.prepTimeMin} label="준비" /><Timer minutes={item.speakTimeMin} label="발화" /></div>
    <div className="recorder" style={{ marginTop: "1rem" }}><strong>로컬 녹음</strong><span className="muted">음성은 업로드되거나 저장되지 않으며 이 페이지 세션에서만 재생됩니다.</span><div className="recorder-controls">{!recording ? <button className="button small" type="button" onClick={start}>● 녹음 시작</button> : <button className="button small" type="button" onClick={stop}>■ 녹음 중지</button>} {recording && <span role="status">녹음 중…</span>}</div>{audioUrl && <audio controls src={audioUrl}>녹음 재생을 지원하지 않는 브라우저입니다.</audio>}{error && <p className="storage-warning" role="alert">{error}</p>}</div>
    <div className="grid cols-2" style={{ marginTop: "1.2rem" }}><div><h3>B2 체크리스트</h3><ul className="checklist">{item.checklistKo.map((line) => <li key={line}>{line}</li>)}</ul></div><details><summary><strong>모범 개요 보기</strong></summary><div className="outline-box">{item.modelOutlineKo}</div></details></div>
    <SelfAssessment itemId={item.id} skill="speaking" />
  </article>;
}
