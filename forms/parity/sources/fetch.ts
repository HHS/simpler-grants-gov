/**
 * Fills the source cache for every registered form and checks it against the lockfile.
 *
 *   npm run parity:fetch               download what is missing; fail if upstream changed
 *   npm run parity:fetch -- --update   accept upstream changes and rewrite the lockfile
 *
 * A cached file whose hash matches the lockfile is not downloaded again, so a warm cache
 * (locally, or restored in CI) makes this a no-op.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { DIFFS } from "../diffs/index.ts";
import { cachePath, LOCK_FILE, loadPlans } from "../harness/load.ts";

/** URL -> SHA-256 of its body. */
type Lock = Record<string, string>;

const sha256 = (body: Uint8Array): string =>
  createHash("sha256").update(body).digest("hex");

const readLock = (): Lock =>
  existsSync(LOCK_FILE)
    ? (JSON.parse(readFileSync(LOCK_FILE, "utf8")) as Lock)
    : {};

/** XSD `schemaLocation`s, resolved against the importing schema's URL. */
const importsOf = (xsd: string, url: string): string[] =>
  [
    ...xsd.matchAll(
      /<(?:xs|xsd):(?:import|include)\b[^>]*\bschemaLocation="([^"]+)"/g,
    ),
  ].map((match) => new URL(match[1], url).href);

const update = process.argv.includes("--update");

function sourceUrls(): string[] {
  const plans = loadPlans();
  return DIFFS.flatMap(({ slug }) => {
    const plan = plans.get(slug);
    if (!plan) throw new Error(`no plan with slug ${slug}`);
    return [plan.xsd_url, plan.dat_url].filter((url): url is string => !!url);
  });
}

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

const lock = readLock();
const next: Lock = {};
const problems: string[] = [];
const queue = sourceUrls();
const seen = new Set<string>();
let downloaded = 0;

while (queue.length) {
  const url = queue.shift()!;
  if (seen.has(url)) continue;
  seen.add(url);
  const file = cachePath(url);
  const cached = existsSync(file) ? readFileSync(file) : undefined;
  const fresh = cached && (!lock[url] || sha256(cached) === lock[url]);
  const body = fresh ? cached : await download(url);
  const hash = sha256(body);
  if (lock[url] && lock[url] !== hash && !update) {
    problems.push(
      `${url} changed upstream. Review the new revision, then run \`npm run parity:fetch -- --update\`.`,
    );
    continue;
  }
  if (!fresh) {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, body);
    downloaded++;
  }
  next[url] = hash;
  if (url.endsWith(".xsd"))
    queue.push(...importsOf(body.toString("utf8"), url));
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

const sorted = Object.fromEntries(
  Object.entries(next).sort(([a], [b]) => a.localeCompare(b)),
);
const text = `${JSON.stringify(sorted, null, 2)}\n`;
if (!existsSync(LOCK_FILE) || readFileSync(LOCK_FILE, "utf8") !== text)
  writeFileSync(LOCK_FILE, text);
console.log(`parity sources: ${seen.size} checked, ${downloaded} downloaded`);
