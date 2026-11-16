import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";

import { personAnswers, personFields } from "./senior-key-person-fields";

// The R&R Senior/Key Person Profile generated from forms/specs. It has no hand-written
// form, so it has an opportunity of its own (E2E-RRKPG).

const EXTRA_FIELDS = {
  organization_name: ["text", "Organization Name"],
  credential: ["text", "Credential, e.g., agency login"],
} as const;

const DOCUMENTS = {
  biographical_sketch: "Biographical Sketch",
  current_pending_support: "Current & Pending Support",
};

export const RR_KEY_PERSON_FORM = {
  formLabel: "RESEARCH & RELATED Senior/Key Person Profile",
  opportunityId: "17a8581a-779f-4199-a3f6-a2ffe7293dec",
  formConfig: {
    ...FORM_DEFAULTS,
    formName: "RESEARCH & RELATED Senior/Key Person Profile",
    fields: {
      ...personFields(
        "principal_investigator",
        "PD/PI",
        EXTRA_FIELDS,
        DOCUMENTS,
      ),
      ...personFields(
        "senior_key_persons[0]",
        "Senior/Key Person",
        EXTRA_FIELDS,
        DOCUMENTS,
      ),
    },
  },
  happyPathData: {
    ...personAnswers(
      "principal_investigator",
      "PI",
      "PD/PI",
      { organization_name: "PI ORGANIZATION", credential: "PI CREDENTIAL" },
      DOCUMENTS,
    ),
    ...personAnswers(
      "senior_key_persons[0]",
      "SK",
      "Co-PD/PI",
      { organization_name: "SK ORGANIZATION", credential: "SK CREDENTIAL" },
      DOCUMENTS,
    ),
  },
} as const;
