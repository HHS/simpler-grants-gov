/**
 * Build-time loader for the canonical form artifacts emitted by `forms/` (`npm run compile`).
 *
 * The emitter writes one `schema.json` per question with relative cross-file `$ref`s, and a
 * JSON Forms `ui.json` per form. JSON Forms needs a self-contained schema, so the form's
 * schema is dereferenced here; its `examples` come straight from `@example` in the TypeSpec.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { XmlMapping } from "@xml/index.ts";

import { dereferenceFormSchema } from "./dereferenceSchema";

/** `forms/` — the site runs from `forms/site`. */
const FORMS_ROOT = path.resolve(process.cwd(), "..");
export const CANONICAL_DIR = path.join(FORMS_ROOT, "dist", "canonical");

export interface FormSpec {
  schema: JsonSchema;
  uischema: UISchemaElement;
  /** The first `@example` declared on the form model, if any. */
  example?: Record<string, unknown>;
  /** How to build the form's Grants.gov XML, for a form mapped to its XSD. */
  xmlMapping?: XmlMapping;
  schemas: FormFile[];
  sources: FormFile[];
  absentSchemas: string[];
}

/** One complete generated artifact or form-local source file, not a displayed excerpt. */
export interface FormFile {
  name: string;
  label: string;
  code: string;
  lang: "json" | "typespec";
  sourceUrl?: string;
}

let sourceContext: { repository: string; commit: string } | undefined;

function getSourceContext() {
  if (sourceContext) return sourceContext;
  const git = (...args: string[]) =>
    execFileSync("git", ["-C", FORMS_ROOT, ...args], {
      encoding: "utf8",
    }).trim();
  let commit: string;
  try {
    // GITHUB_SHA can identify a different ref from the one checkout actually built.
    commit = git("rev-parse", "HEAD");
  } catch {
    commit = process.env.CF_PAGES_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "";
  }
  const remote =
    process.env.GITHUB_REPOSITORY ?? git("remote", "get-url", "origin");
  const repository = remote
    .replace(/^https:\/\/github\.com\//, "")
    .replace(/^git@github\.com:/, "")
    .replace(/\.git$/, "");
  if (
    !/^[\w.-]+\/[\w.-]+$/.test(repository) ||
    !/^[a-f\d]{40}$/i.test(commit)
  ) {
    throw new Error(
      "Form source links require a GitHub repository and immutable build commit.",
    );
  }
  return (sourceContext = { repository, commit });
}

const readJson = async (file: string) =>
  JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>;

/**
 * Drop every `$id` and nested `$schema` once refs are inlined: a shared question appears at
 * several places in the tree, and Ajv rejects one `$id` resolving to more than one schema.
 *
 * TODO: drop the `$id` handling once https://github.com/agilesix/simpler-forms/issues/8 is released.
 */
const stripIds = (node: unknown, root = true): unknown => {
  if (Array.isArray(node)) return node.map((child) => stripIds(child, false));
  if (!node || typeof node !== "object") return node;
  return Object.fromEntries(
    Object.entries(node)
      .filter(([key]) => key !== "$id" && (root || key !== "$schema"))
      .map(([key, value]) => [key, stripIds(value, false)]),
  );
};

export async function loadFormSpec(specId: string): Promise<FormSpec> {
  const formDir = path.join(CANONICAL_DIR, "forms", specId);
  const schemaFile = path.join(formDir, "schema.json");
  // Copying also unshares the objects dereferencing reuses between `$ref` targets, since the
  // result is handed to a client island as props.
  const resolved = await dereferenceFormSchema(schemaFile);
  // Keep the expanded canonical artifact before the preview removes nested IDs.
  const expandedSchema = `${JSON.stringify(resolved, null, 2)}\n`;
  const schema = stripIds(resolved) as JsonSchema & {
    examples?: Record<string, unknown>[];
  };
  const uischema = (await readJson(
    path.join(formDir, "ui.json"),
  )) as unknown as UISchemaElement;
  const xmlMappingFile = path.join(formDir, "xml-mapping.json");
  const xmlMapping = existsSync(xmlMappingFile)
    ? ((await readJson(xmlMappingFile)) as unknown as XmlMapping)
    : undefined;
  const schemas: FormFile[] = [
    {
      name: "schema.json",
      label: "JSON Schema",
      code: expandedSchema,
      lang: "json",
    },
    {
      name: "ui.json",
      label: "UI schema",
      code: await readFile(path.join(formDir, "ui.json"), "utf8"),
      lang: "json",
    },
  ];
  const absentSchemas: string[] = [];
  for (const [name, label, file, absent] of [
    [
      "rule-schema.json",
      "Rules schema",
      path.join(FORMS_ROOT, "dist", "sgg", "forms", specId, "rule-schema.json"),
      "This form has no rules schema.",
    ],
    [
      "xml-mapping.json",
      "XML mapping",
      xmlMappingFile,
      "This form has no XML mapping.",
    ],
    [
      "xml-transform.json",
      "XML transform",
      path.join(formDir, "xml-transform.json"),
      "This form has no XML transform.",
    ],
  ]) {
    if (existsSync(file)) {
      schemas.push({
        name,
        label,
        code: await readFile(file, "utf8"),
        lang: "json",
      });
    } else {
      absentSchemas.push(absent);
    }
  }
  const { repository, commit } = getSourceContext();
  const specDir = path.join(FORMS_ROOT, "specs", "forms", specId);
  const sourceNames = (await readdir(specDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".tsp"))
    .map((entry) => entry.name)
    .sort((a, b) =>
      a === "index.tsp" ? -1 : b === "index.tsp" ? 1 : a.localeCompare(b),
    );
  const sources = await Promise.all(
    sourceNames.map(async (name): Promise<FormFile> => ({
      name,
      label: name,
      code: await readFile(path.join(specDir, name), "utf8"),
      lang: "typespec",
      sourceUrl: `https://github.com/${repository}/blob/${commit}/forms/specs/forms/${encodeURIComponent(specId)}/${encodeURIComponent(name)}`,
    })),
  );
  return {
    schema,
    uischema,
    example: schema.examples?.[0],
    xmlMapping,
    schemas,
    sources,
    absentSchemas,
  };
}
