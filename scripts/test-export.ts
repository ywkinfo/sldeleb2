import fs from "fs";
import path from "path";
// @ts-expect-error Node's type-stripping runtime requires explicit .ts extensions.
import { examBlueprints } from "../data/examBlueprints.ts";
// @ts-expect-error Node's type-stripping runtime requires explicit .ts extensions.
import { practiceSets } from "../data/practiceSets.ts";

const OUT_DIR = path.resolve(process.cwd(), "out");

function checkExport() {
  if (!fs.existsSync(OUT_DIR)) {
    console.error("❌ 'out' directory not found. Did you run 'npm run build'?");
    process.exit(1);
  }

  const requiredFiles = [
    ".nojekyll",
    "404.html",
    "index.html",
    "robots.txt",
    "sitemap.xml",
    path.join("materials", "index.html"),
    path.join("practice", "index.html"),
    path.join("exam", "index.html"),
    path.join("exam", "history", "index.html"),
    path.join("review", "index.html"),
    path.join("guide", "index.html"),
    ...examBlueprints.map((blueprint) => path.join("exam", blueprint.id, "index.html")),
    ...practiceSets
      .filter((set) => set.status === "published")
      .map((set) => path.join("practice", "set", set.id, "index.html")),
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

  const renderedPages: Array<{ file: string; expected: string[] }> = [
    {
      file: "index.html",
      expected: [
        "Spanish Lab · DELE B2",
        "기출 유형을",
        "짧은 Tarea 연습",
        "Instituto Cervantes와 제휴·보증 관계가 없습니다",
        "class=\"block-link\"",
      ],
    },
    { file: path.join("materials", "index.html"), expected: ["공식 자료실"] },
    { file: path.join("practice", "index.html"), expected: ["짧게, 제대로 연습"] },
    { file: path.join("exam", "index.html"), expected: ["실전처럼, 모의고사"] },
    { file: path.join("exam", "history", "index.html"), expected: ["모의고사 기록"] },
    { file: path.join("exam", "exam-listening-b2", "index.html"), expected: ["듣기 모의고사"] },
    { file: path.join("review", "index.html"), expected: ["다시 보면, 내 것이 됩니다"] },
    { file: path.join("guide", "index.html"), expected: ["B2 시험, 한국어로 한눈에"] },
  ];

  for (const page of renderedPages) {
    const filePath = path.join(OUT_DIR, page.file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Missing rendered page: ${page.file}`);
      hasError = true;
      continue;
    }
    const html = fs.readFileSync(filePath, "utf-8");
    for (const expected of page.expected) {
      if (!html.includes(expected)) {
        console.error(`❌ ${page.file} is missing rendered content: ${expected}`);
        hasError = true;
      }
    }
  }

  // Check if there are any literal absolute paths without the base path
  const indexHtml = fs.readFileSync(path.join(OUT_DIR, "index.html"), "utf-8");
  // A very rough check: look for href="/_" or src="/_" which would indicate a missing base path for internal Next.js assets
  if (indexHtml.includes('href="/_next/') || indexHtml.includes('src="/_next/')) {
    console.error(`❌ Found un-prefixed '/_next/' path in index.html. Base path might not be correctly applied.`);
    hasError = true;
  }
  if (/codex-preview|Your site is taking shape|SkeletonPreview/.test(indexHtml)) {
    console.error("❌ Home contains a preview placeholder.");
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
    { file: path.join("practice", "set", "set-reading-town", "index.html"), label: "canonical (연습 세트)", pattern: new RegExp(`rel="canonical" href="${publicBase}/practice/set/set-reading-town/?"`) },
    { file: path.join("exam", "index.html"), label: "canonical (/exam)", pattern: new RegExp(`rel="canonical" href="${publicBase}/exam/?"`) },
    { file: path.join("exam", "history", "index.html"), label: "canonical (/exam/history)", pattern: new RegExp(`rel="canonical" href="${publicBase}/exam/history/?"`) },
    { file: path.join("exam", "exam-reading-b2", "index.html"), label: "canonical (읽기 모의고사)", pattern: new RegExp(`rel="canonical" href="${publicBase}/exam/exam-reading-b2/?"`) },
    { file: "sitemap.xml", label: "sitemap <loc> (home)", pattern: new RegExp(`<loc>${publicBase}/</loc>`) },
    { file: "sitemap.xml", label: "sitemap <loc>", pattern: new RegExp(`<loc>${publicBase}/practice</loc>`) },
    { file: "sitemap.xml", label: "sitemap <loc> (연습 세트)", pattern: new RegExp(`<loc>${publicBase}/practice/set/set-reading-town</loc>`) },
    { file: "sitemap.xml", label: "sitemap <loc> (/exam)", pattern: new RegExp(`<loc>${publicBase}/exam</loc>`) },
    { file: "sitemap.xml", label: "sitemap <loc> (/exam/history)", pattern: new RegExp(`<loc>${publicBase}/exam/history</loc>`) },
    { file: "sitemap.xml", label: "sitemap <loc> (읽기 모의고사)", pattern: new RegExp(`<loc>${publicBase}/exam/exam-reading-b2</loc>`) },
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

  const guide = fs.readFileSync(path.join(OUT_DIR, "guide", "index.html"), "utf-8");
  for (const skill of ["reading", "listening", "writing", "speaking"]) {
    const href = `href=\"${basePath}/practice?skill=${skill}\"`;
    if (!guide.includes(href)) {
      console.error(`❌ Guide is missing its ${skill} practice link.`);
      hasError = true;
    }
  }

  for (const examPath of ["exam-reading-b2", "exam-listening-b2"]) {
    if (!guide.includes(`href=\"${basePath}/exam/${examPath}\"`)) {
      console.error(`❌ Guide is missing its ${examPath} link.`);
      hasError = true;
    }
  }

  if (indexHtml.includes('href="/practice"') || indexHtml.includes('href="/materials"')) {
    console.error("❌ Home contains an internal link that bypasses the Pages base path.");
    hasError = true;
  }

  // sitemap의 어떤 <loc>도 basePath 없이 origin 바로 뒤에 경로가 오면 안 된다.
  const sitemap = fs.readFileSync(path.join(OUT_DIR, "sitemap.xml"), "utf-8");
  const sitemapEntryCount = sitemap.match(/<url>/g)?.length ?? 0;
  const expectedSitemapEntryCount = 7 + examBlueprints.length + practiceSets.filter(
    (set) => set.status === "published",
  ).length;
  if (sitemapEntryCount !== expectedSitemapEntryCount) {
    console.error(
      `❌ sitemap.xml has ${sitemapEntryCount} entries; expected ${expectedSitemapEntryCount}.`,
    );
    hasError = true;
  }
  const missingBase = new RegExp(`<loc>${esc(publicOrigin)}(?!${esc(basePath)})`);
  if (missingBase.test(sitemap)) {
    console.error("❌ sitemap.xml contains a <loc> without the base path.");
    hasError = true;
  }

  const htmlFiles: string[] = [];
  const collectHtmlFiles = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) collectHtmlFiles(entryPath);
      else if (entry.name.endsWith(".html")) htmlFiles.push(entryPath);
    }
  };
  collectHtmlFiles(OUT_DIR);

  for (const filePath of htmlFiles) {
    const html = fs.readFileSync(filePath, "utf-8");
    for (const match of html.matchAll(/\b(?:href|src)="(\/[^"\s]*)"/g)) {
      const url = match[1];
      const hasBasePath =
        url === basePath ||
        url.startsWith(`${basePath}/`) ||
        url.startsWith(`${basePath}?`) ||
        url.startsWith(`${basePath}#`);
      if (!hasBasePath) {
        console.error(
          `❌ ${path.relative(OUT_DIR, filePath)} contains a root URL without the Pages base path: ${url}`,
        );
        hasError = true;
      }
    }
  }

  if (hasError) {
    console.error("❌ Export validation failed.");
    process.exit(1);
  } else {
    console.log("✅ All export validations passed.");
  }
}

checkExport();
