/*
 * 말하기 로컬 녹음의 다운로드 파일명. MediaRecorder의 mimeType은
 * "audio/webm;codecs=opus"처럼 codec 파라미터가 붙으므로 이를 떼고
 * 컨테이너만 확장자로 매핑한다. 날짜는 SyncProgress와 같은 ISO(YYYY-MM-DD) 관례.
 */
export function recordingExtension(mimeType: string): string {
  const container = mimeType.split(";")[0].trim().toLowerCase();
  if (container === "audio/mp4") return "m4a";
  if (container === "audio/ogg") return "ogg";
  return "webm";
}

export function recordingFileName(itemId: string, mimeType: string, now: Date = new Date()): string {
  const date = now.toISOString().slice(0, 10);
  return `${itemId}-${date}.${recordingExtension(mimeType)}`;
}
