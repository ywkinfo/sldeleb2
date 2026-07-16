export function StorageNotice({
  persistent,
  recovered = false,
}: {
  persistent: boolean;
  recovered?: boolean;
}) {
  if (!persistent) {
    return <p className="storage-warning" role="status">
      저장 공간을 사용할 수 없어 현재 진행 상황은 브라우저를 닫으면 사라집니다.
    </p>;
  }
  if (recovered) {
    return <p className="storage-warning" role="status">
      기존 로컬 데이터가 손상되어 안전한 빈 기록으로 초기화했습니다.
    </p>;
  }
  return null;
}
