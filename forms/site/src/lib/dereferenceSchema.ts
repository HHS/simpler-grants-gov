/**
 * Inlines every `$ref` in a compiled form's `schema.json`. The form preview and the parity
 * suite both load schemas through this, so they see the same schema.
 *
 * TODO(#12826): share one bundler with the API's form sync, once it lands in this repo.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dereference } from "@apidevtools/json-schema-ref-parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = Record<string, any>;

/**
 * Move a `$ref`'s siblings beside an `allOf` holding the ref, so dereferencing cannot
 * discard them.
 *
 * `{$ref, required}` is valid 2020-12 and means "that schema, plus these", but
 * dereferencing replaces the node with the referenced schema merged shallowly, so a
 * `required` beside a `$ref` overwrites the referenced schema's own list. `{allOf: [{$ref}],
 * required}` says the same thing and survives. It is also the shape the hand-written forms
 * in `api/src/form_schema/forms/` use, for the same reason.
 */
export function wrapRefSiblings(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(wrapRefSiblings);
  if (typeof node !== "object" || node === null) return node;
  const walked: Json = Object.fromEntries(
    Object.entries(node).map(([key, value]) => [key, wrapRefSiblings(value)]),
  );
  const { $ref, ...siblings } = walked;
  if ($ref === undefined || Object.keys(siblings).length === 0) return walked;
  // An existing allOf keeps its branches; the ref joins them.
  const { allOf = [], ...rest } = siblings;
  return { allOf: [{ $ref }, ...allOf], ...rest };
}

/**
 * Read each schema file without its top-level `$id`, and with its `$ref` siblings wrapped.
 * The emitter's `$id`s are relative to a hosting base supplied at publish time, so resolving
 * them against the file's own path would re-base its relative `$ref`s; the `$ref`s are
 * written relative to the file location.
 *
 * TODO: drop the `$id` handling once https://github.com/agilesix/simpler-forms/issues/8 is released.
 */
const fileWithoutId = {
  order: 1,
  canRead: (file: { url: string }) => !/^https?:/.test(file.url),
  read: async (file: { url: string }) => {
    const filePath = file.url.startsWith("file:")
      ? fileURLToPath(file.url)
      : file.url;
    const schema = JSON.parse(await readFile(filePath, "utf8")) as Json;
    delete schema.$id;
    return JSON.stringify(wrapRefSiblings(schema));
  },
};

/** The schema file with every `$ref` inlined. */
export async function dereferenceFormSchema(schemaFile: string): Promise<Json> {
  return (await dereference(schemaFile, {
    resolve: { file: fileWithoutId, http: false },
  })) as Json;
}
