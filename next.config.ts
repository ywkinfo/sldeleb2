import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "1";

if (isStaticExport) {
  if (process.env.NEXT_PUBLIC_BASE_PATH === undefined) {
    throw new Error("NEXT_PUBLIC_BASE_PATH is required for static export");
  }
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    throw new Error("NEXT_PUBLIC_SITE_URL is required for static export");
  }
}

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export",
        basePath: process.env.NEXT_PUBLIC_BASE_PATH,
        env: {
          NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || "",
        },
        trailingSlash: true,
        images: {
          unoptimized: true,
        },
      }
    : {}),
};

export default nextConfig;
