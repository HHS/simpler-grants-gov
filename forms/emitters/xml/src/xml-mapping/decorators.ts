import type { ModelProperty } from "@typespec/compiler";

import type { Condition, Elements, Value } from "../runtime/format.js";
import {
  propMappingConditions,
  propMappingRequired,
  propMatch,
} from "../simpler-forms.js";
import type { MappingContext, ReadScope } from "./context.js";
import { fieldReference, findMappedSource } from "./fields.js";

/** Map simpler-forms' `Operator` members to the operator names `$when` uses. */
const OPERATOR_NAMES = {
  equals: "equals",
  notEquals: "not_equals",
  in: "in",
  contains: "contains",
  exists: "exists",
} as const;

/**
 * Apply `prop`'s mapping decorators to the `value` it writes. Apply them from the inside
 * out: `@Mapping.match` looks the value up, `@Mapping.when` writes it only while its
 * conditions are true, and `@Mapping.required` writes the element empty when there's no
 * value. `scope` is where the fields these decorators name are read.
 */
export function applyMappingDecorators(
  ctx: MappingContext,
  prop: ModelProperty,
  value: Value,
  scope: ReadScope,
): Value {
  let out = matchValue(ctx, prop, value, scope);
  const conditions = whenConditions(ctx, prop, scope);
  if (conditions.length)
    out = {
      $when: {
        condition:
          conditions.length === 1 ? conditions[0] : { all: conditions },
        then: out,
      },
    };
  if (propMappingRequired(ctx.program, prop)) out = { $required: out };
  return out;
}

/**
 * Wrap `value` in a `$match` when `prop` has `@Mapping.match`. A default that names the
 * element's own source field reuses `value`, so the lookup falls back to the answer itself.
 */
function matchValue(
  ctx: MappingContext,
  prop: ModelProperty,
  value: Value,
  scope: ReadScope,
): Value {
  const match = propMatch(ctx.program, prop);
  if (!match) return value;
  const fallback = match.default;
  if (fallback === undefined) return { $match: { value, case: match.cases } };
  const ownSource = findMappedSource(
    ctx.program,
    prop,
    ctx.mapping,
    scope.from,
  )?.path.at(-1);
  const defaultValue =
    "value" in fallback
      ? fallback.value
      : ownSource === fallback.field
        ? value
        : fieldReference(ctx, prop, fallback.field, undefined, scope);
  return { $match: { value, case: match.cases, default: defaultValue } };
}

/** Return the `$when` conditions from `prop`'s `@Mapping.when` decorators. */
function whenConditions(
  ctx: MappingContext,
  prop: ModelProperty,
  scope: ReadScope,
): Condition[] {
  return propMappingConditions(ctx.program, prop).map((condition) => {
    const field = fieldReference(
      ctx,
      prop,
      condition.source,
      condition.select,
      scope,
    ).$field;
    const operator = OPERATOR_NAMES[condition.operator];
    return (
      condition.value === undefined
        ? { field, operator }
        : { field, operator, value: condition.value }
    ) as Condition;
  });
}

/**
 * Write an optional element only when its source `field` is answered. Without this, the
 * `@Mapping.required` elements inside it would write it, empty, for an unanswered field.
 */
export function skipWhenUnanswered(
  prop: ModelProperty,
  elements: Elements,
  field: string,
): Value {
  return prop.optional && JSON.stringify(elements).includes('"$required"')
    ? { $when: { condition: { field, operator: "exists" }, then: elements } }
    : elements;
}
