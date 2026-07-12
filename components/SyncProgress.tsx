"use client";

import { useState } from "react";
import { exportProgress, importProgress, getDefaultAttemptStore } from "@/lib/storage";

export function SyncProgress() {
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState("");

  const handleExport = () => {
    try {
      const data = exportProgress(getDefaultAttemptStore());
      navigator.clipboard.writeText(data);
      setMessage("진도 데이터가 클립보드에 복사되었습니다.");
    } catch {
      alert("클립보드 복사에 실패했습니다.");
    }
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    try {
      const success = importProgress(getDefaultAttemptStore(), importText);
      if (success) {
        setMessage("진도 데이터가 성공적으로 병합되었습니다! (새로고침 시 전체 반영)");
        setImportText("");
      } else {
        setMessage("유효하지 않은 데이터 형식입니다.");
      }
    } catch {
      alert("잘못된 데이터 형식입니다.");
    }
  };

  return (
    <section className="card" style={{ marginTop: "2rem" }}>
      <h2>데이터 백업 및 복원</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>다른 기기나 브라우저로 학습 진도와 쓰기 초안을 옮길 수 있습니다. 기존 데이터와 병합됩니다.</p>
      
      <div style={{ marginBottom: "1.5rem" }}>
        <button className="button" onClick={handleExport}>내 진도 데이터 복사하기 (Export)</button>
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
          <button className="button outline" onClick={handleImport} disabled={!importText.trim()}>데이터 병합하기</button>
        </div>
      </div>
      
      {message && <p className="badge outline" style={{ marginTop: "1rem", display: "inline-block" }}>{message}</p>}
    </section>
  );
}
