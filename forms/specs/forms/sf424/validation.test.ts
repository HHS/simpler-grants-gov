import { describe, expect, it } from "vitest";

import { loadFormValidator } from "../../../parity/harness/validate.ts";

const government = "A: State Government";
const nonprofit =
  "M: Nonprofit with 501C3 IRS Status (Other than Institution of Higher Education)";
const other = "X: Other (specify)";

describe("SF-424", () => {
  it("requires an explanation for Other applicant type", async () => {
    const { schema, validate } = await loadFormValidator("sf424");
    const sample = structuredClone(schema.examples.at(-1));
    expect(validate(sample), JSON.stringify(validate.errors)).toBe(true);

    const type = sample.applicant.type;
    type.codes = [government, nonprofit, other];
    expect(validate(sample)).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instancePath: "/applicant/type",
          keyword: "required",
          params: { missingProperty: "other_specify" },
        }),
      ]),
    );

    type.other_specify = "Community partnership";
    expect(validate(sample)).toBe(true);
  });

  it("allows at most three applicant types", async () => {
    const { schema, validate } = await loadFormValidator("sf424");
    const sample = structuredClone(schema.examples.at(-1));
    sample.applicant.type = {
      codes: [government, nonprofit, other, government],
      other_specify: "Community partnership",
    };
    expect(validate(sample)).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ keyword: "maxItems" }),
      ]),
    );
  });

  it("rejects a repeated applicant type", async () => {
    const { schema, validate } = await loadFormValidator("sf424");
    const sample = structuredClone(schema.examples.at(-1));
    sample.applicant.type = { codes: [government, government] };
    expect(validate(sample)).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ keyword: "uniqueItems" }),
      ]),
    );
  });

  it("requires federal award for continuation and revision", async () => {
    const { schema, validate } = await loadFormValidator("sf424");
    const sample = structuredClone(schema.examples[0]);
    expect(validate(sample)).toBe(true);

    sample.application.application_type = "Continuation";
    expect(validate(sample)).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          params: { missingProperty: "federal_award_identifier" },
        }),
      ]),
    );
    sample.application.federal_award_identifier = "FAKE-AWARD-001";
    expect(validate(sample)).toBe(true);

    sample.application.application_type = "Revision";
    expect(validate(sample)).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          params: { missingProperty: "revision" },
        }),
      ]),
    );
    sample.application.revision = { type: "A: Increase Award" };
    expect(validate(sample)).toBe(true);
  });
});
