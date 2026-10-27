import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";

import { personAnswers, personFields } from "./senior-key-person-fields";

// The NSF Senior/Key Person Profile (Expanded) generated from forms/specs. It has no
// hand-written form, so it has an opportunity of its own (E2E-NSFKPEG). Each person
// attaches four documents, and a senior/key person names their organization by UEI.

const DOCUMENTS = {
  biographical_sketch: "Biographical Sketch",
  current_pending_support: "Current and Pending (Other) Support",
  collaborators: "Collaborators and Other Affiliations",
  synergistic_activities: "Synergistic Activities",
};

export const NSF_KEY_PERSON_EXPANDED_FORM = {
  formLabel: "NSF Senior/Key Person Profile (Expanded)",
  opportunityId: "7b0b7e69-0943-429e-b380-ebaf69985400",
  formConfig: {
    ...FORM_DEFAULTS,
    formName: "NSF Senior/Key Person Profile (Expanded)",
    fields: {
      ...personFields(
        "principal_investigator",
        "PD/PI",
        {
          organization_name: ["text", "Organization Name"],
          nsf_id: ["text", "NSF ID"],
        },
        DOCUMENTS,
      ),
      ...personFields(
        "senior_key_persons[0]",
        "Senior/Key Person",
        {
          organization_uei: ["text", "Organization UEI"],
          nsf_id: ["text", "NSF ID"],
        },
        DOCUMENTS,
      ),
    },
  },
  happyPathData: {
    ...personAnswers(
      "principal_investigator",
      "PI",
      "PD/PI",
      { organization_name: "PI ORGANIZATION", nsf_id: "000123456" },
      DOCUMENTS,
    ),
    ...personAnswers(
      "senior_key_persons[0]",
      "SK",
      "Other Senior Personnel",
      { organization_uei: "ABCDEFGHIJKL", nsf_id: "000654321" },
      DOCUMENTS,
    ),
  },
} as const;
