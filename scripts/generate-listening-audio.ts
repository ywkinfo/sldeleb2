// 듣기 음원 생성기 — spanish-lab의 camino 시리즈(diario ep53/54) 제작 방식을 따른다.
// 화자 라벨별로 Edge TTS 뉴럴 음성(es-ES-ElviraNeural 등)을 매핑해 세그먼트를
// 합성하고, ffmpeg로 정규화·무음 삽입·연결한 뒤 AAC(m4a)로 인코딩한다.
// 스크립트 해시 매니페스트로 내용이 바뀐 음원만 다시 만든다. (--force로 전체 재생성)
// @ts-expect-error Node's type-stripping runtime requires explicit .ts extensions.
import { listeningScripts } from "../data/listeningScripts.ts";
import type { ListeningScript } from "../lib/types.ts";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const OUTPUT_ROOT = resolve("public");
const MANIFEST_PATH = join(OUTPUT_ROOT, "audio", "listening", "manifest.json");
const SAMPLE_RATE_HZ = 44100;
const TURN_GAP_S = 0.7;
const LEAD_PADDING_S = 0.4;
const TAIL_PADDING_S = 0.6;
// camino 시리즈(ep54) AUDIO 설정 준용: 음성별 rate 오프셋 + 고정 pitch/volume
const DEFAULT_VOICE = "es-ES-ElviraNeural";
const EDGE_PITCH = "+0Hz";
const EDGE_VOLUME = "+0%";

interface Turn {
  speaker: string;
  text: string;
}

function run(command: string, args: string[]): string {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")}\n${result.stderr}`);
  }
  return result.stdout;
}

function commandExists(command: string): boolean {
  return spawnSync("which", [command], { encoding: "utf8" }).status === 0;
}

// edge-tts 실행 커맨드 결정: EDGE_TTS_PYTHON 환경변수 → PATH의 edge-tts →
// spanish-lab 가상환경(파이프라인 원본 저장소) 순서로 찾는다.
function resolveEdgeTts(): { command: string; prefixArgs: string[] } {
  const envPython = process.env.EDGE_TTS_PYTHON;
  if (envPython && existsSync(envPython)) {
    return { command: envPython, prefixArgs: ["-m", "edge_tts"] };
  }
  if (commandExists("edge-tts")) {
    return { command: "edge-tts", prefixArgs: [] };
  }
  const spanishLabPython = join(homedir(), "spanish-lab", ".venv", "bin", "python");
  if (existsSync(spanishLabPython)) {
    return { command: spanishLabPython, prefixArgs: ["-m", "edge_tts"] };
  }
  console.error(
    "edge-tts를 찾을 수 없습니다. `pip install edge-tts`로 설치하거나 " +
      "EDGE_TTS_PYTHON에 edge_tts가 설치된 파이썬 경로를 지정하세요.",
  );
  process.exit(1);
}

function parseTurns(transcript: string): Turn[] {
  const turns: Turn[] = [];
  for (const rawLine of transcript.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const labeled = line.match(/^([A-ZÁÉÍÓÚÜÑ]+):\s*(.*)$/);
    if (labeled) {
      turns.push({ speaker: labeled[1], text: labeled[2] });
    } else if (turns.length > 0) {
      turns[turns.length - 1].text += ` ${line}`;
    } else {
      turns.push({ speaker: "", text: line });
    }
  }
  return turns.filter((turn) => turn.text.trim().length > 0);
}

function scriptHash(script: ListeningScript): string {
  const payload = [
    script.transcript,
    JSON.stringify(script.voices),
    script.rate,
    EDGE_PITCH,
    EDGE_VOLUME,
  ].join("\0");
  return createHash("sha1").update(payload, "utf8").digest("hex").slice(0, 12);
}

function probeDurationSec(path: string): number {
  const stdout = run("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    path,
  ]);
  return Number.parseFloat(stdout.trim());
}

function makeSilence(path: string, seconds: number): void {
  run("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error",
    "-f", "lavfi",
    "-i", `anullsrc=r=${SAMPLE_RATE_HZ}:cl=mono`,
    "-t", seconds.toFixed(2),
    path,
  ]);
}

function synthesizeScript(
  script: ListeningScript,
  workDir: string,
  edgeTts: { command: string; prefixArgs: string[] },
): string {
  const turns = parseTurns(script.transcript);
  if (turns.length === 0) throw new Error(`No narrated turns in ${script.id}`);

  const gapPath = join(workDir, "gap.wav");
  const leadPath = join(workDir, "lead.wav");
  const tailPath = join(workDir, "tail.wav");
  makeSilence(gapPath, TURN_GAP_S);
  makeSilence(leadPath, LEAD_PADDING_S);
  makeSilence(tailPath, TAIL_PADDING_S);

  const concatEntries: string[] = [leadPath];
  turns.forEach((turn, index) => {
    const voice = script.voices[turn.speaker] ?? DEFAULT_VOICE;
    const seg = `seg_${String(index + 1).padStart(2, "0")}`;
    const textPath = join(workDir, `${seg}.txt`);
    const mp3Path = join(workDir, `${seg}.mp3`);
    const wavPath = join(workDir, `${seg}.wav`);
    writeFileSync(textPath, turn.text, "utf8");
    run(edgeTts.command, [
      ...edgeTts.prefixArgs,
      "--file", textPath,
      "--voice", voice,
      `--rate=${script.rate}`,
      `--pitch=${EDGE_PITCH}`,
      `--volume=${EDGE_VOLUME}`,
      "--write-media", mp3Path,
    ]);
    run("ffmpeg", [
      "-y", "-hide_banner", "-loglevel", "error",
      "-i", mp3Path,
      "-ar", String(SAMPLE_RATE_HZ), "-ac", "1",
      wavPath,
    ]);
    if (index > 0) concatEntries.push(gapPath);
    concatEntries.push(wavPath);
  });
  concatEntries.push(tailPath);

  const listPath = join(workDir, "concat.txt");
  writeFileSync(
    listPath,
    concatEntries.map((entry) => `file '${entry.replaceAll("'", "'\\''")}'`).join("\n"),
    "utf8",
  );

  const outputPath = join(OUTPUT_ROOT, script.audioSrc);
  mkdirSync(dirname(outputPath), { recursive: true });
  run("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error",
    "-f", "concat", "-safe", "0",
    "-i", listPath,
    "-c:a", "aac", "-b:a", "128k", "-ar", String(SAMPLE_RATE_HZ),
    outputPath,
  ]);
  return outputPath;
}

function readManifest(): Record<string, string> {
  if (!existsSync(MANIFEST_PATH)) return {};
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Record<string, string>;
  } catch {
    return {};
  }
}

function main(): void {
  const force = process.argv.includes("--force");
  for (const tool of ["ffmpeg", "ffprobe"]) {
    if (!commandExists(tool)) {
      console.error(`\`${tool}\` is required (Homebrew ffmpeg). Aborting.`);
      process.exit(1);
    }
  }
  const edgeTts = resolveEdgeTts();

  const manifest = readManifest();
  let generated = 0;
  for (const script of listeningScripts) {
    const digest = scriptHash(script);
    const outputPath = join(OUTPUT_ROOT, script.audioSrc);
    if (!force && manifest[script.id] === digest && existsSync(outputPath)) {
      console.log(`= ${script.id} unchanged (${digest})`);
      continue;
    }
    const workDir = mkdtempSync(join(tmpdir(), `tts-${script.id}-`));
    try {
      const output = synthesizeScript(script, workDir, edgeTts);
      const duration = probeDurationSec(output);
      manifest[script.id] = digest;
      generated += 1;
      console.log(`+ ${script.id} → ${script.audioSrc} (${duration.toFixed(1)}s, ${digest})`);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  }

  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Listening audio ready: ${generated} generated, ${listeningScripts.length - generated} reused.`);
}

main();
