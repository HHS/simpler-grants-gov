import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import type { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

import {
  personFields,
  principalInvestigatorRequiredErrors,
} from "./senior-key-person-fields";

// The R&R Senior/Key Person Profile generated from forms/specs.

// Skip the Expanded form, whose name starts the same way.
export const RR_KEY_PERSON_FORM_MATCHER =
  /RESEARCH & RELATED Senior\/Key Person Profile(?! \(Expanded\))/i;

const EXTRA_FIELDS = {
  organization_name: ["text", "Organization Name"],
  credential: ["text", "Credential, e.g., agency login"],
} as const;

export const RR_KEY_PERSON_DOCUMENTS = {
  biographical_sketch: "Biographical Sketch",
  current_pending_support: "Current & Pending Support",
};

export const fieldDefinitionsRRKeyPerson = {
  ...personFields(
    "principal_investigator",
    "PD/PI",
    EXTRA_FIELDS,
    RR_KEY_PERSON_DOCUMENTS,
  ),
  ...personFields(
    "senior_key_persons[0]",
    "Senior/Key Person",
    EXTRA_FIELDS,
    RR_KEY_PERSON_DOCUMENTS,
  ),
};

export const RR_KEY_PERSON_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "RESEARCH & RELATED Senior/Key Person Profile",
  fields: fieldDefinitionsRRKeyPerson,
} as const;

export const RR_KEY_PERSON_REQUIRED_FIELD_ERRORS: FieldError[] =
  principalInvestigatorRequiredErrors({
    biographical_sketch: "Biographical Sketch",
  });
