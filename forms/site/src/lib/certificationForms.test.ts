import { describe, expect, it } from "vitest";

import { loadFormSpec, type FormSpec } from "./formSpec";
import { createAjv } from "./validation";

const compiledExamples = (schema: FormSpec["schema"]) =>
  (schema as FormSpec["schema"] & { examples: Record<string, unknown>[] })
    .examples;

/** Completion fixtures include external lifecycle context; no signing or ownership enforcement is claimed. */
describe("AD1047 source contract", () => {
  it("checks declared root fields, two completion fixtures and shared structured-name bindings", async () => {
    const spec = await loadFormSpec("usda-ad-1047");
    const validate = createAjv().compile(spec.schema);
    expect(Object.keys(spec.schema.properties ?? {}).sort()).toEqual(
      [
        "organization_name",
        "project_name",
        "authorized_representative",
        "title",
        "aor_signature",
        "date_signed",
      ].sort(),
    );
    const examples = compiledExamples(spec.schema);
    expect(examples).toHaveLength(2);
    for (const example of examples) expect(validate(example)).toBe(true);
    expect(
      Object.keys(examples[0].authorized_representative as object),
    ).toHaveLength(5);
    expect(
      Object.keys(examples[1].authorized_representative as object),
    ).toHaveLength(2);
  });

  it.each([
    "organization_name",
    "project_name",
    "authorized_representative",
    "title",
    "aor_signature",
    "date_signed",
  ])("rejects missing completion field %s", async (key) => {
    const spec = await loadFormSpec("usda-ad-1047");
    const validate = createAjv().compile(spec.schema);
    const data = structuredClone(spec.example!) as Record<string, unknown>;
    delete data[key];
    expect(validate(data)).toBe(false);
  });

  it.each([
    ["organization_name", 60],
    ["project_name", 60],
    ["title", 45],
    ["aor_signature", 144],
  ] as const)("preserves %s source bounds", async (key, max) => {
    const spec = await loadFormSpec("usda-ad-1047");
    const validate = createAjv().compile(spec.schema);
    const data = structuredClone(spec.example!) as Record<string, unknown>;
    data[key] = "A".repeat(max);
    expect(validate(data)).toBe(true);
    data[key] = "A".repeat(max + 1);
    expect(validate(data)).toBe(false);
    data[key] = "";
    expect(validate(data)).toBe(false);
    data[key] = null;
    expect(validate(data)).toBe(false);
  });

  it("rejects incomplete name and invalid dates without inventing a signature service", async () => {
    const spec = await loadFormSpec("usda-ad-1047");
    const validate = createAjv().compile(spec.schema);
    const data = structuredClone(spec.example!) as Record<string, unknown>;
    data.authorized_representative = { first_name: "Jordan" };
    expect(validate(data)).toBe(false);
    data.authorized_representative = { first_name: "Jordan", last_name: "Lee" };
    data.date_signed = "2026-02-30";
    expect(validate(data)).toBe(false);
    expect(
      (
        spec.schema.properties?.authorized_representative as {
          readOnly?: boolean;
        }
      ).readOnly,
    ).toBe(true);
  });
});

describe("AD3030 source contract", () => {
  it("retains eight declared answers and both source Yes/No outcomes", async () => {
    const spec = await loadFormSpec("usda-ad-3030");
    const validate = createAjv().compile(spec.schema);
    expect(Object.keys(spec.schema.properties ?? {}).sort()).toEqual(
      [
        "applicant_name",
        "applicant_address",
        "tax_id_number",
        "applicant_felony",
        "unpaid_federal_tax",
        "aor_signature",
        "title",
        "date_signed",
      ].sort(),
    );
    const examples = compiledExamples(spec.schema);
    expect(examples).toHaveLength(2);
    for (const example of examples) expect(validate(example)).toBe(true);
  });
  it.each([
    "applicant_name",
    "applicant_address",
    "tax_id_number",
    "applicant_felony",
    "unpaid_federal_tax",
    "aor_signature",
    "title",
    "date_signed",
  ])("requires completed %s", async (key) => {
    const spec = await loadFormSpec("usda-ad-3030");
    const validate = createAjv().compile(spec.schema);
    const data = structuredClone(spec.example!) as Record<string, unknown>;
    delete data[key];
    expect(validate(data)).toBe(false);
  });
  it.each([
    ["applicant_name", 140],
    ["applicant_address", 300],
    ["aor_signature", 144],
    ["title", 45],
  ] as const)("preserves %s source bound", async (key, max) => {
    const spec = await loadFormSpec("usda-ad-3030");
    const validate = createAjv().compile(spec.schema);
    const data = structuredClone(spec.example!) as Record<string, unknown>;
    data[key] = "A".repeat(max);
    expect(validate(data)).toBe(true);
    data[key] = "A".repeat(max + 1);
    expect(validate(data)).toBe(false);
    data[key] = "";
    expect(validate(data)).toBe(false);
  });
  it("requires exactly four digits, preserves leading zeroes and never substitutes a full tax ID", async () => {
    const spec = await loadFormSpec("usda-ad-3030");
    const validate = createAjv().compile(spec.schema);
    const data = structuredClone(spec.example!) as Record<string, unknown>;
    for (const value of ["0012", "9876"]) {
      data.tax_id_number = value;
      expect(validate(data)).toBe(true);
      expect(data.tax_id_number).toBe(value);
    }
    for (const value of ["ABC4", "123", "12345", "12-34", 1234, null]) {
      data.tax_id_number = value;
      expect(validate(data)).toBe(false);
    }
  });
  it.each(["applicant_felony", "unpaid_federal_tax"])(
    "uses the exact independent Yes/No wire answer for %s",
    async (key) => {
      const spec = await loadFormSpec("usda-ad-3030");
      const validate = createAjv().compile(spec.schema);
      const data = structuredClone(spec.example!) as Record<string, unknown>;
      for (const value of ["Y: Yes", "N: No"]) {
        data[key] = value;
        expect(validate(data)).toBe(true);
      }
      for (const value of [true, false, "Yes", "No", null]) {
        data[key] = value;
        expect(validate(data)).toBe(false);
      }
    },
  );
  it("keeps a whole-text address and rejects invalid date values", async () => {
    const spec = await loadFormSpec("usda-ad-3030");
    const validate = createAjv().compile(spec.schema);
    const data = structuredClone(spec.example!) as Record<string, unknown>;
    data.applicant_address = { street1: "123 Example Street" };
    expect(validate(data)).toBe(false);
    data.applicant_address = "123 Example Street, Washington DC 20001";
    data.date_signed = "2026-02-30";
    expect(validate(data)).toBe(false);
  });
});

describe("Labor Standards source contract", () => {
  it("uses three declared completion values and two valid context examples", async () => {
    const spec = await loadFormSpec("assurances-as-to-labor-standards");
    const validate = createAjv().compile(spec.schema);
    expect(Object.keys(spec.schema.properties ?? {}).sort()).toEqual(
      [
        "applicant_organization_name",
        "representative_name",
        "submitted_date",
      ].sort(),
    );
    const examples = compiledExamples(spec.schema);
    expect(examples).toHaveLength(2);
    for (const example of examples) expect(validate(example)).toBe(true);
  });
  it.each([
    "applicant_organization_name",
    "representative_name",
    "submitted_date",
  ])("requires external completion field %s", async (key) => {
    const spec = await loadFormSpec("assurances-as-to-labor-standards");
    const validate = createAjv().compile(spec.schema);
    const data = structuredClone(spec.example!) as Record<string, unknown>;
    delete data[key];
    expect(validate(data)).toBe(false);
  });
  it.each([
    ["applicant_organization_name", 60],
    ["representative_name", 144],
  ] as const)("preserves %s source bound", async (key, max) => {
    const spec = await loadFormSpec("assurances-as-to-labor-standards");
    const validate = createAjv().compile(spec.schema);
    const data = structuredClone(spec.example!) as Record<string, unknown>;
    data[key] = "A".repeat(max);
    expect(validate(data)).toBe(true);
    data[key] = "A".repeat(max + 1);
    expect(validate(data)).toBe(false);
    data[key] = "";
    expect(validate(data)).toBe(false);
  });
  it("rejects an invalid source date", async () => {
    const spec = await loadFormSpec("assurances-as-to-labor-standards");
    const validate = createAjv().compile(spec.schema);
    const data = structuredClone(spec.example!) as Record<string, unknown>;
    data.submitted_date = "2026-02-30";
    expect(validate(data)).toBe(false);
  });
});
