import { requestOrigin, absoluteUrl } from "../../lib/url";

export const dynamic = "force-static";

export function GET(request: Request) {
  const origin = requestOrigin(request);
  const sitemapUrl = absoluteUrl("/sitemap.xml", origin);

  return new Response(`User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
