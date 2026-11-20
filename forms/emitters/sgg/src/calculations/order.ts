import type { Json } from "./rules.js";

/** An emitted calculation, with the paths it reads. `assignOrder` sets its `order`. */
export interface Calculation {
  rule: Json;
  /** The answer's path, without list indexes. */
  at: string;
  /** The paths it reads, without list indexes. */
  refs: string[];
  /** The order from `@Validation.evaluationOrder`, if the form sets one. */
  order?: number;
}

/**
 * Set each calculation's `order` to one more than the deepest calculation it reads, so the
 * API runs a total of totals after the totals it adds up. Leave `order` off a calculation
 * that reads only entered answers, since it doesn't wait for another calculation.
 */
export function assignOrder(all: Calculation[]): void {
  const byAt = new Map(all.map((c) => [c.at, c]));
  const depths = new Map<string, number>();
  const depth = (at: string, visiting: Set<string>): number => {
    const calculation = byAt.get(at);
    if (!calculation) return 0;
    if (depths.has(at)) return depths.get(at)!;
    // Treat a cycle as depth 1. It has no valid order, so the API reads whatever is saved.
    if (visiting.has(at)) return 1;
    visiting.add(at);
    const d =
      1 + Math.max(0, ...calculation.refs.map((r) => depth(r, visiting)));
    visiting.delete(at);
    depths.set(at, d);
    return d;
  };
  for (const calculation of all) {
    const order = calculation.order ?? depth(calculation.at, new Set());
    if (calculation.order !== undefined || order > 1)
      calculation.rule.order = order;
  }
}
