import { describe, expect, it } from "vitest";

import { loadFormValidator } from "../../../parity/harness/validate.ts";

const government = "A: State Government";
const nonprofit =
  "M: Nonprofit with 501C3 IRS Status (Other than Institution of Higher Education)";
const other = "X: Other (specify)";

describe("SF-424 Short", () => {
  it("requires an explanation for Other applicant type", async () => {
    const { schema, validate } = await loadFormValidator("sf424-short");
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
    const { schema, validate } = await loadFormValidator("sf424-short");
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
    const { schema, validate } = await loadFormValidator("sf424-short");
    const sample = structuredClone(schema.examples.at(-1));
    sample.applicant.type = { codes: [government, government] };
    expect(validate(sample)).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ keyword: "uniqueItems" }),
      ]),
    );
  });

  it("requires point of contact details when same as project director", async () => {
    const { schema, validate } = await loadFormValidator("sf424-short");
    for (const example of schema.examples) {
      const sample = structuredClone(example);
      const contacts = sample.contacts;
      expect(validate(sample), JSON.stringify(validate.errors)).toBe(true);
      expect(contacts.project_director.phone).not.toEqual(
        contacts.point_of_contact.phone,
      );

      contacts.point_of_contact.same_as_project_director = true;
      delete contacts.point_of_contact.title;
      expect(validate(sample)).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: "/contacts/point_of_contact",
            params: { missingProperty: "title" },
          }),
        ]),
      );
    }
  });
});
