import type {
  EnumMember,
  Model,
  ModelProperty,
  Program,
} from "@typespec/compiler";
import { getNs, isAttribute } from "@typespec/xml";

import { reportDiagnostic, stateKeys } from "./lib.js";
import {
  XML_MAPPING_FORMAT,
  type Elements,
  type Value,
  type XmlMapping,
} from "./runtime/format.js";
import {
  mappedFromRoot,
  modelProperties,
  propMappedFrom,
  type PropertyCasing,
} from "./simpler-forms.js";
import {
  elementKey,
  jsonPath,
  type MappingContext,
  type ReadScope,
} from "./xml-mapping/context.js";
import {
  applyMappingDecorators,
  skipWhenUnanswered,
} from "./xml-mapping/decorators.js";
import {
  findMappedSource,
  withSelection,
  type MappedSource,
} from "./xml-mapping/fields.js";
import {
  literalValue,
  typeShape,
  valueElement,
  type TypeShape,
} from "./xml-mapping/types.js";
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
  const ctx: MappingContext = { program, mapping, casing, rootNs };

  return {
    format: XML_MAPPING_FORMAT,
    namespaces: {
      default: rootNs.namespace,
      ...declaredNamespaces(program, rootNs),
    },
    ...(xsdUrl ? { xsd_url: xsdUrl } : {}),
    root: {
      [elementKey(ctx, root)]: mapElements(
        ctx,
        root,
        { from: form, prefix: [] },
        [root],
      ),
    },
  };
}

/**
 * Return the shape of what `found` reads. One item of a list is a single value or object; a
 * slice is still a list.
 */
function selectedShape(found: MappedSource): TypeShape {
  const listed = typeShape(found.path.at(-1)!.type);
  return found.select && "index" in found.select
    ? { array: false, object: listed.object }
    : listed;
}

/**
 * Return the mapping for the elements of the XSD model `into`, reading their fields in
 * `scope`. `stack` lists the XSD models already being mapped, to stop at a recursive type.
 */
function mapElements(
  ctx: MappingContext,
  into: Model,
  scope: ReadScope,
  stack: Model[],
): Elements {
  const { program, mapping } = ctx;
  const elements: Elements = {};
  const props = modelProperties(into);

  // Write attributes first, since they go in the element's start tag.
  for (const prop of props.filter((p) => isAttribute(program, p))) {
    const value = literalValue(prop.type);
    const found = findMappedSource(program, prop, mapping, scope.from);
    if (value !== undefined) {
      elements[elementKey(ctx, prop, true)] = { $const: value };
      continue;
    }
    if (!found) continue;
    const field = withSelection(
      jsonPath(ctx, scope.prefix, found.path),
      found.select,
    ).join(".");
    const source = selectedShape(found);
    if (source.object && !source.array) {
      reportObjectIntoValue(ctx, prop, field, source.object, true);
      continue;
    }
    elements[elementKey(ctx, prop, true)] = applyMappingDecorators(
      ctx,
      prop,
      { $field: field },
      scope,
    );
  }

  for (const prop of props.filter((p) => !isAttribute(program, p))) {
    const to = typeShape(prop.type);
    const found = findMappedSource(program, prop, mapping, scope.from);
    const put = (value: Value) => {
      elements[elementKey(ctx, prop)] = applyMappingDecorators(
        ctx,
        prop,
        value,
        scope,
      );
    };
    if (!found) {
      if (propMappedFrom(program, prop, mapping).length) continue; // reported by simpler-forms
      if (!to.object || to.array || stack.includes(to.object)) continue;
      // A wrapper: its elements read from the same field as its parent.
      const inner = mapElements(ctx, to.object, scope, [...stack, to.object]);
      if (Object.keys(inner).length) put(inner);
      continue;
    }
    // An `Item` or `Slice` brackets the field's last step: `types[0]`, `sites[1:]`.
    const steps = withSelection(
      jsonPath(ctx, scope.prefix, found.path),
      found.select,
    );
    const field = steps.join(".");
    const shape = selectedShape(found);
    if (to.array && !to.object && shape.array && !shape.object) {
      // A list of values: the element once per value, each item the value itself.
      put({
        $each: {
          items: { $field: field },
          map: valueElement(program, prop, ".", to.item),
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
            element: elementKey(ctx, prop),
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
          map: mapElements(ctx, to.object, { from: shape.object, prefix: [] }, [
            ...stack,
            to.object,
          ]),
        },
      });
      continue;
    }
    if (to.object && shape.object) {
      const inner = mapElements(
        ctx,
        to.object,
        { from: shape.object, prefix: steps },
        [...stack, to.object],
      );
      if (Object.keys(inner).length)
        put(skipWhenUnanswered(prop, inner, field));
      continue;
    }
    if (shape.object && !shape.array) {
      reportObjectIntoValue(ctx, prop, field, shape.object);
      continue;
    }
    put(valueElement(program, prop, field));
  }
  return elements;
}

/**
 * Report an element or attribute with a single value that reads an object, since the API
 * would write the whole object as the element's text.
 */
function reportObjectIntoValue(
  ctx: MappingContext,
  prop: ModelProperty,
  field: string,
  object: Model,
  attribute = false,
): void {
  reportDiagnostic(ctx.program, {
    code: "xml-mapping-object-into-value",
    target: prop,
    format: {
      element: elementKey(ctx, prop, attribute),
      field,
      model: object.name,
    },
  });
}
