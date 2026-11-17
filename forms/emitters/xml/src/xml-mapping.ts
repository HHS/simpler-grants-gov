import {
  resolveEncodedName,
  type EnumMember,
  type Model,
  type ModelProperty,
  type Program,
  type Type,
} from "@typespec/compiler";
import { getNs, isAttribute } from "@typespec/xml";

import { reportDiagnostic, stateKeys } from "./lib.js";
import {
  XML_MAPPING_FORMAT,
  type Condition,
  type Elements,
  type Value,
  type XmlMapping,
} from "./runtime/format.js";
import {
  jsonPropertyName,
  mappedFromRoot,
  modelProperties,
  propMappedFrom,
  propMappedFromLinks,
  propMappingConditions,
  propMappingRequired,
  propMatch,
  propTransform,
  type MappingSelection,
  type PropertyCasing,
} from "./simpler-forms.js";
import { declaredNamespaces } from "./xml-transform.js";

/**
 * `form`'s XML mapping in `mapping`, or undefined if no XSD TypeSpec model names `form` with
 * `@Mapping.from`.
 *
 * The mapping is the XSD TypeSpec model, walked in its declared order, which is the XSD's
 * sequence:
 *
 *   - an element with `@Mapping.from` reads the field it names, found among the fields of
 *     the one its parent reads, with a path relative to the response or, in a list, the item;
 *   - a list of elements is an `$each` over the field it reads, and a list of values (or of
 *     attachments) an `$each` whose items are the values themselves (`.`);
 *   - an element with no `@Mapping.from` whose own elements read fields is a wrapper: a key
 *     with its elements under it, reading from the same field as its parent;
 *   - an element whose type is a `@GrantsGov.attachment` scalar is an `$attachment`;
 *   - `@Mapping.transform` wraps the value in a `$transform`, with its `params`;
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
      const found = sourcePath(program, prop, mapping, from);
      if (value !== undefined) elements[key(prop, true)] = { $const: value };
      else if (found)
        elements[key(prop, true)] = wrap(
          prop,
          {
            $field: selected(path(prefix, found.path), found.select).join("."),
          },
          from,
          prefix,
        );
    }

    for (const prop of props.filter((p) => !isAttribute(program, p))) {
      const to = shapeOf(prop.type);
      const found = sourcePath(program, prop, mapping, from);
      const put = (value: Value) => {
        elements[key(prop)] = wrap(prop, value, from, prefix);
      };
      if (!found) {
        if (propMappedFrom(program, prop, mapping).length) continue; // reported by simpler-forms
        if (!to.object || to.array || stack.includes(to.object)) continue;
        // A wrapper: its elements read from the same field as its parent.
        const inner = walk(to.object, from, prefix, [...stack, to.object]);
        if (Object.keys(inner).length) put(inner);
        continue;
      }
      // An `Item` or `Slice` brackets the field's last step: `types[0]`, `sites[1:]`.
      const steps = selected(path(prefix, found.path), found.select);
      const field = steps.join(".");
      const listed = shapeOf(found.path.at(-1)!.type);
      // One item of a list is a single value or object; a slice is still a list.
      const shape =
        found.select && "index" in found.select
          ? { array: false, object: listed.object }
          : listed;
      if (to.array && !to.object && shape.array && !shape.object) {
        // A list of values: the element once per value, each item the value itself.
        put({
          $each: {
            items: { $field: field },
            map: leaf(program, prop, ".", to.item),
          },
        });
        continue;
      }
      if (to.array) {
        if (!shape.array) continue; // reported by simpler-forms
        if (!to.object || !shape.object) {
          reportDiagnostic(program, {
            code: "xml-mapping-unsupported",
            target: prop,
            format: {
              element: key(prop),
              reason: to.object
                ? "a list of elements filled from a list of values"
                : "a list of values filled from a list of objects",
            },
          });
          continue;
        }
        put({
          $each: {
            items: { $field: field },
            // Inside `$each`, paths are relative to the item.
            map: walk(to.object, shape.object, [], [...stack, to.object]),
          },
        });
        continue;
      }
      if (to.object && shape.object) {
        const inner = walk(to.object, shape.object, steps, [
          ...stack,
          to.object,
        ]);
        if (Object.keys(inner).length) put(guard(prop, inner, field));
        continue;
      }
      put(leaf(program, prop, field));
    }
    return elements;
  };

  /**
   * `value` as `prop`'s decorators change it, from the inside out: looked up with
   * `@Mapping.match`, written only while its `@Mapping.when` conditions hold, and written
   * empty when it has nothing to write with `@Mapping.required`. `from` and `prefix` are the
   * scope its fields are read in.
   */
  const wrap = (
    prop: ModelProperty,
    value: Value,
    from: Model,
    prefix: string[],
  ): Value => {
    let out = value;
    const match = propMatch(program, prop);
    if (match) {
      const fallback = match.default;
      out = {
        $match: {
          value,
          case: match.cases,
          ...(fallback === undefined
            ? {}
            : {
                default:
                  "value" in fallback
                    ? fallback.value
                    : sourceOf(prop, from) === fallback.field
                      ? value
                      : fieldAt(prop, fallback.field, undefined, from, prefix),
              }),
        },
      };
    }
    const conditions = propMappingConditions(program, prop).map(
      (c): Condition => {
        const field = fieldAt(prop, c.source, c.select, from, prefix).$field;
        const operator = OPERATORS[c.operator];
        return (
          c.value === undefined
            ? { field, operator }
            : { field, operator, value: c.value }
        ) as Condition;
      },
    );
    if (conditions.length)
      out = {
        $when: {
          condition:
            conditions.length === 1 ? conditions[0] : { all: conditions },
          then: out,
        },
      };
    if (propMappingRequired(program, prop)) out = { $required: out };
    return out;
  };

  /** The field `prop`'s `@Mapping.from` names in this scope, if it names one. */
  const sourceOf = (prop: ModelProperty, from: Model) =>
    sourcePath(program, prop, mapping, from)?.path.at(-1);

  /**
   * `field`, which `prop`'s decorators name, as a `$field` in the scope `from` and `prefix`
   * describe. Reported when it isn't reachable there.
   */
  const fieldAt = (
    prop: ModelProperty,
    field: ModelProperty,
    select: MappingSelection | undefined,
    from: Model,
    prefix: string[],
  ) => {
    const found = pathTo(from, field);
    if (!found)
      reportDiagnostic(program, {
        code: "xml-mapping-field-unreachable",
        target: prop,
        format: { element: key(prop), field: field.name },
      });
    return {
      $field: selected(path(prefix, found ?? [field]), select).join("."),
    };
  };

  /**
   * An optional element of its own, filled from `field`, is left out when the field isn't
   * answered: its `@Mapping.required` elements would otherwise write it, empty.
   */
  const guard = (prop: ModelProperty, inner: Elements, field: string): Value =>
    prop.optional && JSON.stringify(inner).includes('"$required"')
      ? { $when: { condition: { field, operator: "exists" }, then: inner } }
      : inner;

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

/**
 * A value element: its field, as an attachment, transformed, or as it is. `type` is the
 * value's, which for a list of values is each entry's.
 */
function leaf(
  program: Program,
  prop: ModelProperty,
  field: string,
  type = prop.type,
): Value {
  if (isAttachment(program, type)) return { $attachment: field };
  const { name: transform, params } = propTransform(program, prop) ?? {};
  return transform
    ? {
        $transform: {
          name: transform,
          value: { $field: field },
          ...(params ? { params } : {}),
        },
      }
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
): { path: ModelProperty[]; select?: MappingSelection } | undefined {
  for (const link of propMappedFromLinks(program, prop, mapping)) {
    const path = pathTo(from, link.source);
    if (path) return { path, ...(link.select ? { select: link.select } : {}) };
  }
  return undefined;
}

/** `steps` with the bracket step `select` adds to the last: `types[0]`, `sites[1:]`. */
function selected(steps: string[], select?: MappingSelection): string[] {
  if (!select) return steps;
  const bracket =
    "index" in select
      ? `[${select.index}]`
      : `[${select.start || ""}:${select.stop ?? ""}]`;
  return [...steps.slice(0, -1), `${steps.at(-1)}${bracket}`];
}

/** `SimplerForms.Operator`'s members, as the format's `$when` names them. */
const OPERATORS = {
  equals: "equals",
  notEquals: "not_equals",
  in: "in",
  contains: "contains",
  exists: "exists",
} as const;

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
