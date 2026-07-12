export function sitePath(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
  if (normalizedPath === "/") {
    return basePath || "/";
  }
  
  return `${basePath}${normalizedPath}`;
}

/** base/NEXT_PUBLIC_SITE_URL은 origin만 담는다(basePath 제외). 경로 쪽에서 sitePath로 합성한다. */
export function absoluteUrl(path: string, base?: string): string {
  const baseUrl = base || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const origin = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const pathWithBase = sitePath(path);

  return `${origin}${pathWithBase === "/" ? "/" : pathWithBase}`;
}

export function requestOrigin(req?: Request): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  if (process.env.STATIC_EXPORT === "1") {
    throw new Error("NEXT_PUBLIC_SITE_URL is required for static export");
  }
  
  if (req) {
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    return `${protocol}://${host}`;
  }
  
  return "http://localhost:3000";
}
