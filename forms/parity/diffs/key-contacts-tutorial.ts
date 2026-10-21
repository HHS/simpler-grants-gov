import type { FormDiff, Pinned, Recorded } from "../harness/model.ts";

/** The DAT stars State and Zip / Postal Code, but its Required column and the XSD make them optional. */
const conditionalStar = (label: string): Pinned => ({
  plan: label,
  source: `* ${label}`,
  category: "upstream",
  reason:
    "The DAT stars State and Zip / Postal Code but marks them not required, and the XSD makes them optional. Its help text requires them only when Country is the United States, so the plan treats them as conditional.",
});

/** Tutorial step 4: the form renames First Name, which the plan still words as the DAT does. */
const GIVEN_NAME: Recorded = {
  category: "intentional",
  reason:
    "Tutorial step 4: the form asks for a given name, which reads more naturally to applicants whose family name comes first.",
};

export const DIFF: FormDiff = {
  slug: "key-contacts-tutorial",
  dat: {
    differingLabels: {
      "7-14": conditionalStar("State"),
      "7-17": conditionalStar("Zip / Postal Code"),
    },
  },
  uiSchema: {
    differingLabels: {
      "key_contacts[].name.first_name": { ...GIVEN_NAME, plan: "First Name", source: "Given Name" },
    },
    differingHelp: {
      "key_contacts[].name.first_name": {
        ...GIVEN_NAME,
        plan: "Enter the First Name. This field is required.",
        source: "Enter the contact's given name.",
      },
    },
  },
};
