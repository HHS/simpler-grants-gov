import { describe, expect, it } from "vitest";

import { loadFormValidator } from "./harness.ts";

const government = "A: State Government";
const nonprofit =
  "M: Nonprofit with 501C3 IRS Status (Other than Institution of Higher Education)";
const other = "X: Other (specify)";

describe("Existing SF-424 form definitions", () => {
  it("requires an explanation for Other in either applicant type list", async () => {
    for (const [spec, typeGroup, codes, detail] of [
      ["sf424", "applicant_type", "codes", "other_explanation"],
      [
        "sf424-short",
        "applicant",
        "applicant_type_code",
        "applicant_type_other_specify",
      ],
    ]) {
      const { schema, validate } = await loadFormValidator(spec);
      const sample = structuredClone(schema.examples.at(-1));
      expect(validate(sample), JSON.stringify(validate.errors)).toBe(true);

      const group = sample[typeGroup];
      group[codes] = [government, nonprofit, other];
      expect(validate(sample)).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: `/${typeGroup}`,
            keyword: "required",
            params: { missingProperty: detail },
          }),
        ]),
      );

      group[detail] = "Community partnership";
      expect(validate(sample)).toBe(true);
      group[codes].push(government);
      expect(validate(sample)).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ keyword: "maxItems" }),
        ]),
      );
    }
  });

  it("requires a federal award for Regular continuation and revision", async () => {
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
          params: { missingProperty: "revision_type" },
        }),
      ]),
    );
    sample.application.revision_type = "A: Increase Award";
    expect(validate(sample)).toBe(true);
  });

  it("keeps Short's director and contact distinct even when the existing checkbox is selected", async () => {
    const { schema, validate } = await loadFormValidator("sf424-short");
    for (const example of schema.examples) {
      const sample = structuredClone(example);
      expect(validate(sample), JSON.stringify(validate.errors)).toBe(true);
      expect(sample.project_director.phone).not.toEqual(
        sample.contact_person.phone,
      );

      sample.same_as_project_director = true;
      delete sample.contact_person.title;
      expect(validate(sample)).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: "/contact_person",
            params: { missingProperty: "title" },
          }),
        ]),
      );
    }
  });
});
