import fs from "fs";
import path from "path";

const OUT_DIR = path.resolve(process.cwd(), "out");

function checkExport() {
  if (!fs.existsSync(OUT_DIR)) {
    console.error("❌ 'out' directory not found. Did you run 'npm run build:pages'?");
    process.exit(1);
  }

  const requiredFiles = [
    ".nojekyll",
    "404.html",
    "index.html",
    "robots.txt",
    "sitemap.xml",
  ];

  let hasError = false;

  for (const file of requiredFiles) {
    const filePath = path.join(OUT_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Missing expected file: ${file}`);
      hasError = true;
    } else {
      console.log(`✅ Found ${file}`);
    }
  }

  // Check if there are any literal absolute paths without the base path
  const indexHtml = fs.readFileSync(path.join(OUT_DIR, "index.html"), "utf-8");
  // A very rough check: look for href="/_" or src="/_" which would indicate a missing base path for internal Next.js assets
  if (indexHtml.includes('href="/_next/') || indexHtml.includes('src="/_next/')) {
    console.error(`❌ Found un-prefixed '/_next/' path in index.html. Base path might not be correctly applied.`);
    hasError = true;
  }

  // 공개 URL 계약: canonical/OG/sitemap/robots 모두 origin + basePath를 포함해야 한다.
  const esc = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const publicOrigin = process.env.NEXT_PUBLIC_SITE_URL || "https://ywkinfo.github.io";
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/sldeleb2";
  const publicBase = esc(`${publicOrigin}${basePath}`);

  const contentChecks: Array<{ file: string; label: string; pattern: RegExp }> = [
    { file: "index.html", label: "canonical (home)", pattern: new RegExp(`rel="canonical" href="${publicBase}/?"`) },
    { file: "index.html", label: "og:image", pattern: new RegExp(`property="og:image" content="${publicBase}/og\\.png"`) },
    { file: path.join("practice", "index.html"), label: "canonical (/practice)", pattern: new RegExp(`rel="canonical" href="${publicBase}/practice/?"`) },
    { file: "sitemap.xml", label: "sitemap <loc>", pattern: new RegExp(`<loc>${publicBase}/practice</loc>`) },
    { file: "robots.txt", label: "robots Sitemap", pattern: new RegExp(`Sitemap: ${publicBase}/sitemap\\.xml`) },
  ];

  for (const check of contentChecks) {
    const filePath = path.join(OUT_DIR, check.file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Missing file for content check: ${check.file}`);
      hasError = true;
      continue;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    if (!check.pattern.test(content)) {
      console.error(`❌ ${check.label}: expected ${check.pattern} in ${check.file}`);
      hasError = true;
    } else {
      console.log(`✅ ${check.label} includes base path`);
    }
  }

  // sitemap의 어떤 <loc>도 basePath 없이 origin 바로 뒤에 경로가 오면 안 된다.
  const sitemap = fs.readFileSync(path.join(OUT_DIR, "sitemap.xml"), "utf-8");
  const missingBase = new RegExp(`<loc>${esc(publicOrigin)}(?!${esc(basePath)})`);
  if (missingBase.test(sitemap)) {
    console.error("❌ sitemap.xml contains a <loc> without the base path.");
    hasError = true;
  }

  if (hasError) {
    console.error("❌ Export validation failed.");
    process.exit(1);
  } else {
    console.log("✅ All export validations passed.");
  }
}

checkExport();
