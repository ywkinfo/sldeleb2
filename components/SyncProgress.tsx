"use client";

import { useRef, useState } from "react";
import { exportProgress, importProgress, getDefaultAttemptStore } from "@/lib/storage";

export function SyncProgress() {
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportProgress(getDefaultAttemptStore());
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `dele-b2-progress-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("진도 파일을 다운로드했습니다. 다른 기기의 가져오기에서 이 파일을 선택하세요.");
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    let text = "";
    try {
      text = await file.text();
    } catch {
      setMessage("파일을 읽을 수 없습니다. 다시 시도해 주세요.");
      return;
    }
    const stats = importProgress(getDefaultAttemptStore(), text);
    if (stats) {
      setMessage(`병합 완료 — 새 기록 ${stats.added}건 · 갱신 ${stats.updated}건 · 기존 유지 ${stats.skipped}건. 바로 반영되었습니다.`);
    } else {
      setMessage("유효하지 않은 파일입니다. 내보내기로 만든 JSON 파일인지 확인해 주세요.");
    }
    if (fileInput.current) fileInput.current.value = "";
  };

  return (
    <section className="card" style={{ marginTop: "2rem" }}>
      <h2>데이터 백업 및 복원</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>다른 기기나 브라우저로 학습 진도와 쓰기 초안을 옮길 수 있습니다. 가져온 데이터는 기존 기록과 병합됩니다(문항별 최신 기록 우선).</p>

      <div style={{ marginBottom: "1.5rem" }}>
        <button className="button" type="button" onClick={handleExport}>진도 파일 다운로드 (Export)</button>
      </div>

      <div className="field">
        <label htmlFor="import-file">데이터 가져오기 (Import) — 내보낸 JSON 파일 선택</label>
        <input
          id="import-file"
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          onChange={(e) => handleImport(e.target.files?.[0])}
        />
      </div>

      <p className="muted" role="status" style={{ marginTop: "1rem", minHeight: "1.2em" }}>{message}</p>
    </section>
  );
}
