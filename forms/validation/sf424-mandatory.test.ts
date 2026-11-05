import type { ValidateFunction } from "ajv";
import { beforeAll, describe, expect, it } from "vitest";

import { loadFormValidator } from "./harness.ts";

type Answers = {
  applicant: Record<string, unknown>;
  project: Record<string, unknown>;
  authorized_representative: Record<string, unknown>;
  funding: Record<string, unknown>;
  certification: Record<string, unknown>;
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

describe("Mandatory reuse boundaries", () => {
  it("admits the authored minimum and complete scenarios", () => {
    expect(samples).toHaveLength(2);
    for (const sample of samples)
      expect(validate(sample), JSON.stringify(validate.errors)).toBe(true);
  });

  it.each([
    ["project title", "project", "title", 250],
    ["department", "applicant", "department", 30],
    ["division", "applicant", "division", 30],
    ["signature", "authorized_representative", "signature", 144],
  ] as const)(
    "preserves the %s limit rather than substituting a different bank contract",
    (_name, group, field, maximum) => {
      const value = draft();
      value[group][field] = "a".repeat(maximum);
      expect(validate(value), JSON.stringify(validate.errors)).toBe(true);
      value[group][field] = "a".repeat(maximum + 1);
      expect(validate(value)).toBe(false);
      expect(
        validate.errors?.some((error) => error.keyword === "maxLength"),
      ).toBe(true);
    },
  );

  it("keeps date format validation after reusing DateSigned", () => {
    const value = draft();
    value.authorized_representative.date_signed = "2026-02-30";
    expect(validate(value)).toBe(false);
    expect(validate.errors?.some((error) => error.keyword === "format")).toBe(
      true,
    );
  });

  it("keeps zero funding valid and rejects a negative amount", () => {
    const value = draft();
    value.funding.estimated_federal = 0;
    expect(validate(value)).toBe(true);
    value.funding.estimated_federal = -0.01;
    expect(validate(value)).toBe(false);
    expect(validate.errors?.some((error) => error.keyword === "minimum")).toBe(
      true,
    );
  });

  it("does not widen affirmative certification to allow false", () => {
    const value = draft();
    value.certification.agree = false;
    expect(validate(value)).toBe(false);
    expect(validate.errors?.some((error) => error.keyword === "const")).toBe(
      true,
    );
  });
});
