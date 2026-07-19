import { describe, it, expect } from "vitest";
import { recordingExtension, recordingFileName } from "@/lib/recording";

describe("recordingExtension", () => {
  it("strips the codec parameter and maps mp4 to m4a", () => {
    expect(recordingExtension("audio/mp4")).toBe("m4a");
    expect(recordingExtension("audio/mp4;codecs=mp4a.40.2")).toBe("m4a");
  });
  it("keeps webm for opus recordings", () => {
    expect(recordingExtension("audio/webm;codecs=opus")).toBe("webm");
    expect(recordingExtension("audio/webm")).toBe("webm");
  });
  it("maps ogg containers", () => {
    expect(recordingExtension("audio/ogg;codecs=opus")).toBe("ogg");
  });
  it("falls back to webm for unknown types", () => {
    expect(recordingExtension("")).toBe("webm");
    expect(recordingExtension("audio/x-weird")).toBe("webm");
  });
});

describe("recordingFileName", () => {
  it("combines item id, ISO date, and extension", () => {
    const date = new Date("2026-07-14T09:30:00Z");
    expect(recordingFileName("s-public-space", "audio/webm;codecs=opus", date)).toBe("s-public-space-2026-07-14.webm");
    expect(recordingFileName("s-public-space", "audio/mp4", date)).toBe("s-public-space-2026-07-14.m4a");
  });
});
