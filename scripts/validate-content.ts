import { existsSync } from "node:fs";
import { join } from "node:path";
// @ts-expect-error Node's type-stripping runtime requires explicit .ts extensions.
import { listeningScripts } from "../data/listeningScripts.ts";
// @ts-expect-error Node's type-stripping runtime requires explicit .ts extensions.
import { officialResources } from "../data/officialResources.ts";
// @ts-expect-error Node's type-stripping runtime requires explicit .ts extensions.
import { practiceItems } from "../data/practiceItems.ts";
// @ts-expect-error Node's type-stripping runtime requires explicit .ts extensions.
import { practiceSets } from "../data/practiceSets.ts";
// @ts-expect-error Node's type-stripping runtime requires explicit .ts extensions.
import { readingTexts } from "../data/readingTexts.ts";
// @ts-expect-error Node's type-stripping runtime requires explicit .ts extensions.
import { examBlueprints } from "../data/examBlueprints.ts";
// @ts-expect-error Node's type-stripping runtime requires explicit .ts extensions.
import { assertValidContent } from "../lib/validate.ts";

assertValidContent({
  officialResources,
  readingTexts,
  listeningScripts,
  practiceItems,
  practiceSets,
  examBlueprints,
});

const missingAudio = listeningScripts
  .filter((script: { status: string }) => script.status === "published")
  .filter((script: { audioSrc: string }) => !existsSync(join("public", script.audioSrc)))
  .map((script: { id: string; audioSrc: string }) => `${script.id} → public${script.audioSrc}`);

if (missingAudio.length > 0) {
  console.error(
    `Missing listening audio files (run \`npm run generate:audio\`):\n${missingAudio.join("\n")}`,
  );
  process.exit(1);
}

console.log(
  `Content validated: ${officialResources.length} official resources, ` +
    `${readingTexts.length} reading texts, ${listeningScripts.length} listening scripts, ` +
    `${practiceItems.length} practice items, ${practiceSets.length} practice sets, ` +
    `${examBlueprints.length} exam blueprints.`,
);
