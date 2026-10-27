import { ARRAY, render, type Json } from "../model.ts";
import { link, type XmlTransformFields } from "./xmlTransform.ts";

/**
 * The fields an XML mapping (`xml-mapping.json`) maps, keyed as `xmlTransformFields` keys an
 * XML transform's, so the same comparisons read either.
 *
 * The mapping is shaped like the XML, so the element path is the path of keys to a value,
 * without namespace prefixes; the JSON path is the value's `field` or `attachment`, below
 * any `each` it sits in (`[]` for the list's items). Attributes aren't fields, and both
 * branches of a `when` are walked.
 */
export function xmlMappingFields(mapping: Json): XmlTransformFields {
  const fields: XmlTransformFields = {
    byJsonPath: new Map(),
    byXmlPath: new Map(),
    byLink: new Map(),
  };
  let order = 0;

  const add = (jsonPath: string, xmlPath: string) => {
    const field = { order: order++, rules: {} };
    fields.byJsonPath.set(jsonPath, field);
    fields.byXmlPath.set(xmlPath, field);
    fields.byLink.set(link(jsonPath, xmlPath), field);
  };

  const json = (item: string[], path: string) =>
    render([...item, ...path.split(".")]);

  /** The field a value reads, if it reads one: through a transform, match or when. */
  const fieldOf = (value: unknown): string | undefined => {
    if (!value || typeof value !== "object") return undefined;
    const v = value as Json;
    if (typeof v.$field === "string") return v.$field;
    if (v.$transform) return fieldOf((v.$transform as Json).value);
    if (v.$match) return fieldOf((v.$match as Json).value);
    if (v.$when)
      return fieldOf((v.$when as Json).then) ?? fieldOf((v.$when as Json).else);
    return undefined;
  };

  /** `value`, written as the element at `xml`, inside the list item at `item`. */
  const visit = (value: unknown, xml: string[], item: string[]): void => {
    if (!value || typeof value !== "object") return; // a literal `case` entry
    const v = value as Json;
    const xmlPath = xml.join("/");
    if (typeof v.$field === "string") return add(json(item, v.$field), xmlPath);
    if (typeof v.$attachment === "string")
      return add(json(item, v.$attachment), xmlPath);
    if ("$const" in v) return;
    if (v.$transform) return visit((v.$transform as Json).value, xml, item);
    if (v.$match) {
      // The element reads the matched field, and any field a branch reads.
      const match = v.$match as Json;
      visit(match.value, xml, item);
      for (const branch of [
        ...Object.values(match.case as Json),
        match.default,
      ])
        visit(branch, xml, item);
      return;
    }
    if (v.$each) {
      const each = v.$each as Json;
      const items = fieldOf(each.items) ?? "";
      return visit(each.map, xml, [...item, ...items.split("."), ARRAY]);
    }
    if (v.$when) {
      const when = v.$when as Json;
      visit(when.then, xml, item);
      visit(when.else, xml, item);
      return;
    }
    for (const [key, child] of Object.entries(v)) {
      if (key.startsWith("@")) continue;
      visit(child, [...xml, key.replace(/^[^:]*:/, "")], item);
    }
  };

  const [content] = Object.values(mapping.root as Json);
  visit(content as Json, [], []);
  return fields;
}
