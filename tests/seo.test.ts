import { describe, expect, it } from "vitest";
import { generateMetadata } from "../app/practice/set/[setId]/page";
import { GET as getSitemap } from "../app/sitemap.xml/route";
import { getPublishedSets } from "../lib/sets";
import { absoluteUrl } from "../lib/url";

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
    const response = getSitemap(
      new Request("https://dele.example/sitemap.xml", {
        headers: { host: "dele.example" },
      }),
    );
    const sitemap = await response.text();

    expect(response.status).toBe(200);
    expect(getPublishedSets()).toHaveLength(23);
    for (const set of getPublishedSets()) {
      expect(sitemap).toContain(
        `<loc>https://dele.example/practice/set/${set.id}</loc>`,
      );
    }
  });
});
