"use client";

import { useState } from "react";
import { exportProgress, importProgress, getDefaultAttemptStore } from "@/lib/storage";

export function SyncProgress() {
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState("");
  const [exportFallback, setExportFallback] = useState("");

  const handleExport = async () => {
    const data = exportProgress(getDefaultAttemptStore());
    try {
      await navigator.clipboard.writeText(data);
      setExportFallback("");
      setMessage("진도 데이터가 클립보드에 복사되었습니다.");
    } catch {
      setExportFallback(data);
      setMessage("클립보드 복사에 실패했습니다. 아래 상자의 내용을 직접 복사해 주세요.");
    }
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const success = importProgress(getDefaultAttemptStore(), importText);
    if (success) {
      setMessage("진도 데이터가 병합되어 바로 반영되었습니다.");
      setImportText("");
    } else {
      setMessage("유효하지 않은 데이터 형식입니다. 내보내기로 만든 JSON인지 확인해 주세요.");
    }
  };

  return (
    <section className="card" style={{ marginTop: "2rem" }}>
      <h2>데이터 백업 및 복원</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>다른 기기나 브라우저로 학습 진도와 쓰기 초안을 옮길 수 있습니다. 기존 데이터와 병합됩니다.</p>

      <div style={{ marginBottom: "1.5rem" }}>
        <button className="button" onClick={handleExport}>내 진도 데이터 복사하기 (Export)</button>
        {exportFallback && (
          <div className="field" style={{ marginTop: "0.8rem" }}>
            <label htmlFor="export-fallback">내보낼 데이터 — 전체 선택 후 복사하세요</label>
            <textarea id="export-fallback" readOnly value={exportFallback} rows={4} onFocus={(e) => e.currentTarget.select()} />
          </div>
        )}
      </div>

      <div className="field">
        <label htmlFor="import-data">데이터 가져오기 (Import)</label>
        <textarea
          id="import-data"
          placeholder="여기에 복사한 JSON 데이터를 붙여넣으세요..."
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={4}
        />
        <div style={{ marginTop: "0.5rem" }}>
          <button className="button secondary" onClick={handleImport} disabled={!importText.trim()}>데이터 병합하기</button>
        </div>
      </div>

      <p className="muted" role="status" style={{ marginTop: "1rem", minHeight: "1.2em" }}>{message}</p>
    </section>
  );
}
