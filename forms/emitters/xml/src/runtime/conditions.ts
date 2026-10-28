/**
 * The conditions `$when` tests: an operator on the answer at a path, `all`/`any` of other
 * conditions, or `not` another.
 */
import type { Condition } from "./format.js";
import { read } from "./paths.js";

/** Whether `condition` holds for `scope`. */
export function holds(condition: Condition, scope: unknown): boolean {
  if ("all" in condition) return condition.all.every((c) => holds(c, scope));
  if ("any" in condition) return condition.any.some((c) => holds(c, scope));
  if ("not" in condition) return !holds(condition.not, scope);
  const value = read(scope, condition.field);
  switch (condition.operator) {
    case "equals":
      return value === condition.value;
    case "not_equals":
      return value !== condition.value;
    case "in":
      return condition.value.includes(value);
    case "contains":
      return Array.isArray(value) && value.includes(condition.value);
    case "exists":
      return value !== undefined && value !== null && value !== "";
  }
}
