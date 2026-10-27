/**
 * The conditions `$when` tests: an operator on the answer at a path, or `all`/`any` of other
 * conditions.
 */
import type { Condition } from "./format.js";
import { read } from "./paths.js";

/** Whether `condition` holds for `scope`. */
export function holds(condition: Condition, scope: unknown): boolean {
  if ("all" in condition) return condition.all.every((c) => holds(c, scope));
  if ("any" in condition) return condition.any.some((c) => holds(c, scope));
  const value = read(scope, condition.field);
  switch (condition.operator) {
    case "equals":
      return value === condition.value;
    case "not_equals":
      return value !== condition.value;
    case "in":
      return condition.value.includes(value);
    case "exists":
      return value !== undefined && value !== null && value !== "";
  }
}
