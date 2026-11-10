import type { ValidateFunction } from "ajv";
import { beforeAll, describe, expect, it } from "vitest";

import { loadFormValidator } from "./harness.ts";

type Section = Record<string, unknown>;
type Sample = Record<string, Section>;

let validate: ValidateFunction;
let samples: Sample[];

beforeAll(async () => {
  const form = await loadFormValidator("sf424-r-r");
  validate = form.validate;
  samples = form.schema.examples as Sample[];
});

function sample(type: "New" | "Revision") {
  return structuredClone(
    samples.find(({ application }) => application.application_type === type)!,
  );
}

describe("SF-424 R&R cover", () => {
  it("admits a new application draft and a corrected revision with signing values", () => {
    expect(samples).toHaveLength(2);
    for (const data of samples) {
      expect(validate(data), JSON.stringify(validate.errors)).toBe(true);
    }
  });

  it("admits exactly the source revision codes and requires a reason for Other", () => {
    const data = sample("Revision");
    for (const code of ["A", "B", "C", "D", "AC", "AD", "BC", "BD"]) {
      data.application.revision_code = code;
      expect(validate(data), code).toBe(true);
    }
    for (const code of ["AB", "CD", "AE", "AA", "CA", "", ["A", "C"]]) {
      data.application.revision_code = code;
      expect(validate(data), JSON.stringify(code)).toBe(false);
    }
    data.application.revision_code = "E";
    for (const text of [undefined, "", "a".repeat(46)]) {
      data.application.revision_explanation = text;
      expect(validate(data)).toBe(false);
    }
    data.application.revision_explanation = "a".repeat(45);
    expect(validate(data), JSON.stringify(validate.errors)).toBe(true);
  });

  it.each([
    ["application", "federal_id"],
    ["application", "tracking_id"],
    ["application", "other_agency_explanation"],
    ["state_review", "date"],
    ["principal_investigator", "email"],
    ["authorized_representative", "title"],
    ["authorized_representative", "email"],
  ])("requires %s.%s in the corrected revision", (section, field) => {
    const data = sample("Revision");
    delete data[section][field];
    expect(validate(data)).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instancePath: `/${section}`,
          keyword: "required",
          params: { missingProperty: field },
        }),
      ]),
    );
  });

  it("retains the R&R amount bound and requires the certification to be true", () => {
    const data = sample("New");
    for (const amount of ["0", "0.29", "1.15", "9999999999999.99"]) {
      data.funding.total = amount;
      expect(validate(data), amount).toBe(true);
    }
    for (const amount of ["", "-1", "0.291", "10000000000000.00"]) {
      data.funding.total = amount;
      expect(validate(data), amount).toBe(false);
    }
    data.funding.total = "0";
    data.certification.agree = false;
    expect(validate(data)).toBe(false);
  });
});
