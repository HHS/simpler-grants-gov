import { ARRAY, render, type Fields, type Json, type Path } from "../model.ts";

/** One emitted XML transform, flattened three ways for the three things it is compared with. */
export interface XmlTransformFields {
  /** Each mapped field by the JSON path it reads. */
  byJsonPath: Fields;
  /** Each mapped field by the element path it writes, below the root. */
  byXmlPath: Fields;
  /** Each mapped field by `<JSON path> -> <element path>`, so a field mapped elsewhere shows. */
  byLink: Fields;
}

export const link = (jsonPath: Path, xmlPath: Path): Path =>
  `${jsonPath} -> ${xmlPath}`;

/** The rule types this reads. Anything else is an error, not a silent gap. */
const READABLE = new Set([undefined, "simple", "nested_object", "array"]);

/**
 * The fields an XML transform maps, read from its rules alone.
 *
 * A rule key is a property of the response; a rule with no `xml_transform` is a group whose
 * children land in its parent's element; `nested_object` and `array` add a step on both sides
 * (`[]` on the JSON side for an array's items). Paths follow the plan's spellings, so they
 * compare with `json_path` and `xml_path` directly.
 */
export function xmlTransformFields(rules: Json): XmlTransformFields {
  const fields: XmlTransformFields = {
    byJsonPath: new Map(),
    byXmlPath: new Map(),
    byLink: new Map(),
  };
  let order = 0;

  const walk = (level: Json, json: string[], xml: string[]): void => {
    for (const [key, rule] of Object.entries(level)) {
      if (key.startsWith("_") || key === "xml_transform") continue;
      if (!rule || typeof rule !== "object") continue;
      const transform = (rule as Json).xml_transform as Json | undefined;
      if (!transform) {
        walk(rule as Json, [...json, key], xml);
        continue;
      }
      if (!READABLE.has(transform.type))
        throw new Error(
          `unsupported xml_transform type ${transform.type} at ${render([...json, key])}`,
        );
      const step = String(transform.target);
      if (Object.hasOwn(transform, "static_value")) {
        // Source-owned wire metadata has an XML path but no applicant answer or
        // JSON-to-XML link. Keep it visible to source coverage and order checks.
        fields.byXmlPath.set([...xml, step].join("/"), {
          order: order++,
          rules: {},
        });
        continue;
      }
      if (transform.type === "nested_object") {
        walk(rule as Json, [...json, key], [...xml, step]);
        continue;
      }
      if (transform.type === "array" && (rule as Json).items) {
        walk(
          (rule as Json).items as Json,
          [...json, key, ARRAY],
          [...xml, step],
        );
        continue;
      }
      const jsonPath = render([...json, key]);
      const xmlPath = [...xml, step].join("/");
      const field = { order: order++, rules: {} };
      fields.byJsonPath.set(jsonPath, field);
      fields.byXmlPath.set(xmlPath, field);
      fields.byLink.set(link(jsonPath, xmlPath), field);
    }
  };
  walk(rules, [], []);
  return fields;
}
