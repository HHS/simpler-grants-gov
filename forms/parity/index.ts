/** The form library's build-time entry point. Consumers need no harness imports. */
import { DIFFS } from "./diffs/index.ts";
import { evaluateForm } from "./harness/index.ts";
import type { FormResult, Plan, PlanField } from "./result.ts";

export async function getFormResult<F extends PlanField>(
  plan: Plan<F>,
): Promise<FormResult<F> | null> {
  const diff = DIFFS.find((item) => item.slug === plan.slug);
  if (!diff) return null;
  const { fields, findings } = await evaluateForm(
    diff,
    new Map([[plan.slug, plan]]),
  );
  return { plan, fields: fields as FormResult<F>["fields"], findings };
}
export * from "./result.ts";
