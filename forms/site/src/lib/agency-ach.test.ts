import { beforeAll, expect, it } from "vitest";

import { loadFormSpec, type FormSpec } from "./formSpec";
import { createAjv } from "./validation";

// Edition-specific source decisions; deliberately independent of schema-derived bounds.
const forms = ["ach-vendor-miscellaneous-payment-enrollment-form"];
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
    form: "ach-vendor-miscellaneous-payment-enrollment-form",
    source_case: "routing source digits 000123456",
    changes: [["financial_institution.routing_transit_number", "000123456"]],
    remove: [],
    valid: true,
  },
  {
    form: "ach-vendor-miscellaneous-payment-enrollment-form",
    source_case: "routing source digits 12345678X",
    changes: [["financial_institution.routing_transit_number", "12345678X"]],
    remove: [],
    valid: false,
  },
  {
    form: "ach-vendor-miscellaneous-payment-enrollment-form",
    source_case: "routing source digits ０００１２３４５６",
    changes: [
      ["financial_institution.routing_transit_number", "０００１２３４５６"],
    ],
    remove: [],
    valid: false,
  },
  {
    form: "ach-vendor-miscellaneous-payment-enrollment-form",
    source_case: "account source digits 0000",
    changes: [["financial_institution.account_number", "0000"]],
    remove: [],
    valid: true,
  },
  {
    form: "ach-vendor-miscellaneous-payment-enrollment-form",
    source_case: "account source digits 00AB",
    changes: [["financial_institution.account_number", "00AB"]],
    remove: [],
    valid: false,
  },
  {
    form: "ach-vendor-miscellaneous-payment-enrollment-form",
    source_case:
      "60-character title is not limited to the45-character bank question",
    changes: [
      [
        "financial_institution.authorized_official.title",
        "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      ],
    ],
    remove: [],
    valid: true,
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
