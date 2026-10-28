import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";

import { personAnswers, personFields } from "./senior-key-person-fields";

// The R&R Senior/Key Person Profile (Expanded) generated from forms/specs. It has no
// hand-written form, so it has an opportunity of its own (E2E-RRKPEG).

const EXTRA_FIELDS = {
  organization_name: ["text", "Organization Name"],
  credential: ["text", "Credential, e.g., agency login"],
  degree_type: ["text", "Degree Type"],
  degree_year: ["text", "Degree Year"],
} as const;

const DOCUMENTS = {
  biographical_sketch: "Biographical Sketch",
  current_pending_support: "Current & Pending Support",
};

const extraAnswers = (initials: string) => ({
  organization_name: `${initials} ORGANIZATION`,
  credential: `${initials} CREDENTIAL`,
  degree_type: "PhD",
  degree_year: "2004",
});

export const RR_KEY_PERSON_EXPANDED_FORM = {
  formLabel: "RESEARCH & RELATED Senior/Key Person Profile (Expanded)",
  opportunityId: "60993a94-d03a-4fcd-a97d-59608282c1c4",
  formConfig: {
    ...FORM_DEFAULTS,
    formName: "RESEARCH & RELATED Senior/Key Person Profile (Expanded)",
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
      extraAnswers("PI"),
      DOCUMENTS,
    ),
    ...personAnswers(
      "senior_key_persons[0]",
      "SK",
      "Co-Investigator",
      extraAnswers("SK"),
      DOCUMENTS,
    ),
  },
} as const;
