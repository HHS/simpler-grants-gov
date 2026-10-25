import { beforeAll, expect, it } from "vitest";

import { loadFormSpec, type FormSpec } from "./formSpec";
import { createAjv } from "./validation";

// Edition-specific source decisions; deliberately independent of schema-derived bounds.
const forms = ["fra-f-30"];
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
    form: "fra-f-30",
    source_case: "name_and_title length 201",
    changes: [["name_and_title", "x".repeat(201)]],
    remove: [],
    valid: false,
  },
  {
    form: "fra-f-30",
    source_case: "on-file flag independently No",
    changes: [["workplaces_on_file", "N: No"]],
    remove: [],
    valid: true,
  },
  {
    form: "fra-f-30",
    source_case: "threshold flag independently Yes",
    changes: [["lobbying_certification_applies", "Y: Yes"]],
    remove: [],
    valid: true,
  },
  {
    form: "fra-f-30",
    source_case: "flag is not a numeric threshold",
    changes: [["lobbying_certification_applies", 100001]],
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
