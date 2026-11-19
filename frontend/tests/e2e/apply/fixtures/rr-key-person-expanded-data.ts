import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

import { RR_KEY_PERSON_EXPANDED_DOCUMENTS } from "./rr-key-person-expanded-field-definitions";
import { personAnswers } from "./senior-key-person-fields";

// The R&R Senior/Key Person Profile (Expanded) generated from forms/specs. It has no
// hand-written form, so it has an opportunity of its own (E2E-RRKPEG).

const extraAnswers = (initials: string) => ({
  organization_name: `${initials} ORGANIZATION`,
  credential: `${initials} CREDENTIAL`,
  degree_type: "PhD",
  degree_year: "2004",
});

/**
 * Happy-path test data for the PD/PI and one senior/key person, with their documents.
 */
export const buildRRKeyPersonExpandedHappyPathTestData = (): Record<
  string,
  string
> => ({
  ...personAnswers(
    "principal_investigator",
    "PI",
    "PD/PI",
    extraAnswers("PI"),
    RR_KEY_PERSON_EXPANDED_DOCUMENTS,
  ),
  ...personAnswers(
    "senior_key_persons[0]",
    "SK",
    "Co-Investigator",
    extraAnswers("SK"),
    RR_KEY_PERSON_EXPANDED_DOCUMENTS,
  ),
});

export const RR_KEY_PERSON_EXPANDED_GENERATED_OPPORTUNITY_DATA: PrintViewFormData =
  {
    opportunityId: "60993a94-d03a-4fcd-a97d-59608282c1c4",
    opportunityNumber: "E2E-RRKPEG-ORG-IND-01",
    formKey: "rrKeyPersonExpandedGenerated",
    expectedPrepopulatedFields: {},
    buildTestData: buildRRKeyPersonExpandedHappyPathTestData,
  };
