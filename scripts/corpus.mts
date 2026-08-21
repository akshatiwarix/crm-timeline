/**
 * `npm run corpus` — regenerate the committed corpus.
 *
 * The output is committed and the app imports it directly. Generating at
 * request time would make the demo a function of when the page loaded.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { generateCorpus } from "../data/generate";
import { accountSchema, rawActivitySchema } from "../lib/types";
import { z } from "zod";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "data", "corpus");
mkdirSync(out, { recursive: true });

const { accounts, activities } = generateCorpus();

// Validate before writing: a corpus that can't survive the trust boundary
// should fail here, loudly, rather than at import time in the browser.
const validAccounts = z.array(accountSchema).parse(accounts);
const validActivities = z.array(rawActivitySchema).parse(activities);

writeFileSync(join(out, "accounts.json"), JSON.stringify(validAccounts, null, 2) + "\n");
writeFileSync(join(out, "activities.json"), JSON.stringify(validActivities, null, 2) + "\n");

console.log(`${validAccounts.length} accounts, ${validActivities.length} activities written to data/corpus/`);
