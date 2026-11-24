import type {
  EnumMember,
  Model,
  ModelProperty,
  Program,
} from "@typespec/compiler";

import { reportDiagnostic } from "../lib.js";
import {
  modelProperties,
  propMappedFromLinks,
  type MappingSelection,
} from "../simpler-forms.js";
import {
  elementKey,
  jsonPath,
  type MappingContext,
  type ReadScope,
} from "./context.js";
import { typeShape } from "./types.js";

/** The form field an element reads, as the properties from its scope down to the field. */
export interface MappedSource {
  path: ModelProperty[];
  /** The `Item<>` or `Slice<>` that `@Mapping.from` selects from the field, if any. */
  select?: MappingSelection;
}

/**
 * Find the field that `prop`'s `@Mapping.from` names in the model `from`. Try each field it
 * names in order, since an element shared by several forms names one field per form.
 */
export function findMappedSource(
  program: Program,
  prop: ModelProperty,
  mapping: EnumMember,
  from: Model,
): MappedSource | undefined {
  for (const link of propMappedFromLinks(program, prop, mapping)) {
    const path = findFieldPath(from, link.source);
    if (path) return { path, ...(link.select ? { select: link.select } : {}) };
  }
  return undefined;
}

/**
 * Return the properties from `model` to `field`: `field` itself when it's a property of
 * `model`, or a path through object properties of `model` that have no element of their own.
 */
export function findFieldPath(
  model: Model,
  field: ModelProperty,
  seen: Model[] = [],
): ModelProperty[] | undefined {
  for (const prop of modelProperties(model))
    if (isCopyOf(prop, field)) return [prop];
  for (const prop of modelProperties(model)) {
    const shape = typeShape(prop.type);
    if (!shape.object || shape.array || seen.includes(shape.object)) continue;
    const below = findFieldPath(shape.object, field, [...seen, model]);
    if (below) return [prop, ...below];
  }
  return undefined;
}

/**
 * Return whether `prop` is `field`, or a copy of it. Count a copy made by spread or `is`,
 * since a form often reuses a question's properties that way.
 */
function isCopyOf(prop: ModelProperty, field: ModelProperty): boolean {
  for (let p: ModelProperty | undefined = prop; p; p = p.sourceProperty)
    if (p === field) return true;
  return false;
}

/**
 * Add the bracket that `select` puts on the last step of a path: `types[0]` for an
 * `Item<>`, `sites[1:]` for a `Slice<>`.
 */
export function withSelection(
  steps: string[],
  select?: MappingSelection,
): string[] {
  if (!select) return steps;
  const bracket =
    "index" in select
      ? `[${select.index}]`
      : `[${select.start || ""}:${select.stop ?? ""}]`;
  return [...steps.slice(0, -1), `${steps.at(-1)}${bracket}`];
}

/**
 * Return a `$field` that reads `field` in `scope`, for a field that one of `prop`'s mapping
 * decorators names. Report an error when `field` isn't in that scope, since the API would
 * read nothing at the path.
 */
export function fieldReference(
  ctx: MappingContext,
  prop: ModelProperty,
  field: ModelProperty,
  select: MappingSelection | undefined,
  scope: ReadScope,
): { $field: string } {
  const found = findFieldPath(scope.from, field);
  if (!found)
    reportDiagnostic(ctx.program, {
      code: "xml-mapping-field-out-of-scope",
      target: prop,
      format: {
        element: elementKey(ctx, prop),
        field: field.name,
        scope: scope.from.name,
      },
    });
  return {
    $field: withSelection(
      jsonPath(ctx, scope.prefix, found ?? [field]),
      select,
    ).join("."),
  };
}
