"use client";

import { useRef, useState } from "react";
import { exportUserData, importUserData, type ImportDomainResult } from "@/lib/backup";
import { getDefaultExamSessionStore } from "@/lib/examSession";
import { getDefaultAttemptStore } from "@/lib/storage";

function domainMessage(label: string, result: ImportDomainResult): string {
  const { added, updated, skipped, flagsChanged } = result.stats;
  const flags = (flagsChanged ?? 0) > 0 ? ` · 별표 변경 ${flagsChanged}건` : "";
  const recovery = result.localRecovered ? " · 기존 저장소 복구 후 병합" : "";
  const persistence = result.persistent ? "브라우저에 저장됨" : "현재 세션에만 임시 반영";
  return `${label}: 새 기록 ${added}건 · 갱신 ${updated}건 · 유지/건너뜀 ${skipped}건${flags} · ${persistence}${recovery}`;
}

export function SyncProgress() {
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportUserData(
      getDefaultAttemptStore(),
      getDefaultExamSessionStore(),
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `dele-b2-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("전체 백업 파일을 다운로드했습니다. 학습 진도와 완료·만료된 모의고사 기록이 포함되며, 진행 중 시험·테마·녹음은 제외됩니다.");
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
    const result = importUserData(
      getDefaultAttemptStore(),
      getDefaultExamSessionStore(),
      text,
    );
    if (result) {
      const lines = ["가져오기 완료", domainMessage("학습 진도", result.progress)];
      if (result.exams) {
        lines.push(domainMessage("모의고사 기록", result.exams));
      } else {
        lines.push("모의고사 기록: 기존 진도 전용 파일에는 포함되지 않아 변경하지 않음");
      }

      const domains = [result.progress, result.exams].filter(
        (domain): domain is ImportDomainResult => domain !== null,
      );
      const failed = domains.filter((domain) => !domain.persistent).length;
      if (failed > 0) {
        lines.push(
          failed === domains.length
            ? "저장 실패: 모든 영역이 현재 세션에만 반영되었습니다. 지금 다시 백업한 뒤 저장 공간·브라우저 권한을 확인하고 재시도하세요."
            : "부분 저장 경고: 일부 영역만 브라우저에 저장되었습니다. 지금 다시 백업한 뒤 저장 공간·브라우저 권한을 확인하고 재시도하세요.",
        );
      }
      setMessage(lines.join("\n"));
    } else {
      setMessage("유효하지 않은 파일입니다. 내보내기로 만든 JSON 파일인지 확인해 주세요.");
    }
    if (fileInput.current) fileInput.current.value = "";
  };

  return (
    <section className="content-group sync-progress" style={{ marginTop: "2rem" }}>
      <h2>데이터 백업 및 복원</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>다른 기기나 브라우저로 학습 진도·쓰기 초안·완료된 모의고사 기록을 옮길 수 있습니다. 진행 중 시험, 테마와 녹음은 백업하지 않습니다. 가져온 데이터는 기존의 더 최신 시도 기록을 보존하며 병합됩니다.</p>

      <div style={{ marginBottom: "1.5rem" }}>
        <button className="button" type="button" onClick={handleExport}>전체 백업 파일 다운로드 (Export)</button>
      </div>

      <div className="field">
        <label htmlFor="import-file">데이터 가져오기 (Import) — 전체 백업 또는 기존 진도 JSON 선택</label>
        <input
          id="import-file"
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          onChange={(e) => handleImport(e.target.files?.[0])}
        />
      </div>

      <p className="muted" role="status" style={{ marginTop: "1rem", minHeight: "1.2em", whiteSpace: "pre-line" }}>{message}</p>
    </section>
  );
}
