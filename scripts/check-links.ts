// @ts-expect-error Node's type-stripping runtime requires explicit .ts extensions.
import { officialResources } from "../data/officialResources.ts";

const TIMEOUT_MS = 8_000;
const fatal: string[] = [];
const warnings: string[] = [];

interface LinkResult {
  id: string;
  url: string;
  status: number | null;
  error?: string;
}

async function request(url: string, method: "HEAD" | "GET"): Promise<Response> {
  return fetch(url, {
    method,
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers:
      method === "GET"
        ? { Range: "bytes=0-1023", "User-Agent": "SpanishLab-DELEB2-LinkCheck/1.0" }
        : { "User-Agent": "SpanishLab-DELEB2-LinkCheck/1.0" },
  });
}

async function check(id: string, url: string): Promise<LinkResult> {
  const checkUrl = url.split('#')[0];
  try {
    let response = await request(checkUrl, "HEAD");
    if (response.status === 405 || response.status === 501) {
      response = await request(checkUrl, "GET");
    }
    await response.body?.cancel();
    return { id, url, status: response.status };
  } catch (error) {
    return {
      id,
      url,
      status: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const uniqueLinks = new Map<string, string>();
for (const resource of officialResources) {
  uniqueLinks.set(`${resource.id}:official`, resource.officialUrl);
  uniqueLinks.set(`${resource.id}:fallback`, resource.fallbackUrl);
}

const results = await Promise.all(
  [...uniqueLinks].map(([id, url]) => check(id, url)),
);

for (const result of results) {
  const label = `${result.id} ${result.url}`;
  if (result.status === 404 || result.status === 410) {
    fatal.push(`${label} returned ${result.status}`);
  } else if (
    result.status === null ||
    result.status === 403 ||
    result.status === 429 ||
    result.status >= 500
  ) {
    warnings.push(
      `${label} could not be verified (${result.status ?? result.error ?? "network error"})`,
    );
  } else if (result.status >= 400) {
    warnings.push(`${label} returned ${result.status}`);
  }
}

for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const failure of fatal) console.error(`ERROR ${failure}`);

console.log(
  `Checked ${results.length} official links: ${fatal.length} broken, ${warnings.length} warnings.`,
);

if (fatal.length > 0) process.exitCode = 1;
