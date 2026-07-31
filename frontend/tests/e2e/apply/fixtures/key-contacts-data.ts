import type { fieldDefinitionsKeyContacts } from "tests/e2e/apply/fixtures/key-contacts-field-definitions";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";
import { toHappyPathSuffix } from "tests/e2e/utils/submission/print-view-utils";

/**
 * Required-fields-only happy-path test data for the Key Contacts form.
 * Fills only the first Key Contact entry (key_contacts[0]); minItems is 1.
 *
 * Strictly-required fields per FORM_JSON_SCHEMA / field specifications:
 * applicant_organization_name, project_role, first_name, last_name,
 * street1, city, country, phone, email.
 *
 * state and zip_code are listed as optional in the schema, but are
 * conditionally required when country is US per business rules:
 * "Conditionally required if Country is US". Since this builder sets
 * country to USA, both are included as functionally required.
 * zip_code uses 9 digits per the business rule: "If Country is US,
 * min # of characters is 9."
 */
export const buildKeyContactsRequiredFieldsHappyPathTestData = (
  suffix: number,
): Record<string, string> => {
  const shortSuffix = toHappyPathSuffix(suffix);

  return {
    applicant_organization_name: `Org ${shortSuffix}`,
    "key_contacts[0]--project_role": `Role ${shortSuffix}`,
    "key_contacts[0]--name--first_name": `First${shortSuffix}`,
    "key_contacts[0]--name--last_name": `Last${shortSuffix}`,
    "key_contacts[0]--address--street1": `${shortSuffix} Main St`,
    "key_contacts[0]--address--city": `City ${shortSuffix}`,
    "key_contacts[0]--address--state": "AL: Alabama", // conditionally required: country is USA
    "key_contacts[0]--address--country": "USA: UNITED STATES",
    "key_contacts[0]--address--zip_code": "123456789", // 9 digits - required min when country is US
    "key_contacts[0]--phone": "8888888888",
    "key_contacts[0]--email": `contact${shortSuffix}@example.com`,
  } satisfies Partial<Record<keyof typeof fieldDefinitionsKeyContacts, string>>;
};

/**
 * Complete happy-path test data for the Key Contacts form: all required
 * AND optional fields for the first Key Contact entry (key_contacts[0]).
 * minItems is 1, so a single filled entry satisfies validation; additional
 * entries (up to 4) are skipped, matching the PPSL precedent of filling
 * only the primary/first instance of a repeatable group.
 */
export const buildKeyContactsHappyPathTestData = (
  suffix: number,
): Record<string, string> => {
  const shortSuffix = toHappyPathSuffix(suffix);
  const required = buildKeyContactsRequiredFieldsHappyPathTestData(suffix);

  return {
    ...required,
    "key_contacts[0]--name--prefix": `P${shortSuffix}`,
    "key_contacts[0]--name--middle_name": `Mid${shortSuffix}`,
    "key_contacts[0]--name--suffix": `S${shortSuffix}`,
    "key_contacts[0]--title": `Title ${shortSuffix}`,
    "key_contacts[0]--organizational_affiliation": `Affiliation ${shortSuffix}`,
    "key_contacts[0]--address--street2": `Suite ${shortSuffix}`,
    "key_contacts[0]--address--county": `County ${shortSuffix}`,
    "key_contacts[0]--fax": "8888888888",
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
