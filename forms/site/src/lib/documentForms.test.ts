import {
  buildWarningTree,
  processFormSchema,
  shapeFormData,
} from "@sgg/frontend/utils/applyForm/applyFormUtils";
import { describe, expect, it } from "vitest";

import { jsonFormsToUiSchema } from "../vendor/sgg/jsonFormsUiSchema";
import { loadFormSpec } from "./formSpec";
import {
  completeWarnings,
  createAjv,
  toValidationWarnings,
} from "./validation";

const first = "00000000-0000-4000-8000-000000000001";
const second = "00000000-0000-4000-8000-000000000002";
const lists = [
  "project-narrative-attachment-form",
  "budget-narrative-attachment-form",
  "other-attachments-form",
];
const singles = ["project-abstract", "ed-abstract-form"];

describe.each([
  ...lists,
  ...singles,
  "attachments",
  "project-abstract-summary",
])("%s authored examples", (id) => {
  it("validates every compiled TypeSpec example, not only the first", async () => {
    const { schema } = await loadFormSpec(id);
    const examples = (schema as { examples?: object[] }).examples ?? [];
    expect(examples.length).toBeGreaterThan(0);
    const validate = createAjv().compile(schema);
    for (const example of examples)
      expect(validate(example), JSON.stringify(validate.errors)).toBe(true);
  });
});

describe.each(lists)("%s ordered file answers", (id) => {
  it("retains invalid-item warnings even when the SGG formatter cannot place them", async () => {
    const { schema, uischema } = await loadFormSpec(id);
    const { formSchema } = processFormSchema(schema);
    const validate = createAjv().compile(schema);
    expect(validate({ attachments: ["not-a-uuid"] })).toBe(false);
    const raw = toValidationWarnings(validate.errors ?? []);
    const formatted = buildWarningTree(
      jsonFormsToUiSchema(uischema, formSchema),
      null,
      raw,
      formSchema,
    );
    expect(completeWarnings(raw, formatted)).toContainEqual(
      expect.objectContaining({ field: "$.attachments[0]", type: "format" }),
    );
  });
  it("accepts one through 100 UUIDs and rejects empty, oversized and non-ID answers", async () => {
    const { schema } = await loadFormSpec(id);
    const validate = createAjv().compile(schema);
    for (const count of [1, 2, 100])
      expect(validate({ attachments: Array(count).fill(first) })).toBe(true);
    for (const data of [
      {},
      { attachments: [] },
      { attachments: Array(101).fill(first) },
      { attachments: ["not-a-uuid"] },
      { attachments: [{ file_name: "example.pdf" }] },
      { attachments: first },
    ]) {
      expect(validate(data), JSON.stringify(data)).toBe(false);
    }
  });
  it("uses the SGG collector without changing order or inventing a document wrapper", async () => {
    const { schema } = await loadFormSpec(id);
    const { formSchema } = processFormSchema(schema);
    const values = new FormData();
    values.set("attachments[0]", second);
    values.set("attachments[1]", first);
    expect(shapeFormData(values, formSchema)).toEqual({
      attachments: [second, first],
    });
    values.delete("attachments[1]");
    expect(shapeFormData(values, formSchema)).toEqual({
      attachments: [second],
    });
  });
});

describe.each(singles)("%s one file answer", (id) => {
  it("requires one ID and rejects a descriptor or list", async () => {
    const { schema } = await loadFormSpec(id);
    const validate = createAjv().compile(schema);
    expect(validate({ attachment: first })).toBe(true);
    for (const value of [
      {},
      { attachment: [] },
      { attachment: [first] },
      { attachment: "" },
      { attachment: "not-a-uuid" },
      { attachment: { id: first } },
    ])
      expect(validate(value)).toBe(false);
    const values = new FormData();
    values.set("attachment", first);
    expect(shapeFormData(values, processFormSchema(schema).formSchema)).toEqual(
      { attachment: first },
    );
  });
});

describe("fifteen named application-file slots", () => {
  it("retains sparse slot identity, optionality and scalar validation", async () => {
    const { schema } = await loadFormSpec("attachments");
    const validate = createAjv().compile(schema);
    expect(Object.keys(schema.properties ?? {})).toEqual(
      Array.from({ length: 15 }, (_, i) => `att${i + 1}`),
    );
    expect(validate({})).toBe(true);
    expect(validate({ att1: first, att15: second })).toBe(true);
    expect(validate({ att15: "not-an-id" })).toBe(false);
    const values = new FormData();
    values.set("att1", first);
    values.set("att15", second);
    expect(shapeFormData(values, processFormSchema(schema).formSchema)).toEqual(
      { att1: first, att15: second },
    );
  });
});

describe("public text abstract is not an uploaded abstract", () => {
  it("requires the existing SGG answer paths and enforces exact text limits", async () => {
    const { schema, example } = await loadFormSpec("project-abstract-summary");
    const validate = createAjv().compile(schema);
    const valid = { ...example, project_abstract: "a".repeat(4000) };
    expect(validate(valid)).toBe(true);
    expect(validate({ ...valid, project_abstract: "a".repeat(4001) })).toBe(
      false,
    );
    expect(validate({ ...valid, applicant_name: "a".repeat(61) })).toBe(false);
    expect(validate({ ...valid, project_title: "a".repeat(251) })).toBe(false);
    expect(
      validate({ ...valid, funding_opportunity_number: "a".repeat(41) }),
    ).toBe(false);
    expect(validate({ attachment: first })).toBe(false);
    expect(Object.keys(schema.properties ?? {})).toEqual([
      "funding_opportunity_number",
      "assistance_listing_number",
      "applicant_name",
      "project_title",
      "project_abstract",
    ]);
  });
});
