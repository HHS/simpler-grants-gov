import type { Program, Scalar, Type } from "@typespec/compiler";
import { typeTags, type FormulaName } from "simpler-forms";

export type Json = Record<string, unknown>;

/** The API's rule for each formula. */
const RULE: Record<FormulaName, string> = {
  sum: "sum_monetary",
  subtract: "subtract_monetary",
  percentOf: "multiply_by_percentage",
};

/** Build the API rule that applies `formula` to the paths it reads. */
export function apiRule(formula: FormulaName, paths: string[]): Json {
  if (formula === "percentOf")
    return { rule: RULE[formula], amount: paths[0], percentage: paths[1] };
  return { rule: RULE[formula], fields: paths };
}

/** Return whether a field's type is money: a question or scalar with `@Meta.tag(money)`. */
export const isMoney = (p: Program, type: Type): boolean =>
  scalars(type).some((s) => typeTags(p, s).includes("money"));

/** Return whether a field's type is a whole number. */
export const isInteger = (p: Program, type: Type): boolean =>
  scalars(type).some((s) => p.checker.isStdType(s, "integer"));

/** A scalar and every scalar it extends. */
function scalars(type: Type): Scalar[] {
  const out: Scalar[] = [];
  for (
    let s: Scalar | undefined = type.kind === "Scalar" ? type : undefined;
    s;
    s = s.baseScalar
  )
    out.push(s);
  return out;
}
