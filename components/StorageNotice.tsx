export function StorageNotice({ persistent }: { persistent: boolean }) {
  if (persistent) return null;
  return <p className="storage-warning" role="status">저장 공간을 사용할 수 없어 현재 진행 상황은 브라우저를 닫으면 사라집니다.</p>;
}
