import { processFormSchema } from "@sgg/frontend/utils/applyForm/applyFormUtils";
import { beforeAll, describe, expect, it } from "vitest";

import { unadaptableScopes } from "../vendor/sgg/jsonFormsUiSchema";
import { loadFormSpec, type FormSpec } from "./formSpec";
import { createAjv } from "./validation";

// The source DAT calls these optional, while the actual XSD requires nonempty supplied text.
describe.each([
  ["nsf-deviation-authorization", ["deviation_authorization"]],
  [
    "nsf-suggested-reviewers",
    ["suggested_reviewers", "reviewers_not_to_include"],
  ],
] as const)("%s whole-text source contracts", (slug, keys) => {
  let spec: FormSpec;
  beforeAll(async () => {
    spec = await loadFormSpec(slug);
  });
  const valid = (value: unknown) => createAjv().compile(spec.schema)(value);

  it("uses existing native controls and validates populated/empty examples on declared paths", () => {
    const { formSchema } = processFormSchema(spec.schema);
    expect(unadaptableScopes(spec.uischema, formSchema)).toEqual([]);
    expect(Object.keys(spec.example ?? {})).toHaveLength(keys.length);
    const examples = (
      spec.schema as typeof spec.schema & {
        examples: Record<string, unknown>[];
      }
    ).examples;
    expect(examples).toHaveLength(2);
    const declared = new Set(Object.keys(spec.schema.properties ?? {}));
    for (const example of examples) {
      expect(valid(example)).toBe(true);
      expect(Object.keys(example).every((key) => declared.has(key))).toBe(true);
    }
  });

  it("allows omission without making an optional answer required", () => {
    expect(valid({})).toBe(true);
    expect(valid(null)).toBe(false);
  });

  it.each(keys)("preserves source min/max/type behavior for %s", (key) => {
    expect(valid({ [key]: "A" })).toBe(true);
    expect(valid({ [key]: "A".repeat(4000) })).toBe(true);
    expect(valid({ [key]: "" })).toBe(false);
    expect(valid({ [key]: "A".repeat(4001) })).toBe(false);
    expect(valid({ [key]: null })).toBe(false);
    expect(valid({ [key]: [{ name: "A reviewer" }] })).toBe(false);
  });
});
