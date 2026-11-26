import type { ValidateFunction } from "ajv";
import { beforeAll, describe, expect, it } from "vitest";

import { loadFormValidator } from "../../../parity/harness/validate.ts";

type Section = Record<string, unknown>;
type Answers = {
  applicant: { organization: Section };
  project: Section;
  budget: { funding_sources: Section };
  certification: Section;
  [key: string]: unknown;
};
let validate: ValidateFunction;
let samples: Answers[];
const draft = () => structuredClone(samples[0]);

beforeAll(async () => {
  const form = await loadFormValidator("sf424-mandatory");
  validate = form.validate;
  samples = form.schema.examples as Answers[];
});

describe("SF-424 Mandatory", () => {
  it("accepts minimum and complete examples", () => {
    expect(samples).toHaveLength(2);
    for (const sample of samples)
      expect(validate(sample), JSON.stringify(validate.errors)).toBe(true);
  });

  it.each([
    ["project title", (data: Answers) => data.project, "title", 250],
    [
      "department",
      (data: Answers) => data.applicant.organization,
      "department",
      30,
    ],
    [
      "division",
      (data: Answers) => data.applicant.organization,
      "division",
      30,
    ],
    ["signature", (data: Answers) => data.certification, "signature", 144],
  ] as const)("limits %s to its XSD length", (_name, group, field, maximum) => {
    const value = draft();
    group(value)[field] = "a".repeat(maximum);
    expect(validate(value), JSON.stringify(validate.errors)).toBe(true);
    group(value)[field] = "a".repeat(maximum + 1);
    expect(validate(value)).toBe(false);
    expect(
      validate.errors?.some((error) => error.keyword === "maxLength"),
    ).toBe(true);
  });

  it("rejects invalid signing date", () => {
    const value = draft();
    value.certification.date_signed = "2026-02-30";
    expect(validate(value)).toBe(false);
    expect(validate.errors?.some((error) => error.keyword === "format")).toBe(
      true,
    );
  });

  it("accepts zero federal funding", () => {
    const value = draft();
    value.budget.funding_sources.federal = "0";
    expect(validate(value), JSON.stringify(validate.errors)).toBe(true);
  });

  it("rejects negative federal funding", () => {
    const value = draft();
    value.budget.funding_sources.federal = "-0.01";
    expect(validate(value)).toBe(false);
    expect(validate.errors?.some((error) => error.keyword === "pattern")).toBe(
      true,
    );
  });

  it("requires certification to be checked", () => {
    const value = draft();
    value.certification.agree = false;
    expect(validate(value)).toBe(false);
    expect(validate.errors?.some((error) => error.keyword === "const")).toBe(
      true,
    );
  });
});
