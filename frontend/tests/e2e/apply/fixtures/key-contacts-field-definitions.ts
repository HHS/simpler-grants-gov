import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

export const KEY_CONTACTS_FORM_MATCHER = /KEY\s+CONTACTS/i;

// Field definitions for the Key Contacts form.
//
// key_contacts is a FieldList widget with minItems: 1, maxItems: 4.
// Definitions are provided for all 4 possible entries (indices 0-3) to support
// tests that fill multiple entries via the "Add another entry" button.
//
// testIds sourced from rendered DOM: key_contacts[{index}]--{field} for flat
// fields, key_contacts[{index}]--{group}--{field} for nested (name, address).
//
// maxLength values sourced from:
// api/src/form_schema/forms/key_contacts/1/0/form_json.py
// api/src/form_schema/shared/common_shared.py
// api/src/form_schema/shared/address_shared.py
export const fieldDefinitionsKeyContacts: FormFillFieldDefinitions = {
  applicant_organization_name: {
    testId: "applicant_organization_name",
    type: "text",
    maxLength: 60, // common_shared.py.organization_name
    section: "Key Contacts",
    field: "Applicant Organization Name",
  },
  // ********* Key Contact 1 (index 0) *********
  "key_contacts[0]--project_role": {
    testId: "key_contacts[0]--project_role",
    type: "text",
    maxLength: 45,
    section: "Key Contacts",
    field: "Project Role",
  },
  "key_contacts[0]--name--prefix": {
    testId: "key_contacts[0]--name--prefix",
    type: "text",
    maxLength: 10, // common_shared.py.person_name.prefix
    section: "Key Contacts",
    field: "Prefix",
  },
  "key_contacts[0]--name--first_name": {
    testId: "key_contacts[0]--name--first_name",
    type: "text",
    maxLength: 35, // common_shared.py.person_name.first_name
    section: "Key Contacts",
    field: "First Name",
  },
  "key_contacts[0]--name--middle_name": {
    testId: "key_contacts[0]--name--middle_name",
    type: "text",
    maxLength: 25, // common_shared.py.person_name.middle_name
    section: "Key Contacts",
    field: "Middle Name",
  },
  "key_contacts[0]--name--last_name": {
    testId: "key_contacts[0]--name--last_name",
    type: "text",
    maxLength: 60, // common_shared.py.person_name.last_name
    section: "Key Contacts",
    field: "Last Name",
  },
  "key_contacts[0]--name--suffix": {
    testId: "key_contacts[0]--name--suffix",
    type: "text",
    maxLength: 10, // common_shared.py.person_name.suffix
    section: "Key Contacts",
    field: "Suffix",
  },
  "key_contacts[0]--title": {
    testId: "key_contacts[0]--title",
    type: "text",
    maxLength: 45, // common_shared.py.contact_person_title
    section: "Key Contacts",
    field: "Title",
  },
  "key_contacts[0]--organizational_affiliation": {
    testId: "key_contacts[0]--organizational_affiliation",
    type: "text",
    maxLength: 60, // common_shared.py.organization_name
    section: "Key Contacts",
    field: "Organizational Affiliation",
  },
  "key_contacts[0]--address--street1": {
    testId: "key_contacts[0]--address--street1",
    type: "text",
    maxLength: 55, // address_shared.py.street1
    section: "Key Contacts",
    field: "Street 1",
  },
  "key_contacts[0]--address--street2": {
    testId: "key_contacts[0]--address--street2",
    type: "text",
    maxLength: 55, // address_shared.py.street2
    section: "Key Contacts",
    field: "Street 2",
  },
  "key_contacts[0]--address--city": {
    testId: "key_contacts[0]--address--city",
    type: "text",
    maxLength: 35, // address_shared.py.city
    section: "Key Contacts",
    field: "City",
  },
  "key_contacts[0]--address--county": {
    testId: "key_contacts[0]--address--county",
    type: "text",
    maxLength: 30, // rendered DOM maxlength (address_shared.py.county)
    section: "Key Contacts",
    field: "County/Parish",
  },
  // key_contacts[0]--address--state: omitted, like PPSL - happy path uses
  // USA as country, and state is not required.
  "key_contacts[0]--address--state": {
    selector: 'select[name="key_contacts[0]--address--state"]',
    type: "dropdown",
    section: "Key Contacts",
    field: "State",
  },
  // key_contacts[0]--address--province: omitted, only applicable for
  // non-US addresses - same reasoning as PPSL.
  "key_contacts[0]--address--country": {
    selector: 'select[name="key_contacts[0]--address--country"]',
    type: "dropdown",
    section: "Key Contacts",
    field: "Country",
  },
  "key_contacts[0]--address--zip_code": {
    testId: "key_contacts[0]--address--zip_code",
    type: "text",
    maxLength: 30, // address_shared.py.zip_code
    section: "Key Contacts",
    field: "Zip / Postal Code",
  },
  "key_contacts[0]--phone": {
    testId: "key_contacts[0]--phone",
    type: "text",
    maxLength: 25, // common_shared.py.phone_number
    section: "Key Contacts",
    field: "Telephone Number",
  },
  "key_contacts[0]--fax": {
    testId: "key_contacts[0]--fax",
    type: "text",
    maxLength: 25, // common_shared.py.phone_number
    section: "Key Contacts",
    field: "Fax Number",
  },
  "key_contacts[0]--email": {
    testId: "key_contacts[0]--email",
    type: "email",
    maxLength: 60, // common_shared.py.contact_email
    section: "Key Contacts",
    field: "Email",
  },
  // ********* Key Contact 2 (index 1) *********
  "key_contacts[1]--project_role": {
    testId: "key_contacts[1]--project_role",
    type: "text",
    maxLength: 45,
    section: "Key Contacts",
    field: "Project Role",
  },
  "key_contacts[1]--name--prefix": {
    testId: "key_contacts[1]--name--prefix",
    type: "text",
    maxLength: 10,
    section: "Key Contacts",
    field: "Prefix",
  },
  "key_contacts[1]--name--first_name": {
    testId: "key_contacts[1]--name--first_name",
    type: "text",
    maxLength: 35,
    section: "Key Contacts",
    field: "First Name",
  },
  "key_contacts[1]--name--middle_name": {
    testId: "key_contacts[1]--name--middle_name",
    type: "text",
    maxLength: 25,
    section: "Key Contacts",
    field: "Middle Name",
  },
  "key_contacts[1]--name--last_name": {
    testId: "key_contacts[1]--name--last_name",
    type: "text",
    maxLength: 60,
    section: "Key Contacts",
    field: "Last Name",
  },
  "key_contacts[1]--name--suffix": {
    testId: "key_contacts[1]--name--suffix",
    type: "text",
    maxLength: 10,
    section: "Key Contacts",
    field: "Suffix",
  },
  "key_contacts[1]--title": {
    testId: "key_contacts[1]--title",
    type: "text",
    maxLength: 45,
    section: "Key Contacts",
    field: "Title",
  },
  "key_contacts[1]--organizational_affiliation": {
    testId: "key_contacts[1]--organizational_affiliation",
    type: "text",
    maxLength: 60,
    section: "Key Contacts",
    field: "Organizational Affiliation",
  },
  "key_contacts[1]--address--street1": {
    testId: "key_contacts[1]--address--street1",
    type: "text",
    maxLength: 55,
    section: "Key Contacts",
    field: "Street 1",
  },
  "key_contacts[1]--address--street2": {
    testId: "key_contacts[1]--address--street2",
    type: "text",
    maxLength: 55,
    section: "Key Contacts",
    field: "Street 2",
  },
  "key_contacts[1]--address--city": {
    testId: "key_contacts[1]--address--city",
    type: "text",
    maxLength: 35,
    section: "Key Contacts",
    field: "City",
  },
  "key_contacts[1]--address--county": {
    testId: "key_contacts[1]--address--county",
    type: "text",
    maxLength: 30,
    section: "Key Contacts",
    field: "County/Parish",
  },
  "key_contacts[1]--address--state": {
    selector: 'select[name="key_contacts[1]--address--state"]',
    type: "dropdown",
    section: "Key Contacts",
    field: "State",
  },
  "key_contacts[1]--address--country": {
    selector: 'select[name="key_contacts[1]--address--country"]',
    type: "dropdown",
    section: "Key Contacts",
    field: "Country",
  },
  "key_contacts[1]--address--zip_code": {
    testId: "key_contacts[1]--address--zip_code",
    type: "text",
    maxLength: 30,
    section: "Key Contacts",
    field: "Zip / Postal Code",
  },
  "key_contacts[1]--phone": {
    testId: "key_contacts[1]--phone",
    type: "text",
    maxLength: 25,
    section: "Key Contacts",
    field: "Telephone Number",
  },
  "key_contacts[1]--fax": {
    testId: "key_contacts[1]--fax",
    type: "text",
    maxLength: 25,
    section: "Key Contacts",
    field: "Fax Number",
  },
  "key_contacts[1]--email": {
    testId: "key_contacts[1]--email",
    type: "email",
    maxLength: 60,
    section: "Key Contacts",
    field: "Email",
  },
  // ********* Key Contact 3 (index 2) *********
  "key_contacts[2]--project_role": {
    testId: "key_contacts[2]--project_role",
    type: "text",
    maxLength: 45,
    section: "Key Contacts",
    field: "Project Role",
  },
  "key_contacts[2]--name--prefix": {
    testId: "key_contacts[2]--name--prefix",
    type: "text",
    maxLength: 10,
    section: "Key Contacts",
    field: "Prefix",
  },
  "key_contacts[2]--name--first_name": {
    testId: "key_contacts[2]--name--first_name",
    type: "text",
    maxLength: 35,
    section: "Key Contacts",
    field: "First Name",
  },
  "key_contacts[2]--name--middle_name": {
    testId: "key_contacts[2]--name--middle_name",
    type: "text",
    maxLength: 25,
    section: "Key Contacts",
    field: "Middle Name",
  },
  "key_contacts[2]--name--last_name": {
    testId: "key_contacts[2]--name--last_name",
    type: "text",
    maxLength: 60,
    section: "Key Contacts",
    field: "Last Name",
  },
  "key_contacts[2]--name--suffix": {
    testId: "key_contacts[2]--name--suffix",
    type: "text",
    maxLength: 10,
    section: "Key Contacts",
    field: "Suffix",
  },
  "key_contacts[2]--title": {
    testId: "key_contacts[2]--title",
    type: "text",
    maxLength: 45,
    section: "Key Contacts",
    field: "Title",
  },
  "key_contacts[2]--organizational_affiliation": {
    testId: "key_contacts[2]--organizational_affiliation",
    type: "text",
    maxLength: 60,
    section: "Key Contacts",
    field: "Organizational Affiliation",
  },
  "key_contacts[2]--address--street1": {
    testId: "key_contacts[2]--address--street1",
    type: "text",
    maxLength: 55,
    section: "Key Contacts",
    field: "Street 1",
  },
  "key_contacts[2]--address--street2": {
    testId: "key_contacts[2]--address--street2",
    type: "text",
    maxLength: 55,
    section: "Key Contacts",
    field: "Street 2",
  },
  "key_contacts[2]--address--city": {
    testId: "key_contacts[2]--address--city",
    type: "text",
    maxLength: 35,
    section: "Key Contacts",
    field: "City",
  },
  "key_contacts[2]--address--county": {
    testId: "key_contacts[2]--address--county",
    type: "text",
    maxLength: 30,
    section: "Key Contacts",
    field: "County/Parish",
  },
  "key_contacts[2]--address--state": {
    selector: 'select[name="key_contacts[2]--address--state"]',
    type: "dropdown",
    section: "Key Contacts",
    field: "State",
  },
  "key_contacts[2]--address--country": {
    selector: 'select[name="key_contacts[2]--address--country"]',
    type: "dropdown",
    section: "Key Contacts",
    field: "Country",
  },
  "key_contacts[2]--address--zip_code": {
    testId: "key_contacts[2]--address--zip_code",
    type: "text",
    maxLength: 30,
    section: "Key Contacts",
    field: "Zip / Postal Code",
  },
  "key_contacts[2]--phone": {
    testId: "key_contacts[2]--phone",
    type: "text",
    maxLength: 25,
    section: "Key Contacts",
    field: "Telephone Number",
  },
  "key_contacts[2]--fax": {
    testId: "key_contacts[2]--fax",
    type: "text",
    maxLength: 25,
    section: "Key Contacts",
    field: "Fax Number",
  },
  "key_contacts[2]--email": {
    testId: "key_contacts[2]--email",
    type: "email",
    maxLength: 60,
    section: "Key Contacts",
    field: "Email",
  },
  // ********* Key Contact 4 (index 3) *********
  "key_contacts[3]--project_role": {
    testId: "key_contacts[3]--project_role",
    type: "text",
    maxLength: 45,
    section: "Key Contacts",
    field: "Project Role",
  },
  "key_contacts[3]--name--prefix": {
    testId: "key_contacts[3]--name--prefix",
    type: "text",
    maxLength: 10,
    section: "Key Contacts",
    field: "Prefix",
  },
  "key_contacts[3]--name--first_name": {
    testId: "key_contacts[3]--name--first_name",
    type: "text",
    maxLength: 35,
    section: "Key Contacts",
    field: "First Name",
  },
  "key_contacts[3]--name--middle_name": {
    testId: "key_contacts[3]--name--middle_name",
    type: "text",
    maxLength: 25,
    section: "Key Contacts",
    field: "Middle Name",
  },
  "key_contacts[3]--name--last_name": {
    testId: "key_contacts[3]--name--last_name",
    type: "text",
    maxLength: 60,
    section: "Key Contacts",
    field: "Last Name",
  },
  "key_contacts[3]--name--suffix": {
    testId: "key_contacts[3]--name--suffix",
    type: "text",
    maxLength: 10,
    section: "Key Contacts",
    field: "Suffix",
  },
  "key_contacts[3]--title": {
    testId: "key_contacts[3]--title",
    type: "text",
    maxLength: 45,
    section: "Key Contacts",
    field: "Title",
  },
  "key_contacts[3]--organizational_affiliation": {
    testId: "key_contacts[3]--organizational_affiliation",
    type: "text",
    maxLength: 60,
    section: "Key Contacts",
    field: "Organizational Affiliation",
  },
  "key_contacts[3]--address--street1": {
    testId: "key_contacts[3]--address--street1",
    type: "text",
    maxLength: 55,
    section: "Key Contacts",
    field: "Street 1",
  },
  "key_contacts[3]--address--street2": {
    testId: "key_contacts[3]--address--street2",
    type: "text",
    maxLength: 55,
    section: "Key Contacts",
    field: "Street 2",
  },
  "key_contacts[3]--address--city": {
    testId: "key_contacts[3]--address--city",
    type: "text",
    maxLength: 35,
    section: "Key Contacts",
    field: "City",
  },
  "key_contacts[3]--address--county": {
    testId: "key_contacts[3]--address--county",
    type: "text",
    maxLength: 30,
    section: "Key Contacts",
    field: "County/Parish",
  },
  "key_contacts[3]--address--state": {
    selector: 'select[name="key_contacts[3]--address--state"]',
    type: "dropdown",
    section: "Key Contacts",
    field: "State",
  },
  "key_contacts[3]--address--country": {
    selector: 'select[name="key_contacts[3]--address--country"]',
    type: "dropdown",
    section: "Key Contacts",
    field: "Country",
  },
  "key_contacts[3]--address--zip_code": {
    testId: "key_contacts[3]--address--zip_code",
    type: "text",
    maxLength: 30,
    section: "Key Contacts",
    field: "Zip / Postal Code",
  },
  "key_contacts[3]--phone": {
    testId: "key_contacts[3]--phone",
    type: "text",
    maxLength: 25,
    section: "Key Contacts",
    field: "Telephone Number",
  },
  "key_contacts[3]--fax": {
    testId: "key_contacts[3]--fax",
    type: "text",
    maxLength: 25,
    section: "Key Contacts",
    field: "Fax Number",
  },
  "key_contacts[3]--email": {
    testId: "key_contacts[3]--email",
    type: "email",
    maxLength: 60,
    section: "Key Contacts",
    field: "Email",
  },
};

export const KEY_CONTACTS_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "KEY CONTACTS",
  fields: fieldDefinitionsKeyContacts,
} as const;

// Required field validation errors for Key Contacts.
// Sourced from FORM_JSON_SCHEMA.required (top-level) and
// $defs.key_contact_person.required (per-entry), cross-referenced against
// error message conventions used by other forms sharing the same refs
// (person_name -> "First/Last Name is required", address -> "Street 1/City/
// Country is required", phone_number -> "Telephone Number is required").
// NOT verified against an actual failed-validation run for this form -
// confirm before relying on these in CI.
export const KEY_CONTACTS_REQUIRED_FIELD_ERRORS: FieldError[] = [
  {
    fieldId: "applicant_organization_name",
    message: "Applicant Organization Name is required",
  },
  {
    fieldId: "key_contacts[0]--project_role",
    message: "Project Role is required",
  },
  {
    fieldId: "key_contacts[0]--name--first_name",
    message: "First Name is required",
  },
  {
    fieldId: "key_contacts[0]--name--last_name",
    message: "Last Name is required",
  },
  {
    fieldId: "key_contacts[0]--address--street1",
    message: "Street 1 is required",
  },
  {
    fieldId: "key_contacts[0]--address--city",
    message: "City is required",
  },
  {
    fieldId: "key_contacts[0]--address--country",
    message: "Country is required",
  },
  {
    fieldId: "key_contacts[0]--phone",
    message: "Telephone Number is required",
  },
  {
    fieldId: "key_contacts[0]--email",
    message: "Email is required",
  },
];
