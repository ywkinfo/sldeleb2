import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateMetadata } from "../app/practice/set/[setId]/page";
import { GET as getSitemap } from "../app/sitemap.xml/route";
import { getPublishedSets } from "../lib/sets";
import { absoluteUrl } from "../lib/url";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/sldeleb2");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ywkinfo.github.io");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("practice set discovery metadata", () => {
  it("publishes an absolute canonical URL for every practice set", async () => {
    for (const set of getPublishedSets()) {
      const metadata = await generateMetadata({
        params: Promise.resolve({ setId: set.id }),
      });

      expect(metadata.alternates?.canonical).toBe(
        absoluteUrl(`/practice/set/${set.id}`),
      );
    }
  });

  it("includes every published practice set in the sitemap", async () => {
    const response = getSitemap();
    const sitemap = await response.text();

    expect(response.status).toBe(200);
    expect(sitemap).toContain(
      "<loc>https://ywkinfo.github.io/sldeleb2/</loc>",
    );
    expect(getPublishedSets()).toHaveLength(28);
    for (const set of getPublishedSets()) {
      expect(sitemap).toContain(
        `<loc>https://ywkinfo.github.io/sldeleb2/practice/set/${set.id}</loc>`,
      );
    }
  });
});
