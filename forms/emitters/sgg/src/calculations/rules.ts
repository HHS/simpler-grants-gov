import type { ModelProperty, Program, Scalar, Type } from "@typespec/compiler";
import { propCalculationMaterialization, typeTags } from "simpler-forms";

import { reportDiagnostic } from "../lib.js";

export type Json = Record<string, unknown>;

/** The API's rule for each `SimplerForms.Op`. */
const RULE: Record<string, string> = {
  Sum: "sum_monetary",
  Subtract: "subtract_monetary",
  PercentOf: "multiply_by_percentage",
};

/** Build the API rule that applies `operator` to `fields`. */
export function apiRule(operator: string, fields: string[]): Json {
  const rule: Json = { rule: RULE[operator] };
  if (operator === "PercentOf") {
    rule.amount = fields[0];
    rule.percentage = fields[1];
  } else rule.fields = fields;
  return rule;
}

/**
 * Check whether the API can run this calculation. Report an error when it can't, and a
 * warning when it ignores part of the declaration.
 */
export function isSupported(
  p: Program,
  prop: ModelProperty,
  operator: string,
): boolean {
  if (!RULE[operator]) {
    reportUnsupported(p, prop, `the API has no rule for ${operator}`);
    return false;
  }
  if (operator === "Sum" && hasTag(p, prop.type, "count")) {
    reportUnsupported(p, prop, "the API only sums money, not counts");
    return false;
  }
  if (propCalculationMaterialization(p, prop))
    reportDiagnostic(p, {
      code: "calculation-materialization-ignored",
      target: prop,
      format: { name: prop.name },
    });
  return true;
}

export function reportUnsupported(
  p: Program,
  prop: ModelProperty,
  reason: string,
): void {
  reportDiagnostic(p, {
    code: "unsupported-calculation",
    target: prop,
    format: { name: prop.name, reason },
  });
}

/** Return whether a field's type is money, which `@Validation.totals` adds up. */
export const isMoney = (p: Program, type: Type): boolean =>
  hasTag(p, type, "money");

/** Return whether a question or scalar, or a scalar it extends, has `@Meta.tag(tag)`. */
function hasTag(p: Program, type: Type, tag: string): boolean {
  if (type.kind === "Model") return typeTags(p, type).includes(tag);
  for (
    let s: Scalar | undefined = type.kind === "Scalar" ? type : undefined;
    s;
    s = s.baseScalar
  )
    if (typeTags(p, s).includes(tag)) return true;
  return false;
}
