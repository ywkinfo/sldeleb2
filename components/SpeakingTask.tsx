"use client";

import { useEffect, useRef, useState } from "react";
import type { SpeakingTaskItem } from "@/lib/types";
import { recordingFileName } from "@/lib/recording";
import { Timer } from "./Timer";
import { SelfAssessment } from "./SelfAssessment";

function preferredMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  return ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function SpeakingTask({ item }: { item: SpeakingTaskItem }) {
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState<{ url: string; mimeType: string }>();
  const [error, setError] = useState<string>();
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const mounted = useRef(true);
  // 화면에 살아 있는 objectURL을 추적한다. 교체·언마운트 시 이 값만 revoke한다.
  const liveUrl = useRef<string | undefined>(undefined);
  const stopTracks = () => { stream.current?.getTracks().forEach((track) => track.stop()); stream.current = null; };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (recorder.current?.state === "recording") recorder.current.stop();
      stopTracks();
      if (liveUrl.current) URL.revokeObjectURL(liveUrl.current);
    };
  }, []);

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setError("이 브라우저에서는 녹음을 지원하지 않아요. 타이머와 체크리스트로 연습해 주세요."); return; }
    setError(undefined); chunks.current = [];
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = preferredMimeType();
      const next = new MediaRecorder(stream.current, mimeType ? { mimeType } : undefined);
      recorder.current = next;
      next.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      next.onstop = () => {
        const type = next.mimeType || "audio/webm";
        const blob = new Blob(chunks.current, { type });
        chunks.current = [];
        stopTracks();
        // 녹음 중 언마운트되면 새 objectURL을 만들지 않는다(뒤늦은 URL 누수 방지).
        if (!mounted.current) return;
        setRecording(false);
        if (blob.size === 0) { setError("녹음된 소리가 없어요. 마이크를 확인하고 다시 시도해 주세요."); return; }
        // 새 녹음이 성공한 뒤에만 이전 것을 교체한다.
        if (liveUrl.current) URL.revokeObjectURL(liveUrl.current);
        const url = URL.createObjectURL(blob);
        liveUrl.current = url;
        setRecorded({ url, mimeType: type });
      };
      next.start(); setRecording(true);
    } catch { setError("마이크 권한을 사용할 수 없어요. 권한 없이도 타이머와 자가점검은 계속 이용할 수 있습니다."); stopTracks(); }
  };
  const stop = () => { if (recorder.current?.state === "recording") recorder.current.stop(); };

  return <article className="card" id={item.id}>
    <div className="eyebrow">Expresión oral · {item.task.replace("tarea", "Tarea ")}</div><h2>말하기 과제</h2><p className="badge warning">창작 과제 · 공식 기출 아님</p>
    <p lang="es" className="lead">{item.prompt}</p>
    <div className="grid cols-2"><Timer minutes={item.prepTimeMin} label="준비" /><Timer minutes={item.speakTimeMin} label="발화" /></div>
    <div className="recorder" style={{ marginTop: "1rem" }}><strong>로컬 녹음</strong><span className="muted">음성은 업로드되지 않아요. 저장 버튼으로 이 기기에 파일로 보관할 수 있습니다.</span><div className="recorder-controls">{!recording ? <button className="button small" type="button" onClick={start}>● 녹음 시작</button> : <button className="button small" type="button" onClick={stop}>■ 녹음 중지</button>} {recording && <span role="status">녹음 중…</span>}</div>{recorded && <><audio controls src={recorded.url}>녹음 재생을 지원하지 않는 브라우저입니다.</audio><a className="button secondary small" href={recorded.url} download={recordingFileName(item.id, recorded.mimeType)}>녹음 파일 저장</a></>}{error && <p className="storage-warning" role="alert">{error}</p>}</div>
    <div className="grid cols-2" style={{ marginTop: "1.2rem" }}><div><h3>B2 체크리스트</h3><ul className="checklist">{item.checklistKo.map((line) => <li key={line}>{line}</li>)}</ul></div><details><summary><strong>모범 개요 보기</strong></summary><div className="outline-box">{item.modelOutlineKo}</div></details></div>
    <SelfAssessment itemId={item.id} skill="speaking" />
  </article>;
}
