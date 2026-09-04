import {
  fieldDefinitionsKeyContacts,
  type fieldDefinitionsKeyContacts,
} from "tests/e2e/apply/fixtures/key-contacts-field-definitions";
import type {
  PrintViewFormData,
  PrintViewFormData,
} from "tests/e2e/utils/submission/opportunity-print-view.types";
import {
  toHappyPathSuffix,
  toHappyPathSuffix,
} from "tests/e2e/utils/submission/print-view-utils";

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
  index = 0,
): Record<string, string> => {
  const shortSuffix = toHappyPathSuffix(suffix);

  return {
    applicant_organization_name: `Org ${shortSuffix}`,
    [`key_contacts[${index}]--project_role`]: `Role ${shortSuffix}`,
    [`key_contacts[${index}]--name--first_name`]: `First${shortSuffix}`,
    [`key_contacts[${index}]--name--last_name`]: `Last${shortSuffix}`,
    [`key_contacts[${index}]--address--street1`]: `${shortSuffix} Main St`,
    [`key_contacts[${index}]--address--city`]: `City ${shortSuffix}`,
    [`key_contacts[${index}]--address--state`]: "AL: Alabama",
    [`key_contacts[${index}]--address--country`]: "USA: UNITED STATES",
    [`key_contacts[${index}]--address--zip_code`]: "123456789",
    [`key_contacts[${index}]--phone`]: "8888888888",
    [`key_contacts[${index}]--email`]: `contact${shortSuffix}@example.com`,
  } satisfies Partial<Record<keyof typeof fieldDefinitionsKeyContacts, string>>;
};

/**
 * Required-fields-only happy-path test data for the Key Contacts form.
 *
 * By default this populates the first FieldList entry:
 * key_contacts[0]
 *
 * The index can be provided when the test needs to populate another
 * FieldList entry.
 */
export const buildKeyContactsRequiredFieldsHappyPathTestData = (
  suffix: number,
  index = 0,
): Record<string, string> => {
  const shortSuffix = toHappyPathSuffix(suffix);
  return {
    applicant_organization_name: `Org ${shortSuffix}`,
    [`key_contacts[${index}]--project_role`]: `Role ${shortSuffix}`,
    [`key_contacts[${index}]--name--first_name`]: `First${shortSuffix}`,
    [`key_contacts[${index}]--name--last_name`]: `Last${shortSuffix}`,
    [`key_contacts[${index}]--address--street1`]: `${shortSuffix} Main St`,
    [`key_contacts[${index}]--address--city`]: `City ${shortSuffix}`,
    [`key_contacts[${index}]--address--state`]: "AL: Alabama",
    [`key_contacts[${index}]--address--country`]: "USA: UNITED STATES",
    [`key_contacts[${index}]--address--zip_code`]: "123456789",
    [`key_contacts[${index}]--phone`]: "8888888888",
    [`key_contacts[${index}]--email`]: `contact${shortSuffix}@example.com`,
  } satisfies Partial<Record<keyof typeof fieldDefinitionsKeyContacts, string>>;
};
/**
 * Optional-field test data for the Key Contacts form.
 *
 * By default this populates the first FieldList entry:
 * key_contacts[0]
 *
 * The index can be provided when the test needs to populate another
 * FieldList entry.
 */
export const buildKeyContactsOptionalFieldsHappyPathTestData = (
  suffix: number,
  index = 0,
): Record<string, string> => {
  const shortSuffix = toHappyPathSuffix(suffix);
  return {
    [`key_contacts[${index}]--name--prefix`]: `P${shortSuffix}`,
    [`key_contacts[${index}]--name--middle_name`]: `Mid${shortSuffix}`,
    [`key_contacts[${index}]--name--suffix`]: `S${shortSuffix}`,
    [`key_contacts[${index}]--title`]: `Title ${shortSuffix}`,
    [`key_contacts[${index}]--organizational_affiliation`]: `Affiliation ${shortSuffix}`,
    [`key_contacts[${index}]--address--street2`]: `Suite ${shortSuffix}`,
    [`key_contacts[${index}]--address--county`]: `County ${shortSuffix}`,
    [`key_contacts[${index}]--fax`]: "8888888888",
  } satisfies Partial<Record<keyof typeof fieldDefinitionsKeyContacts, string>>;
};
/**
 * Complete happy-path test data for the Key Contacts form.
 *
 * Combines the required and optional fields for the first
 * FieldList entry (key_contacts[0]).
 */
export const buildKeyContactsHappyPathTestData = (
  suffix: number,
): Record<string, string> => {
  return {
    ...buildKeyContactsRequiredFieldsHappyPathTestData(suffix),
    ...buildKeyContactsOptionalFieldsHappyPathTestData(suffix),
  };
};
/**
 * Opportunity configuration used by the Key Contacts E2E tests.
 */
export const KEY_CONTACTS_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "3f6a8c2e-9d41-4b7a-8e15-6a2f9c4d7b31",
  opportunityNumber: "E2E-KC-ORG-IND-01",
  formKey: "keyContacts",
  expectedPrepopulatedFields: {},
  buildTestData: buildKeyContactsHappyPathTestData,
};
