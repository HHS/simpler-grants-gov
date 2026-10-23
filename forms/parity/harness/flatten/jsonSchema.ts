import {
  ARRAY,
  fromPointer,
  render,
  type Fields,
  type Json,
  type Path,
  type Rules,
} from "../model.ts";

/** The leaf paths the emitter recorded in a form's `index.json`, for cross-checking. */
export const indexLeaves = (index: Json): Path[] =>
  (index.fieldOccurrences as { path: string; leaf: boolean }[])
    .filter((occurrence) => occurrence.leaf)
    .map((occurrence) => fromPointer(occurrence.path));

/** Two `allOf` branches give one keyword different values; the suite will not pick one. */
export class AmbiguousComposition extends Error {}

const ANNOTATIONS = new Set(["title", "description", "examples", "$comment"]);

/**
 * Folds unconditional `allOf` branches into the node: `properties` merge per property and
 * `required` lists union. A branch with `if` is conditional and is left alone.
 */
export function mergeAllOf(node: Json, at: Path = ""): Json {
  if (!Array.isArray(node.allOf)) return node;
  const { allOf, ...merged } = node as { allOf: Json[] } & Json;
  for (const branch of allOf.map((b) => mergeAllOf(b, at))) {
    if ("if" in branch) continue;
    for (const [key, value] of Object.entries(branch)) {
      if (key === "properties") {
        merged.properties = { ...merged.properties };
        for (const [name, schema] of Object.entries(value as Json))
          merged.properties[name] = merged.properties[name]
            ? mergeAllOf({ allOf: [merged.properties[name], schema] }, at)
            : schema;
      } else if (key === "required") {
        merged.required = [...new Set([...(merged.required ?? []), ...value])];
      } else if (!(key in merged)) {
        merged[key] = value;
      } else if (
        !ANNOTATIONS.has(key) &&
        JSON.stringify(merged[key]) !== JSON.stringify(value)
      ) {
        throw new AmbiguousComposition(
          `allOf branches disagree on ${key} at ${at || "root"}`,
        );
      }
    }
  }
  return merged;
}

function rulesOf(node: Json): Rules {
  const rules: Rules = {};
  for (const keyword of [
    "minLength",
    "maxLength",
    "minimum",
    "maximum",
  ] as const)
    if (typeof node[keyword] === "number") rules[keyword] = node[keyword];
  // Numeric keywords do not constrain decimal strings. Leave that representation gap visible.
  if (
    (node.type === "number" || node.type === "integer") &&
    typeof node.multipleOf === "number"
  ) {
    if (!Number.isFinite(node.multipleOf) || node.multipleOf <= 0)
      throw new Error("multipleOf must be a positive finite number");
    rules.multipleOf = node.multipleOf;
  }
  if (typeof node.pattern === "string") rules.pattern = node.pattern;
  if (typeof node.format === "string") rules.format = node.format;
  if ("const" in node) rules.enum = [String(node.const)];
  else if (Array.isArray(node.enum)) rules.enum = node.enum.map(String);
  return rules;
}

const isObject = (node: Json) =>
  node.type === "object" || node.properties !== undefined;

/**
 * The answers a compiled JSON Schema describes, keyed by `json_path`. Requiredness is from
 * the root: a field is required only if every object and array around it is. A rule that
 * applies only under a condition (`if`/`then`) leaves the field optional. `maxOccurs` is the
 * product of every array's `maxItems` around the field, `"unbounded"` if one has none.
 */
export function jsonSchemaFields(schema: Json): Fields {
  const fields: Fields = new Map();
  type MaxOccurs = number | "unbounded";
  const walk = (
    raw: Json,
    segments: string[],
    required: boolean,
    repeats: MaxOccurs = 1,
  ) => {
    const node = mergeAllOf(raw, render(segments));
    if (isObject(node)) {
      const own = new Set<string>(node.required ?? []);
      for (const [name, child] of Object.entries(
        (node.properties ?? {}) as Json,
      ))
        walk(child, [...segments, name], required && own.has(name), repeats);
      return;
    }
    if (
      node.type === "array" &&
      node.items &&
      isObject(mergeAllOf(node.items))
    ) {
      walk(
        node.items,
        [...segments, ARRAY],
        required && (node.minItems ?? 0) > 0,
        repeats === "unbounded" || typeof node.maxItems !== "number"
          ? "unbounded"
          : repeats * node.maxItems,
      );
      return;
    }
    fields.set(render(segments), {
      order: fields.size,
      label: node.title,
      help: node.description,
      required: required ? "yes" : "no",
      rules: { ...rulesOf(node), maxOccurs: repeats },
    });
  };
  walk(schema, [], true);
  return fields;
}
