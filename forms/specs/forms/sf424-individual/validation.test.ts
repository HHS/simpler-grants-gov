import type { ValidateFunction } from "ajv";
import { beforeAll, describe, expect, it } from "vitest";

import { loadFormValidator } from "../../../parity/harness/validate.ts";

type Answers = {
  application: { date_received?: string };
  applicant: { person: { citizenship: Record<string, string | boolean> } };
  project: Record<string, string> & { timeline: Record<string, string> };
  contacts: { point_of_contact: { address: Record<string, string> } };
  certification: Record<string, string | boolean>;
  [key: string]: unknown;
};
let validate: ValidateFunction;
let samples: Answers[];
const draft = (sample = samples[0]) => {
  const value = structuredClone(sample);
  delete value.application.date_received;
  delete value.certification.signature;
  delete value.certification.date_signed;
  return value;
};
const address = (value: Answers) => value.contacts.point_of_contact.address;

beforeAll(async () => {
  const form = await loadFormValidator("sf424-individual");
  validate = form.validate;
  samples = (form.schema as { examples: Answers[] }).examples;
});

describe("SF-424 Individual", () => {
  it("accepts complete examples and their unsigned drafts", () => {
    expect(samples).toHaveLength(2);
    for (const sample of samples) {
      expect(validate(sample), JSON.stringify(validate.errors)).toBe(true);
      expect(validate(draft(sample)), JSON.stringify(validate.errors)).toBe(
        true,
      );
    }
  });

  it("requires certification to be checked", () => {
    const value = draft();
    value.certification.agree = false;
    expect(validate(value)).toBe(false);
    expect(validate.errors?.some((error) => error.keyword === "const")).toBe(
      true,
    );
  });

  it("requires country and residency date for non-citizens", () => {
    const value = draft();
    value.applicant.person.citizenship = { is_us_citizen: false };
    expect(validate(value)).toBe(false);
    expect(
      validate.errors
        ?.filter((error) => error.keyword === "required")
        .map((error) => error.params.missingProperty)
        .sort(),
    ).toEqual(["country", "residency_start_date"]);
    value.applicant.person.citizenship.country = "URY: URUGUAY";
    value.applicant.person.citizenship.residency_start_date = "2025-01-15";
    expect(validate(value)).toBe(true);
  });

  it("requires citizenship answer", () => {
    const value = draft();
    value.applicant.person.citizenship = {};
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
        (data, text) => {
          data.project.title = text;
        },
      ],
      [
        "project description",
        1000,
        (data, text) => {
          data.project.description = text;
        },
      ],
      [
        "alien number",
        14,
        (data, text) => {
          data.applicant.person.citizenship.alien_registration_number = text;
        },
      ],
    ];
  it.each(boundaries)("limits %s to %i characters", (_name, maximum, set) => {
    const value = draft();
    set(value, "a".repeat(maximum));
    expect(validate(value)).toBe(true);
    set(value, "a".repeat(maximum + 1));
    expect(validate(value)).toBe(false);
  });

  it("requires state and ZIP only for US addresses", () => {
    const value = draft();
    delete address(value).state;
    delete address(value).zip_code;
    expect(validate(value)).toBe(false);
    address(value).country = "URY: URUGUAY";
    expect(validate(value)).toBe(true);
  });

  it("rejects five-digit US ZIP", () => {
    const value = draft();
    address(value).zip_code = "21218";
    expect(validate(value)).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instancePath: "/contacts/point_of_contact/address/zip_code",
          keyword: "minLength",
        }),
      ]),
    );
  });

  it.each(["21218-1234", "212181234"])(
    "accepts nine-digit US ZIP %s",
    (zip) => {
      const value = draft();
      address(value).zip_code = zip;
      expect(validate(value), JSON.stringify(validate.errors)).toBe(true);
    },
  );

  it("rejects invalid calendar dates", () => {
    const value = draft();
    value.project.timeline.end_date = "2027-02-30";
    expect(validate(value)).toBe(false);
    expect(validate.errors?.some((error) => error.keyword === "format")).toBe(
      true,
    );
  });
});
