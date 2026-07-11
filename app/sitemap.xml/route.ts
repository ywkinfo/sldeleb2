const routes = ["/", "/materials", "/practice", "/review", "/guide"];

export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const entries = routes
    .map((path) => `<url><loc>${origin}${path}</loc><changefreq>${path === "/materials" ? "monthly" : "weekly"}</changefreq><priority>${path === "/" ? "1.0" : "0.8"}</priority></url>`)
    .join("");

  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
