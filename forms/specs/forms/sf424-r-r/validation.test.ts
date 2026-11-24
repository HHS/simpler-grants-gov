import type { ValidateFunction } from "ajv";
import { beforeAll, describe, expect, it } from "vitest";

import { loadFormValidator } from "../../../parity/harness/validate.ts";

type Section = Record<string, unknown>;
type Sample = {
  application: Section & { application_type: string; revision: Section };
  budget: { funding_sources: Section };
  certification: Section;
  [key: string]: unknown;
};

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

function at(data: Sample, path: string[]) {
  return path.reduce<Section>((section, key) => section[key] as Section, data);
}

describe("SF-424 (R&R)", () => {
  it("accepts new application draft and signed corrected revision", () => {
    expect(samples).toHaveLength(2);
    for (const data of samples) {
      expect(validate(data), JSON.stringify(validate.errors)).toBe(true);
    }
  });

  it("accepts an application without an assistance listing", () => {
    const data = sample("New");
    delete at(data, ["opportunity"]).assistance_listing;
    expect(validate(data), JSON.stringify(validate.errors)).toBe(true);
  });

  it.each(["A", "B", "C", "D", "AC", "AD", "BC", "BD"])(
    "accepts revision code %s",
    (code) => {
      const data = sample("Revision");
      data.application.revision.type = code;
      expect(validate(data), JSON.stringify(validate.errors)).toBe(true);
    },
  );

  it.each(["AB", "CD", "AE", "AA", "CA", "", ["A", "C"]])(
    "rejects revision code %j",
    (code) => {
      const data = sample("Revision");
      data.application.revision.type = code;
      expect(validate(data)).toBe(false);
    },
  );

  it.each([undefined, "", "a".repeat(46)])(
    "rejects Other revision explanation %j",
    (text) => {
      const data = sample("Revision");
      data.application.revision =
        text === undefined ? { type: "E" } : { type: "E", other_specify: text };
      expect(validate(data)).toBe(false);
    },
  );

  it("accepts Other revision explanation up to 45 characters", () => {
    const data = sample("Revision");
    data.application.revision = { type: "E", other_specify: "a".repeat(45) };
    expect(validate(data), JSON.stringify(validate.errors)).toBe(true);
  });

  it.each([
    ["application", "federal_identifier"],
    ["application", "previous_tracking_id"],
    ["application.other_agencies", "explanation"],
    ["application.state_review", "date"],
    ["contacts.project_director", "email"],
    ["contacts.authorized_representative", "title"],
    ["contacts.authorized_representative", "email"],
  ])("corrected revision requires %s.%s", (section, field) => {
    const data = sample("Revision");
    const path = section.split(".");
    delete at(data, path)[field];
    expect(validate(data)).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instancePath: `/${path.join("/")}`,
          keyword: "required",
          params: { missingProperty: field },
        }),
      ]),
    );
  });

  it.each(["0", "0.29", "1.15", "9999999999999.99"])(
    "accepts total funding %j",
    (amount) => {
      const data = sample("New");
      data.budget.funding_sources.total = amount;
      expect(validate(data), JSON.stringify(validate.errors)).toBe(true);
    },
  );

  it.each(["", "-1", "0.291", "10000000000000.00"])(
    "rejects total funding %j",
    (amount) => {
      const data = sample("New");
      data.budget.funding_sources.total = amount;
      expect(validate(data)).toBe(false);
    },
  );

  it("requires certification to be checked", () => {
    const data = sample("New");
    data.certification.agree = false;
    expect(validate(data)).toBe(false);
  });
});
