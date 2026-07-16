const DEFAULT_SITE_ORIGIN = "https://ywkinfo.github.io";

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
  const baseUrl = base || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_ORIGIN;
  const origin = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const pathWithBase = sitePath(path);

  return `${origin}${pathWithBase === "/" ? "/" : pathWithBase}`;
}

export function requestOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_ORIGIN;
}
