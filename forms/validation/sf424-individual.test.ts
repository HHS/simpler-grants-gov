import type { ValidateFunction } from "ajv";
import { beforeAll, describe, expect, it } from "vitest";

import { loadFormValidator } from "./harness.ts";

type Answers = {
  applicant: {
    address: Record<string, string>;
    citizenship: Record<string, string | boolean>;
  };
  project: Record<string, string>;
  certification: Record<string, string | boolean>;
  date_received?: string;
  [key: string]: unknown;
};
let validate: ValidateFunction;
let samples: Answers[];
const draft = (sample = samples[0]) => {
  const value = structuredClone(sample);
  delete value.date_received;
  delete value.certification.signature;
  delete value.certification.date_signed;
  return value;
};

beforeAll(async () => {
  const form = await loadFormValidator("sf424-individual");
  validate = form.validate;
  samples = (form.schema as { examples: Answers[] }).examples;
});

describe("Individual source boundaries", () => {
  it("admits both complete source scenarios and their unsigned drafts", () => {
    expect(samples).toHaveLength(2);
    for (const sample of samples) {
      expect(validate(sample), JSON.stringify(validate.errors)).toBe(true);
      expect(validate(draft(sample)), JSON.stringify(validate.errors)).toBe(
        true,
      );
    }
  });

  it("requires affirmative certification, not only a present Boolean", () => {
    const value = draft();
    value.certification.agree = false;
    expect(validate(value)).toBe(false);
    expect(validate.errors?.some((error) => error.keyword === "const")).toBe(
      true,
    );
  });

  it("requires country and residency date for No, with alien number optional", () => {
    const value = draft();
    value.applicant.citizenship = { is_us_citizen: false };
    expect(validate(value)).toBe(false);
    expect(
      validate.errors
        ?.filter((error) => error.keyword === "required")
        .map((error) => error.params.missingProperty)
        .sort(),
    ).toEqual(["country_of_citizenship", "residency_start_date"]);
    value.applicant.citizenship.country_of_citizenship = "URY: URUGUAY";
    value.applicant.citizenship.residency_start_date = "2025-01-15";
    expect(validate(value)).toBe(true);
  });

  it("does not treat an unanswered citizenship question as No", () => {
    const value = draft();
    value.applicant.citizenship = {};
    expect(validate(value)).toBe(false);
    expect(
      validate.errors
        ?.filter((error) => error.keyword === "required")
        .map((error) => error.params.missingProperty),
    ).toEqual(["is_us_citizen"]);
  });

  const boundaries: [string, number, (data: Answers, text: string) => void][] =
    [
      [
        "project title",
        200,
        (data: Answers, text: string) => {
          data.project.title = text;
        },
      ],
      [
        "project description",
        1000,
        (data: Answers, text: string) => {
          data.project.description = text;
        },
      ],
      [
        "alien number",
        14,
        (data: Answers, text: string) => {
          data.applicant.citizenship.alien_registration_number = text;
        },
      ],
    ];
  it.each(boundaries)(
    "preserves the exact %s boundary",
    (_name, maximum, set) => {
      const value = draft();
      set(value, "a".repeat(maximum));
      expect(validate(value)).toBe(true);
      set(value, "a".repeat(maximum + 1));
      expect(validate(value)).toBe(false);
    },
  );

  it("requires US state/postal code but does not require foreign province/postal code", () => {
    const value = draft();
    delete value.applicant.address.state;
    delete value.applicant.address.zip_code;
    expect(validate(value)).toBe(false);
    value.applicant.address.country = "URY: URUGUAY";
    expect(validate(value)).toBe(true);
  });

  it("retains the explicitly recorded shared-bank five-digit ZIP gap", () => {
    const value = draft();
    value.applicant.address.zip_code = "21218";
    expect(validate(value)).toBe(true);
  });

  it("rejects invalid calendar dates; API tests separately enforce date ordering", () => {
    const value = draft();
    value.project.end_date = "2027-02-30";
    expect(validate(value)).toBe(false);
    expect(validate.errors?.some((error) => error.keyword === "format")).toBe(
      true,
    );
  });
});
