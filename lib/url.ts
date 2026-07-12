export function sitePath(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
  if (normalizedPath === "/") {
    return basePath || "/";
  }
  
  return `${basePath}${normalizedPath}`;
}

export function absoluteUrl(path: string, base?: string): string {
  const baseUrl = base || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  
  return `${normalizedBase}${normalizedPath}`;
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
