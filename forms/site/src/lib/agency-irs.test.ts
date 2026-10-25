import { beforeAll, expect, it } from "vitest";

import { loadFormSpec, type FormSpec } from "./formSpec";
import { createAjv } from "./validation";

// Edition-specific source decisions; deliberately independent of schema-derived bounds.
const forms = [
  "contact-information-for-vita-and-tce-grant-programs",
  "tax-counseling-for-the-elderly-tce-program-application-checklist-and-contact-sheet",
];
const specs = new Map<string, FormSpec>();
beforeAll(async () => {
  for (const form of forms) specs.set(form, await loadFormSpec(form));
});
it.each(forms)("%s: every authored example validates", (form) => {
  const schema = specs.get(form)!.schema;
  const examples = (schema as { examples: object[] }).examples;
  expect(examples).toHaveLength(2);
  const validate = createAjv().compile(schema);
  for (const data of examples)
    expect(validate(data), JSON.stringify(validate.errors)).toBe(true);
});
it.each<{
  form: string;
  source_case: string;
  changes: [string, unknown][];
  remove: string[];
  valid: boolean;
}>([
  {
    form: "contact-information-for-vita-and-tce-grant-programs",
    source_case: "empty optional object must not silently validate",
    changes: [["other_contact1", {}]],
    remove: [],
    valid: false,
  },
  {
    form: "contact-information-for-vita-and-tce-grant-programs",
    source_case: "partial optional phone requires full record",
    changes: [
      [
        "other_contact1",
        {
          cell_phone: "2025550100",
        },
      ],
    ],
    remove: [],
    valid: false,
  },
  {
    form: "contact-information-for-vita-and-tce-grant-programs",
    source_case: "third named slot can be used independently",
    changes: [
      [
        "other_contact3",
        {
          name: {
            first_name: "Jordan",
            last_name: "Lee",
          },
          title: "Illustrative Contact",
          phone: "2025550100",
          email: "other@example.org",
          share_contact: "N: No",
          role: "Illustrative support role",
        },
      ],
      ["other_contact1", null],
      ["other_contact2", null],
    ],
    remove: ["other_contact1", "other_contact2"],
    valid: true,
  },
  {
    form: "contact-information-for-vita-and-tce-grant-programs",
    source_case: "No permission remains distinct from no answer",
    changes: [
      [
        "other_contact1",
        {
          name: {
            first_name: "Jordan",
            last_name: "Lee",
          },
          title: "Illustrative Contact",
          phone: "2025550100",
          email: "other@example.org",
          role: "Illustrative support role",
        },
      ],
      ["other_contact1.share_contact", null],
    ],
    remove: ["other_contact1.share_contact"],
    valid: false,
  },
  {
    form: "contact-information-for-vita-and-tce-grant-programs",
    source_case: "days_operation length 66",
    changes: [
      [
        "days_operation",
        "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      ],
    ],
    remove: [],
    valid: false,
  },
  {
    form: "tax-counseling-for-the-elderly-tce-program-application-checklist-and-contact-sheet",
    source_case: "multiyear Yes accepts explicit No answer",
    changes: [
      ["administrative_information.multiyear_grant", "Y: Yes"],
      ["administrative_information.checked_eligible", "N: No"],
    ],
    remove: [],
    valid: true,
  },
  {
    form: "tax-counseling-for-the-elderly-tce-program-application-checklist-and-contact-sheet",
    source_case:
      "mandatory document cannot be explicitly unchecked background_narrative",
    changes: [["application_checklist.background_narrative", "N: No"]],
    remove: [],
    valid: false,
  },
  {
    form: "tax-counseling-for-the-elderly-tce-program-application-checklist-and-contact-sheet",
    source_case: "optional lobbying checklist may be No",
    changes: [["application_checklist.standard_form_lll", "N: No"]],
    remove: [],
    valid: true,
  },
  {
    form: "tax-counseling-for-the-elderly-tce-program-application-checklist-and-contact-sheet",
    source_case: "long original XSD country code retained",
    changes: [
      [
        "contact_information.address.country",
        "SHN: SAINT HELENA, ASCENSION, AND TRISTAN DA CUNHA",
      ],
      ["contact_information.address.province", "Saint Helena"],
      ["contact_information.address.state", null],
      ["contact_information.address.zip_code", null],
    ],
    remove: [
      "contact_information.address.state",
      "contact_information.address.zip_code",
    ],
    valid: true,
  },
])("$form: $source_case", ({ form, changes, remove, valid }) => {
  const spec = specs.get(form)!;
  const examples = (spec.schema as { examples: Record<string, unknown>[] })
    .examples;
  const data = structuredClone(
    examples.find((x) => form.includes("fns-906") && x.audited === "N: No") ??
      examples[0],
  );
  for (const [path, value] of changes) {
    const parts = (path as string).split(".");
    let target: Record<string, unknown> = data;
    for (const part of parts.slice(0, -1)) {
      const value = (target[part] ??= {});
      if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error(`Not an object: ${part}`);
      target = value as Record<string, unknown>;
    }
    if (remove.includes(path as string)) delete target[parts.at(-1)!];
    else target[parts.at(-1)!] = value;
  }
  const validate = createAjv().compile(spec.schema);
  expect(validate(data), JSON.stringify(validate.errors)).toBe(valid);
});
