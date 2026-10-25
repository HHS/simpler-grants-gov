import { beforeAll, expect, it } from "vitest";

import { loadFormSpec, type FormSpec } from "./formSpec";
import { createAjv } from "./validation";

// Edition-specific source decisions; deliberately independent of schema-derived bounds.
const forms = [
  "applicant-and-recipient-assurances-and-certifications-hud-424b",
  "oz-certification-form",
  "hud-50153",
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
    form: "applicant-and-recipient-assurances-and-certifications-hud-424b",
    source_case: "present empty optional name violates original XSD",
    changes: [["authorized_representative.name.prefix", ""]],
    remove: [],
    valid: false,
  },
  {
    form: "applicant-and-recipient-assurances-and-certifications-hud-424b",
    source_case: "invalid calendar date",
    changes: [["submission.date_signed", "2026-02-30"]],
    remove: [],
    valid: false,
  },
  {
    form: "oz-certification-form",
    source_case: 'whitespace-token limit 300 " "',
    changes: [["narrative", "  " + Array(300).fill("a").join(" ") + "  "]],
    remove: [],
    valid: true,
  },
  {
    form: "oz-certification-form",
    source_case: 'whitespace-token limit 301 " "',
    changes: [["narrative", "  " + Array(301).fill("a").join(" ") + "  "]],
    remove: [],
    valid: false,
  },
  {
    form: "oz-certification-form",
    source_case: "whole tract answer not silently parsed",
    changes: [["census_tracts", "06067001101; 06067001200"]],
    remove: [],
    valid: true,
  },
  {
    form: "oz-certification-form",
    source_case: "no inferred numerical percentage",
    changes: [["estimated_funding_allocations", 75]],
    remove: [],
    valid: false,
  },
  {
    form: "hud-50153",
    source_case: "designated_community length 201",
    changes: [["designated_community", "x".repeat(201)]],
    remove: [],
    valid: false,
  },
  {
    form: "hud-50153",
    source_case: "exact geographic code Within Boundries",
    changes: [["geographic_criteria", "Within Boundries"]],
    remove: [],
    valid: true,
  },
  {
    form: "hud-50153",
    source_case: "unknown geographic code",
    changes: [["geographic_criteria", "Elsewhere"]],
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
