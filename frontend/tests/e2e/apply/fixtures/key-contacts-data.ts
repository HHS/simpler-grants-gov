import type { fieldDefinitionsKeyContacts } from "tests/e2e/apply/fixtures/key-contacts-field-definitions";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";
import { toHappyPathSuffix } from "tests/e2e/utils/submission/print-view-utils";

/**
 * Happy-path test data builder for the Key Contacts form.
 * Fills only the first Key Contact entry (key_contacts[0]); minItems is 1,
 * so a single filled entry satisfies validation. Matches the PPSL precedent
 * of filling only the primary/first instance of a repeatable group.
 */
export const buildKeyContactsHappyPathTestData = (
  suffix: number,
): Record<string, string> => {
  const shortSuffix = toHappyPathSuffix(suffix);

  return {
    applicant_organization_name: `Org ${shortSuffix}`,
    "key_contacts[0]--project_role": `Role ${shortSuffix}`,
    "key_contacts[0]--name--prefix": `P${shortSuffix}`,
    "key_contacts[0]--name--first_name": `First${shortSuffix}`,
    "key_contacts[0]--name--middle_name": `Mid${shortSuffix}`,
    "key_contacts[0]--name--last_name": `Last${shortSuffix}`,
    "key_contacts[0]--name--suffix": `S${shortSuffix}`,
    "key_contacts[0]--title": `Title ${shortSuffix}`,
    "key_contacts[0]--organizational_affiliation": `Affiliation ${shortSuffix}`,
    "key_contacts[0]--address--street1": `${shortSuffix} Main St`,
    "key_contacts[0]--address--street2": `Suite ${shortSuffix}`,
    "key_contacts[0]--address--city": `City ${shortSuffix}`,
    "key_contacts[0]--address--county": `County ${shortSuffix}`,
    "key_contacts[0]--address--state": "AL: Alabama",
    "key_contacts[0]--address--country": "USA: UNITED STATES",
    "key_contacts[0]--address--zip_code": "12345",
    "key_contacts[0]--phone": "8888888888",
    "key_contacts[0]--fax": "8888888888",
    "key_contacts[0]--email": `contact${shortSuffix}@example.com`,
  } satisfies Partial<Record<keyof typeof fieldDefinitionsKeyContacts, string>>;
};

/**
 * Contains opportunity metadata and the form-specific test data builder.
 * Imported by load-opportunity-config.ts to build the opportunity registry.
 */
export const KEY_CONTACTS_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "3f6a8c2e-9d41-4b7a-8e15-6a2f9c4d7b31",
  opportunityNumber: "E2E-KC-ORG-IND-01",
  formKey: "keyContacts",
  expectedPrepopulatedFields: {},
  buildTestData: buildKeyContactsHappyPathTestData,
};
