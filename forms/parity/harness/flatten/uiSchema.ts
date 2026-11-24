import { ARRAY, fromScope, render, type Fields, type Json } from "../model.ts";

/**
 * The controls a JSON Forms UI schema lays out, keyed by `json_path`, in the order a reader
 * meets them. A control with `options.detail` lays out an array's items, whose scopes are
 * relative to the item. Help text is the control's own `options.description` when it has one,
 * else the controlled property's `description` in `schema`, as the renderer shows it.
 */
export function uiSchemaFields(ui: Json, schema: Fields): Fields {
  const fields: Fields = new Map();
  const walk = (node: Json, prefix: string[]) => {
    if (node.type === "Control" && typeof node.scope === "string") {
      const segments = [...prefix, ...fromScope(node.scope)];
      const detail = node.options?.detail as Json | undefined;
      if (detail) return walk(detail, [...segments, ARRAY]);
      const direct = render(segments);
      const repeated = render([...segments, ARRAY]);
      // One scalar-list control represents the schema's repeated leaf, not one scalar.
      const key =
        schema.has(repeated) && !schema.has(direct) ? repeated : direct;
      fields.set(key, {
        order: fields.size,
        label: node.label,
        help:
          (node.options?.description as string | undefined) ??
          schema.get(key)?.help,
        rules: {},
      });
      return;
    }
    for (const child of (node.elements ?? []) as Json[]) walk(child, prefix);
  };
  walk(ui, []);
  return fields;
}
