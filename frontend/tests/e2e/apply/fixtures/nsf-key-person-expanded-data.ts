import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

import { NSF_KEY_PERSON_EXPANDED_DOCUMENTS } from "./nsf-key-person-expanded-field-definitions";
import { personAnswers } from "./senior-key-person-fields";

// The NSF Senior/Key Person Profile (Expanded) generated from forms/specs. It has no
// hand-written form, so it has an opportunity of its own (E2E-NSFKPEG).

/**
 * Happy-path test data for the PD/PI and one senior/key person, with their documents.
 */
export const buildNSFKeyPersonExpandedHappyPathTestData = (): Record<
  string,
  string
> => ({
  ...personAnswers(
    "principal_investigator",
    "PI",
    "PD/PI",
    { organization_name: "PI ORGANIZATION", nsf_id: "000123456" },
    NSF_KEY_PERSON_EXPANDED_DOCUMENTS,
  ),
  ...personAnswers(
    "senior_key_persons[0]",
    "SK",
    "Other Senior Personnel",
    { organization_uei: "ABCDEFGHIJKL", nsf_id: "000654321" },
    NSF_KEY_PERSON_EXPANDED_DOCUMENTS,
  ),
});

export const NSF_KEY_PERSON_EXPANDED_GENERATED_OPPORTUNITY_DATA: PrintViewFormData =
  {
    opportunityId: "7b0b7e69-0943-429e-b380-ebaf69985400",
    opportunityNumber: "E2E-NSFKPEG-ORG-IND-01",
    formKey: "nsfKeyPersonExpandedGenerated",
    expectedPrepopulatedFields: {},
    buildTestData: buildNSFKeyPersonExpandedHappyPathTestData,
  };
