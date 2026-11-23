import { epaKeyContactsHappyPathTestData } from "tests/e2e/apply/fixtures/epa-key-contacts-fill-data";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";
import type { FormUnderTest } from "tests/e2e/utils/submission/scenarios-for-each-form";

/**
 * Happy-path test data for the EPA Key Contacts form, covering all four contacts.
 */
export const buildEpaKeyContactsHappyPathTestData = (): Record<
  string,
  string
> => ({
  ...epaKeyContactsHappyPathTestData,
});

export const EPA_KEY_CONTACTS_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "1cc0cbb3-cc2a-4c09-a001-ad1f2d9aa631",
  opportunityNumber: "E2E-EPAKC-ORG-IND-01",
  formKey: "epaKeyContacts",
  expectedPrepopulatedFields: {},
  buildTestData: buildEpaKeyContactsHappyPathTestData,
};

/**
 * Opportunity configuration for the EPA Key Contacts form generated from forms/specs.
 * It shares the hand-written form's field definitions and fill data.
 */
export const EPA_KEY_CONTACTS_GENERATED_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "b677779b-2081-4212-8f38-7781f43af676",
  opportunityNumber: "E2E-EPAKCG-ORG-IND-01",
  formKey: "epaKeyContactsGenerated",
  expectedPrepopulatedFields: {},
  buildTestData: buildEpaKeyContactsHappyPathTestData,
};

/**
 * Each EPA Key Contacts form the EPA Key Contacts specs run against.
 */
export const EPA_KEY_CONTACTS_OPPORTUNITIES: FormUnderTest[] = [
  {
    formLabel: "EPA Key Contacts",
    opportunityNumber: EPA_KEY_CONTACTS_OPPORTUNITY_DATA.opportunityNumber,
    formKey: EPA_KEY_CONTACTS_OPPORTUNITY_DATA.formKey,
  },
  {
    formLabel: "EPA Key Contacts (Generated)",
    opportunityNumber:
      EPA_KEY_CONTACTS_GENERATED_OPPORTUNITY_DATA.opportunityNumber,
    formKey: EPA_KEY_CONTACTS_GENERATED_OPPORTUNITY_DATA.formKey,
  },
];
