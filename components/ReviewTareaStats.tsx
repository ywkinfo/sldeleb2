import type { TareaRateRow } from "@/lib/review";
import { RATE_MIN_ATTEMPTS } from "@/lib/progress/summary";

function TareaColumn({ title, rows }: { title: string; rows: TareaRateRow[] }) {
  return <div>
    <h3>{title}</h3>
    {rows.length ? <div style={{ display: "grid", gap: ".9rem", marginTop: ".8rem" }}>{rows.map((row) => (
      <div key={row.task}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <span>{row.task.replace("tarea", "Tarea ")}</span>
          <strong>{row.rate.text}</strong>
        </div>
        <div className="progress"><span style={{ width: `${row.rate.pct}%` }} /></div>
      </div>
    ))}</div> : <p className="muted">아직 기록이 없어요.</p>}
  </div>;
}

/** 상단 요약 카드 아래, 읽기·듣기의 Tarea별 정답률을 보여준다. 계산은 lib/review가 수행. */
export function ReviewTareaStats({ reading, listening }: { reading: TareaRateRow[]; listening: TareaRateRow[] }) {
  if (reading.length === 0 && listening.length === 0) return null;
  return <div className="card flat" style={{ marginTop: "1.2rem" }}>
    <h2>Tarea별 정답률</h2>
    <p className="muted">각 문항의 가장 최근 결과 기준입니다. {RATE_MIN_ATTEMPTS}문항부터 %로 표시합니다.</p>
    <div className="grid cols-2" style={{ marginTop: "1rem" }}>
      <TareaColumn title="읽기" rows={reading} />
      <TareaColumn title="듣기" rows={listening} />
    </div>
  </div>;
}
