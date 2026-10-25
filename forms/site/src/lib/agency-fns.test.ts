import { beforeAll, expect, it } from "vitest";

import { loadFormSpec, type FormSpec } from "./formSpec";
import { createAjv } from "./validation";

// Edition-specific source decisions; deliberately independent of schema-derived bounds.
const forms = [
  "grant-program-accounting-system-financial-capability-questionnaire-fns-906",
];
const specs = new Map<string, FormSpec>();
beforeAll(async () => {
  for (const form of forms) specs.set(form, await loadFormSpec(form));
});
it.each(forms)("%s: every authored example validates", (form) => {
  const schema = specs.get(form)!.schema;
  const examples = (schema as { examples: object[] }).examples;
  expect(examples).toHaveLength(2);
  const validate = createAjv().compile(schema);
  for (const data of examples)
    expect(validate(data), JSON.stringify(validate.errors)).toBe(true);
});
it.each<{
  form: string;
  source_case: string;
  changes: [string, unknown][];
  remove: string[];
  valid: boolean;
}>([
  {
    form: "grant-program-accounting-system-financial-capability-questionnaire-fns-906",
    source_case: "Audited Yes with independent answers",
    changes: [
      ["audited", "Y: Yes"],
      ["qualified_opinion", "N: No"],
      ["material_weakness", "Y: Yes"],
      ["significant_deficiency", "N: No"],
    ],
    remove: [],
    valid: true,
  },
  {
    form: "grant-program-accounting-system-financial-capability-questionnaire-fns-906",
    source_case: "Audited No retains entered inactive followups",
    changes: [
      ["audited", "N: No"],
      ["qualified_opinion", "N: No"],
      ["material_weakness", "Y: Yes"],
      ["significant_deficiency", "N: No"],
    ],
    remove: [],
    valid: true,
  },
  {
    form: "grant-program-accounting-system-financial-capability-questionnaire-fns-906",
    source_case: "additional_information length 3001",
    changes: [["additional_information", "x".repeat(3001)]],
    remove: [],
    valid: false,
  },
  {
    form: "grant-program-accounting-system-financial-capability-questionnaire-fns-906",
    source_case: "hyperlink source is not narrowed to URL format",
    changes: [["hyperlink", "Report available from the organization"]],
    remove: [],
    valid: true,
  },
  {
    form: "grant-program-accounting-system-financial-capability-questionnaire-fns-906",
    source_case: "email malformed",
    changes: [["email", "not-an-email"]],
    remove: [],
    valid: false,
  },
])("$form: $source_case", ({ form, changes, remove, valid }) => {
  const spec = specs.get(form)!;
  const examples = (spec.schema as { examples: Record<string, unknown>[] })
    .examples;
  const data = structuredClone(
    examples.find((x) => form.includes("fns-906") && x.audited === "N: No") ??
      examples[0],
  );
  for (const [path, value] of changes) {
    const parts = (path as string).split(".");
    let target: Record<string, unknown> = data;
    for (const part of parts.slice(0, -1)) {
      const value = (target[part] ??= {});
      if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error(`Not an object: ${part}`);
      target = value as Record<string, unknown>;
    }
    if (remove.includes(path as string)) delete target[parts.at(-1)!];
    else target[parts.at(-1)!] = value;
  }
  const validate = createAjv().compile(spec.schema);
  expect(validate(data), JSON.stringify(validate.errors)).toBe(valid);
});
