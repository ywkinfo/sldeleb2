import { requestOrigin, absoluteUrl } from "../../lib/url";
import { examBlueprints } from "../../data/examBlueprints";
import { getPublishedSets } from "../../lib/sets";

export const dynamic = "force-static";

const routes = [
  "/",
  "/materials",
  "/practice",
  ...getPublishedSets().map((set) => `/practice/set/${set.id}`),
  "/exam",
  "/exam/history",
  ...examBlueprints.map((blueprint) => `/exam/${blueprint.id}`),
  "/review",
  "/guide",
];

export function GET(request: Request) {
  const origin = requestOrigin(request);
  const entries = routes
    .map((path) => `<url><loc>${absoluteUrl(path, origin)}</loc><changefreq>${path === "/materials" ? "monthly" : "weekly"}</changefreq><priority>${path === "/" ? "1.0" : "0.8"}</priority></url>`)
    .join("");

  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
