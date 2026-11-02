/**
 * Build-time loader for the canonical form artifacts emitted by `forms/` (`npm run compile`).
 *
 * The emitter writes one `schema.json` per question with relative cross-file `$ref`s, and a
 * JSON Forms `ui.json` per form. JSON Forms needs a self-contained schema, so the form's
 * schema is dereferenced here; its `examples` come straight from `@example` in the TypeSpec.
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
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
  return { schema, uischema, example: schema.examples?.[0], xmlMapping };
}
