// @ts-expect-error Node's type-stripping runtime requires explicit .ts extensions.
import { officialResources } from "../data/officialResources.ts";
// @ts-expect-error Node's type-stripping runtime requires explicit .ts extensions.
import { practiceItems } from "../data/practiceItems.ts";
// @ts-expect-error Node's type-stripping runtime requires explicit .ts extensions.
import { practiceSets } from "../data/practiceSets.ts";
// @ts-expect-error Node's type-stripping runtime requires explicit .ts extensions.
import { readingTexts } from "../data/readingTexts.ts";
// @ts-expect-error Node's type-stripping runtime requires explicit .ts extensions.
import { assertValidContent } from "../lib/validate.ts";

assertValidContent({
  officialResources,
  readingTexts,
  practiceItems,
  practiceSets,
});

console.log(
  `Content validated: ${officialResources.length} official resources, ` +
    `${readingTexts.length} reading texts, ${practiceItems.length} practice items, ` +
    `${practiceSets.length} practice sets.`,
);
