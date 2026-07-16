import type { NextConfig } from "next";

if (process.env.NEXT_PUBLIC_BASE_PATH === undefined) {
  throw new Error("NEXT_PUBLIC_BASE_PATH is required for the GitHub Pages export");
}
if (!process.env.NEXT_PUBLIC_SITE_URL) {
  throw new Error("NEXT_PUBLIC_SITE_URL is required for the GitHub Pages export");
}

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
