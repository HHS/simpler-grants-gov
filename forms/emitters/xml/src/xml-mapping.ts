import type {
  EnumMember,
  Model,
  ModelProperty,
  Program,
  Type,
} from "@typespec/compiler";
import { resolveEncodedName } from "@typespec/compiler";
import { getNs, isAttribute } from "@typespec/xml";
import {
  jsonPropertyName,
  mappedFromRoot,
  modelProperties,
  propMappedFrom,
  type PropertyCasing,
} from "./simpler-forms.js";
import { reportDiagnostic, stateKeys } from "./lib.js";
import { transformOf } from "./transforms.js";
import { declaredNamespaces } from "./xml-transform.js";
import {
  XML_MAPPING_FORMAT,
  type Elements,
  type Value,
  type XmlMapping,
} from "./runtime/format.js";

/**
 * `form`'s XML mapping in `mapping`, or undefined if no XSD TypeSpec model names `form` with
 * `@Mapping.from`.
 *
 * The mapping is the XSD TypeSpec model, walked in its declared order, which is the XSD's
 * sequence:
 *
 *   - an element with `@Mapping.from` reads the field it names, found among the fields of
 *     the one its parent reads, with a path relative to the response or, in a list, the item;
 *   - a list of elements is an `$each` over the field it reads, and a list of attachments an
 *     `$each` whose items are the upload ids themselves (`.`);
 *   - an element with no `@Mapping.from` whose own elements read fields is a wrapper: a key
 *     with its elements under it, reading from the same field as its parent;
 *   - an element whose type is a `@GrantsGov.attachment` scalar is an `$attachment`;
 *   - `@Mapping.transform` wraps the value in a `$transform`;
 *   - a literal-typed `@Xml.attribute` is a `$const`.
 *
 * Unlike `xmlTransform`'s rules, nothing is left out: every element the form fills is in the
 * mapping, wherever it sits.
 */
export function xmlMapping(
  program: Program,
  form: Model,
  mapping: EnumMember,
  casing: PropertyCasing,
): XmlMapping | undefined {
  const root = mappedFromRoot(program, form, mapping);
  if (!root) return undefined;
  const rootNs = getNs(program, root);
  if (!rootNs) {
    reportDiagnostic(program, {
      code: "xml-root-namespace-missing",
      target: root,
      format: { name: root.name, mapping: mapping.name },
    });
    return undefined;
  }
  const xsdUrl = program.stateMap(stateKeys.xsd).get(root) as
    string | undefined;

  const key = (prop: ModelProperty | Model, attribute = false) => {
    const name = resolveEncodedName(program, prop, "application/xml");
    const ns =
      getNs(program, prop) ??
      (prop.kind === "ModelProperty" && prop.model
        ? getNs(program, prop.model)
        : undefined);
    // An attribute is unqualified unless prefixed, so it always takes one.
    if (attribute) return `@${ns?.prefix ?? rootNs.prefix}:${name}`;
    return ns && ns.namespace !== rootNs.namespace
      ? `${ns.prefix}:${name}`
      : name;
  };
  const path = (prefix: string[], steps: ModelProperty[]) => [
    ...prefix,
    ...steps.map((step) => jsonPropertyName(program, step, casing)),
  ];

  /**
   * `into`'s elements, filled from `from`, which sits at `prefix` below the response or the
   * current item.
   */
  const walk = (
    into: Model,
    from: Model,
    prefix: string[],
    stack: Model[],
  ): Elements => {
    const elements: Elements = {};
    // Attributes first, as an element's start tag carries them.
    const props = modelProperties(into);
    for (const prop of props.filter((p) => isAttribute(program, p))) {
      const value = literalValue(prop.type);
      const source = sourcePath(program, prop, mapping, from);
      if (value !== undefined) elements[key(prop, true)] = { $const: value };
      else if (source)
        elements[key(prop, true)] = { $field: path(prefix, source).join(".") };
    }

    for (const prop of props.filter((p) => !isAttribute(program, p))) {
      const to = shapeOf(prop.type);
      const source = sourcePath(program, prop, mapping, from);
      if (!source) {
        if (propMappedFrom(program, prop, mapping).length) continue; // reported by simpler-forms
        if (!to.object || to.array || stack.includes(to.object)) continue;
        // A wrapper: its elements read from the same field as its parent.
        const inner = walk(to.object, from, prefix, [...stack, to.object]);
        if (Object.keys(inner).length) elements[key(prop)] = inner;
        continue;
      }
      const steps = path(prefix, source);
      const field = steps.join(".");
      const shape = shapeOf(source.at(-1)!.type);
      if (
        to.array &&
        !to.object &&
        shape.array &&
        !shape.object &&
        isAttachment(program, to.item)
      ) {
        // A list of upload ids: the element once per id, each item the id itself.
        elements[key(prop)] = {
          $each: { items: { $field: field }, map: { $attachment: "." } },
        };
        continue;
      }
      if (to.array) {
        if (!to.object || !shape.object) {
          reportDiagnostic(program, {
            code: "xml-mapping-unsupported",
            target: prop,
            format: { element: key(prop), reason: "a list of values" },
          });
          continue;
        }
        elements[key(prop)] = {
          $each: {
            items: { $field: field },
            // Inside `$each`, paths are relative to the item.
            map: walk(to.object, shape.object, [], [...stack, to.object]),
          },
        };
        continue;
      }
      if (to.object && shape.object) {
        const inner = walk(to.object, shape.object, steps, [
          ...stack,
          to.object,
        ]);
        if (Object.keys(inner).length) elements[key(prop)] = inner;
        continue;
      }
      elements[key(prop)] = leaf(program, prop, field);
    }
    return elements;
  };

  return {
    format: XML_MAPPING_FORMAT,
    namespaces: {
      default: rootNs.namespace,
      ...declaredNamespaces(program, rootNs),
    },
    ...(xsdUrl ? { xsd_url: xsdUrl } : {}),
    root: { [key(root)]: walk(root, form, [], [root]) },
  };
}

/** A value element: its field, as an attachment, transformed, or as it is. */
function leaf(program: Program, prop: ModelProperty, field: string): Value {
  if (isAttachment(program, prop.type)) return { $attachment: field };
  const transform = transformOf(program, prop);
  return transform
    ? { $transform: { name: transform, value: { $field: field } } }
    : { $field: field };
}

/**
 * The properties from `from` to the field `prop`'s `@Mapping.from` names: a field of `from`
 * itself, or one below an object field of it with no element of its own.
 */
function sourcePath(
  program: Program,
  prop: ModelProperty,
  mapping: EnumMember,
  from: Model,
): ModelProperty[] | undefined {
  return propMappedFrom(program, prop, mapping)
    .map((source) => pathTo(from, source))
    .find((found) => found !== undefined);
}

function pathTo(
  model: Model,
  field: ModelProperty,
  seen: Model[] = [],
): ModelProperty[] | undefined {
  for (const prop of modelProperties(model))
    if (copies(prop, field)) return [prop];
  for (const prop of modelProperties(model)) {
    const shape = shapeOf(prop.type);
    if (!shape.object || shape.array || seen.includes(shape.object)) continue;
    const below = pathTo(shape.object, field, [...seen, model]);
    if (below) return [prop, ...below];
  }
  return undefined;
}

/** A copy made by spread or `is` counts as the property it was copied from. */
const copies = (prop: ModelProperty, field: ModelProperty) => {
  for (let p: ModelProperty | undefined = prop; p; p = p.sourceProperty)
    if (p === field) return true;
  return false;
};

/** Whether a type is a `@GrantsGov.attachment` scalar: an upload id. */
const isAttachment = (program: Program, type: Type | undefined) =>
  type?.kind === "Scalar" && program.stateSet(stateKeys.attachment).has(type);

/**
 * Whether a type is a list, and the object it holds (directly or as each entry), if any. A
 * list's `item` is its entries' type.
 */
function shapeOf(type: Type): { array: boolean; object?: Model; item?: Type } {
  if (type.kind === "Model" && type.indexer?.key.name === "integer") {
    const item = type.indexer.value;
    return {
      array: true,
      object: item.kind === "Model" ? item : undefined,
      item,
    };
  }
  return { array: false, object: type.kind === "Model" ? type : undefined };
}

function literalValue(type: Type): string | number | boolean | undefined {
  if (
    type.kind === "String" ||
    type.kind === "Number" ||
    type.kind === "Boolean"
  )
    return type.value;
  return undefined;
}
