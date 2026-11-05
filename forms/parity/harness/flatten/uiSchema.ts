import { ARRAY, fromScope, render, type Fields, type Json } from "../model.ts";

/**
 * The controls a JSON Forms UI schema lays out, keyed by `json_path`, in the order a reader
 * meets them. A control with `options.detail` lays out an array's items, whose scopes are
 * relative to the item. Help text is the controlled property's `description` in `schema`,
 * which is what the renderer shows; the UI schema has none of its own.
 */
export function uiSchemaFields(ui: Json, schema: Fields): Fields {
  const fields: Fields = new Map();
  const walk = (node: Json, prefix: string[]) => {
    if (node.type === "Control" && typeof node.scope === "string") {
      const segments = [...prefix, ...fromScope(node.scope)];
      const detail = node.options?.detail as Json | undefined;
      if (detail) return walk(detail, [...segments, ARRAY]);
      const key = render(segments);
      fields.set(key, {
        order: fields.size,
        label: node.label,
        help: schema.get(key)?.help,
        rules: {},
      });
      return;
    }
    for (const child of (node.elements ?? []) as Json[]) walk(child, prefix);
  };
  walk(ui, []);
  return fields;
}
