/**
 * Every disk read the harness makes. The flatteners take what these return and never touch
 * the file system themselves.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { dereferenceFormSchema } from "../../site/src/lib/dereferenceSchema.ts";

import type { Plan } from "./flatten/plan.ts";
import type { Json } from "./model.ts";

// ---------------------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------------------

/**
 * `forms/`, whatever directory the suite runs from. Found by walking up from this module
 * rather than by a fixed relative path, because the site bundles it into a build chunk.
 */
export const FORMS_ROOT = (() => {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  while (!existsSync(path.join(dir, "tspconfig.yaml"))) {
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("cannot find forms/ (tspconfig.yaml)");
    dir = parent;
  }
  return dir;
})();

const PLANS_DIR = path.join(FORMS_ROOT, "site", "src", "content", "forms");
const CANONICAL_DIR = path.join(FORMS_ROOT, "dist", "canonical");
const SGG_DIR = path.join(FORMS_ROOT, "dist", "sgg");
const CACHE_DIR = path.join(FORMS_ROOT, ".cache", "sources");
export const LOCK_FILE = path.join(
  FORMS_ROOT,
  "parity",
  "sources",
  "sources.lock.json",
);

// ---------------------------------------------------------------------------------------
// Form plans
// ---------------------------------------------------------------------------------------

/** Every plan in `site/src/content/forms/`, by slug. */
export function loadPlans(): Map<string, Plan> {
  return new Map(
    readdirSync(PLANS_DIR)
      .filter((name) => name.endsWith(".json"))
      .map((name) => {
        const plan = JSON.parse(
          readFileSync(path.join(PLANS_DIR, name), "utf8"),
        ) as Plan;
        return [plan.slug, plan];
      }),
  );
}

// ---------------------------------------------------------------------------------------
// Compiled form artifacts (`npm run compile`)
// ---------------------------------------------------------------------------------------

const formFile = (specId: string, name: string) =>
  path.join(CANONICAL_DIR, "forms", specId, name);

const readJson = (file: string) =>
  JSON.parse(readFileSync(file, "utf8")) as Json;

/** The form's `schema.json` with every `$ref` inlined, as the form preview loads it. */
export const loadFormSchema = (specId: string): Promise<Json> =>
  dereferenceFormSchema(formFile(specId, "schema.json"));

export const loadUiSchema = (specId: string): Json =>
  readJson(formFile(specId, "ui.json"));

export const loadIndex = (specId: string): Json =>
  readJson(formFile(specId, "index.json"));

const xmlTransformFile = (specId: string) =>
  formFile(specId, "xml-transform.json");

/** Whether `form-library-xml` wrote XML transform rules for the form: it is mapped. */
export const hasXmlTransform = (specId: string): boolean =>
  existsSync(xmlTransformFile(specId));

/** The form's emitted XML transform rules, or undefined for a form that is not mapped. */
export const loadXmlTransform = (specId: string): Json | undefined =>
  hasXmlTransform(specId) ? readJson(xmlTransformFile(specId)) : undefined;

const xmlMappingFile = (specId: string) => formFile(specId, "xml-mapping.json");

/** The form's emitted XML mapping, shaped like the XML, or undefined for one not mapped. */
export const loadXmlMapping = (specId: string): Json | undefined =>
  existsSync(xmlMappingFile(specId))
    ? readJson(xmlMappingFile(specId))
    : undefined;

/** The form's `@GrantsGov.form` identity, as the SGG emitter wrote it, or null without one. */
export const loadGrantsGovIdentity = (specId: string): Json =>
  (
    readJson(path.join(SGG_DIR, "forms", specId, "sgg.json")) as {
      grantsGov: Json;
    }
  ).grantsGov;

// ---------------------------------------------------------------------------------------
// Grants.gov sources (`npm run parity:fetch`)
// ---------------------------------------------------------------------------------------

/** Where `parity/sources/fetch.ts` caches a URL: `.cache/sources/<host>/<path>`. */
export const cachePath = (url: string): string => {
  const { host, pathname } = new URL(url);
  return path.join(CACHE_DIR, host, ...pathname.split("/").filter(Boolean));
};

/** A cached source's bytes. Throws, naming the command to run, if it was never fetched. */
export function readSource(url: string): Buffer {
  const file = cachePath(url);
  if (!existsSync(file))
    throw new Error(
      `${url} is not cached; run \`npm run parity:fetch\` in forms/`,
    );
  return readFileSync(file);
}
