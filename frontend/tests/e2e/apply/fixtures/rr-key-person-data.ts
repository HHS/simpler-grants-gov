import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

import { RR_KEY_PERSON_DOCUMENTS } from "./rr-key-person-field-definitions";
import { personAnswers } from "./senior-key-person-fields";

// The R&R Senior/Key Person Profile generated from forms/specs. It has no hand-written
// form, so it has an opportunity of its own (E2E-RRKPG).

/**
 * Happy-path test data for the PD/PI and one senior/key person, with their documents.
 */
export const buildRRKeyPersonHappyPathTestData = (): Record<
  string,
  string
> => ({
  ...personAnswers(
    "principal_investigator",
    "PI",
    "PD/PI",
    { organization_name: "PI ORGANIZATION", credential: "PI CREDENTIAL" },
    RR_KEY_PERSON_DOCUMENTS,
  ),
  ...personAnswers(
    "senior_key_persons[0]",
    "SK",
    "Co-PD/PI",
    { organization_name: "SK ORGANIZATION", credential: "SK CREDENTIAL" },
    RR_KEY_PERSON_DOCUMENTS,
  ),
});

export const RR_KEY_PERSON_GENERATED_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "17a8581a-779f-4199-a3f6-a2ffe7293dec",
  opportunityNumber: "E2E-RRKPG-ORG-IND-01",
  formKey: "rrKeyPersonGenerated",
  expectedPrepopulatedFields: {},
  buildTestData: buildRRKeyPersonHappyPathTestData,
};
