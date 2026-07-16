import { afterEach, describe, expect, it, vi } from "vitest";
import { absoluteUrl, sitePath } from "../lib/url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sitePath", () => {
  it("returns root-relative paths when no base path is set", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "");
    expect(sitePath("/")).toBe("/");
    expect(sitePath("/practice")).toBe("/practice");
    expect(sitePath("practice")).toBe("/practice");
  });

  it("prefixes the base path when set", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/sldeleb2");
    expect(sitePath("/")).toBe("/sldeleb2");
    expect(sitePath("/practice")).toBe("/sldeleb2/practice");
    expect(sitePath("/audio/listening/x.m4a")).toBe("/sldeleb2/audio/listening/x.m4a");
  });
});

describe("absoluteUrl", () => {
  it("uses the same base path rule as internal links", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/sldeleb2");
    expect(absoluteUrl("/practice", "https://ywkinfo.github.io")).toBe(
      "https://ywkinfo.github.io/sldeleb2/practice",
    );
    expect(absoluteUrl("/og.png", "https://ywkinfo.github.io")).toBe(
      "https://ywkinfo.github.io/sldeleb2/og.png",
    );
    expect(absoluteUrl("/", "https://ywkinfo.github.io")).toBe(
      "https://ywkinfo.github.io/sldeleb2/",
    );
  });

  it("builds origin-rooted urls without a base path", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "");
    expect(absoluteUrl("/practice", "http://localhost:3000")).toBe(
      "http://localhost:3000/practice",
    );
    expect(absoluteUrl("/", "http://localhost:3000")).toBe("http://localhost:3000/");
  });

  it("tolerates a trailing slash on the origin", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/sldeleb2");
    expect(absoluteUrl("/sitemap.xml", "https://ywkinfo.github.io/")).toBe(
      "https://ywkinfo.github.io/sldeleb2/sitemap.xml",
    );
  });
});
