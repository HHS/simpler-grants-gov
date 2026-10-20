import type { Model, ModelProperty, Program, Type } from "@typespec/compiler";
import {
  getMaxItems,
  getMinItems,
  isArrayModelType,
  resolveEncodedName,
} from "@typespec/compiler";
import { getNs, isAttribute } from "@typespec/xml";

import type { Fields, Path } from "../model.ts";

/**
 * The answers an XSD TypeSpec model describes, keyed as `xsdFields` keys the XSD it models:
 * by element path below the root, attributes as `@Name`, so the two compare directly.
 *
 * Read from a compiled program rather than from an emitted file, so it is imported only by
 * the test that compiles one -- never by `harness/index.ts`, which the site bundles.
 *
 *   - an element's name is its `@Xml.name`, or its property name;
 *   - its namespace is its own `@Xml.ns`, or its model's (`elementFormDefault="qualified"`);
 *   - it is required if it is not optional, nor a list with `@minItems(0)`, and neither is
 *     anything above it;
 *   - a list repeats `@maxItems` times, or without bound, and repeats multiply down the tree;
 *   - a property with a literal type is a fixed value, not an answer, and is left out, as
 *     `xsdFields` leaves out `fixed` elements and attributes.
 */
export function xsdModelFields(program: Program, root: Model): Fields {
  const fields: Fields = new Map();

  const walk = (
    model: Model,
    parent: Path,
    required: boolean,
    repeats: number | "unbounded",
  ): void => {
    for (const prop of properties(model)) {
      if (isLiteral(prop.type)) continue;
      const name = resolveEncodedName(program, prop, "application/xml");
      const list = prop.type.kind === "Model" && isArrayModelType(prop.type);
      const own =
        required &&
        !prop.optional &&
        (!list || (getMinItems(program, prop) ?? 1) > 0);

      if (isAttribute(program, prop)) {
        fields.set(`${parent}/@${name}`, {
          order: fields.size,
          required: own ? "yes" : "no",
          rules: { maxOccurs: repeats },
        });
        continue;
      }

      const path = parent ? `${parent}/${name}` : name;
      const times = list
        ? multiply(repeats, getMaxItems(program, prop) ?? "unbounded")
        : repeats;
      const type = list ? (prop.type as Model).indexer!.value : prop.type;
      if (type.kind === "Model" && !isArrayModelType(type)) {
        walk(type, path, own, times);
        continue;
      }
      fields.set(path, {
        order: fields.size,
        required: own ? "yes" : "no",
        rules: { maxOccurs: times, namespace: namespaceOf(program, prop) },
      });
    }
  };

  walk(root, "", true, 1);
  return fields;
}

/** Own and inherited properties in declaration order, base first. */
function properties(model: Model): ModelProperty[] {
  const chain: Model[] = [];
  for (let m: Model | undefined = model; m; m = m.baseModel) chain.unshift(m);
  return chain.flatMap((m) => [...m.properties.values()]);
}

const namespaceOf = (program: Program, prop: ModelProperty): string =>
  (getNs(program, prop) ?? (prop.model && getNs(program, prop.model)))
    ?.namespace ?? "";

const isLiteral = (type: Type) =>
  type.kind === "String" || type.kind === "Number" || type.kind === "Boolean";

const multiply = (
  a: number | "unbounded",
  b: number | "unbounded",
): number | "unbounded" =>
  a === "unbounded" || b === "unbounded" ? "unbounded" : a * b;
