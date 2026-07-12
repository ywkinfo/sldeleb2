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

  if (hasError) {
    console.error("❌ Export validation failed.");
    process.exit(1);
  } else {
    console.log("✅ All export validations passed.");
  }
}

checkExport();
