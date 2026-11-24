import type { ModelProperty } from "@typespec/compiler";

import type { Json } from "./rules.js";

/** An emitted formula, with the paths it reads. `assignOrder` sets its `order`. */
export interface Calculation {
  prop: ModelProperty;
  rule: Json;
  /** The answer's path, without list indexes. */
  at: string;
  /** The paths it reads, without list indexes. */
  refs: string[];
}

/**
 * Set each formula's `order` to one more than the highest order of the formulas it reads,
 * so the API runs a total of totals after the totals it adds up. Leave `order` off a formula
 * that reads only entered answers, since the API defaults it to 1. simpler-forms reports
 * formulas that read each other in a loop, so stop at one rather than recurse forever.
 */
export function assignOrder(all: Calculation[]): void {
  const byAt = new Map(all.map((c) => [c.at, c]));
  const orders = new Map<string, number>();
  const orderOf = (calculation: Calculation, path: Calculation[]): number => {
    const known = orders.get(calculation.at);
    if (known !== undefined) return known;
    if (path.includes(calculation)) return 1;
    const sources = calculation.refs
      .map((r) => byAt.get(r))
      .filter((c): c is Calculation => c !== undefined);
    const next = [...path, calculation];
    const order = 1 + Math.max(0, ...sources.map((s) => orderOf(s, next)));
    orders.set(calculation.at, order);
    return order;
  };
  for (const calculation of all) {
    const order = orderOf(calculation, []);
    if (order > 1) calculation.rule.order = order;
  }
}
