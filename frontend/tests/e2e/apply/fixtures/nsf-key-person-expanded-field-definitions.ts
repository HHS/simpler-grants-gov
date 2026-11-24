import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import type { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

import {
  personFields,
  principalInvestigatorRequiredErrors,
} from "./senior-key-person-fields";

// The NSF Senior/Key Person Profile (Expanded) generated from forms/specs. Each person
// attaches four documents, and a senior/key person names their organization by UEI.

export const NSF_KEY_PERSON_EXPANDED_FORM_MATCHER =
  /NSF Senior\/Key Person Profile \(Expanded\)/i;

export const NSF_KEY_PERSON_EXPANDED_DOCUMENTS = {
  biographical_sketch: "Biographical Sketch",
  current_pending_support: "Current and Pending (Other) Support",
  collaborators: "Collaborators and Other Affiliations",
  synergistic_activities: "Synergistic Activities",
};

export const fieldDefinitionsNSFKeyPersonExpanded = {
  ...personFields(
    "principal_investigator",
    "PD/PI",
    {
      organization_name: ["text", "Organization Name"],
      nsf_id: ["text", "NSF ID"],
    },
    NSF_KEY_PERSON_EXPANDED_DOCUMENTS,
  ),
  ...personFields(
    "senior_key_persons[0]",
    "Senior/Key Person",
    {
      organization_uei: ["text", "Organization UEI"],
      nsf_id: ["text", "NSF ID"],
    },
    NSF_KEY_PERSON_EXPANDED_DOCUMENTS,
  ),
};

export const NSF_KEY_PERSON_EXPANDED_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "NSF Senior/Key Person Profile (Expanded)",
  fields: fieldDefinitionsNSFKeyPersonExpanded,
} as const;

// The errors use the schema titles, which differ from the labels above.
export const NSF_KEY_PERSON_EXPANDED_REQUIRED_FIELD_ERRORS: FieldError[] =
  principalInvestigatorRequiredErrors({
    biographical_sketch: "Biographical Sketch",
    current_pending_support: "Current & Pending Support",
    collaborators: "Collaborators & Other Affiliations",
    synergistic_activities: "Synergistic Activities",
  });
