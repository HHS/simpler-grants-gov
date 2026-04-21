import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

// Regex matcher for the EPA Key Contacts form link in the forms table.
export const EPA_KEY_CONTACTS_FORM_MATCHER = "EPA KEY CONTACTS FORM";

// ************ Field definitions ************
// testId convention mirrors the JSON schema path using "--" as a level separator:
//   <section>--<sub-object>--<field>
// e.g. authorized_representative--name--first_name
//
// Four sections, each sharing the same contact-person shape:
//   name (prefix, first_name, middle_name, last_name, suffix)
//   title
//   address (street1, street2, city, state, zip_code, country)
//   phone
//   fax
//   email

export const fieldDefinitionsEPAKeyContacts: FormFillFieldDefinitions = {
  // ************ Authorized Representative ************
  authorized_representative_name_prefix: {
    testId: "authorized_representative--name--prefix",
    type: "text",
    section: "Authorized Representative",
    field: "Prefix",
  },
  authorized_representative_name_first_name: {
    testId: "authorized_representative--name--first_name",
    type: "text",
    section: "Authorized Representative",
    field: "First Name",
  },
  authorized_representative_name_middle_name: {
    testId: "authorized_representative--name--middle_name",
    type: "text",
    section: "Authorized Representative",
    field: "Middle Name",
  },
  authorized_representative_name_last_name: {
    testId: "authorized_representative--name--last_name",
    type: "text",
    section: "Authorized Representative",
    field: "Last Name",
  },
  authorized_representative_name_suffix: {
    testId: "authorized_representative--name--suffix",
    type: "text",
    section: "Authorized Representative",
    field: "Suffix",
  },
  authorized_representative_title: {
    testId: "authorized_representative--title",
    type: "text",
    section: "Authorized Representative",
    field: "Title",
  },
  authorized_representative_address_street1: {
    testId: "authorized_representative--address--street1",
    type: "text",
    section: "Authorized Representative",
    field: "Street 1",
  },
  authorized_representative_address_street2: {
    testId: "authorized_representative--address--street2",
    type: "text",
    section: "Authorized Representative",
    field: "Street 2",
  },
  authorized_representative_address_city: {
    testId: "authorized_representative--address--city",
    type: "text",
    section: "Authorized Representative",
    field: "City",
  },
  authorized_representative_address_state: {
    selector: "#authorized_representative--address--state",
    type: "dropdown",
    section: "Authorized Representative",
    field: "State",
  },
  authorized_representative_address_zip_code: {
    testId: "authorized_representative--address--zip_code",
    type: "text",
    section: "Authorized Representative",
    field: "Zip Code",
  },
  authorized_representative_address_country: {
    selector: "#authorized_representative--address--country",
    type: "dropdown",
    section: "Authorized Representative",
    field: "Country",
  },
  authorized_representative_phone: {
    testId: "authorized_representative--phone",
    type: "text",
    section: "Authorized Representative",
    field: "Phone Number",
  },
  authorized_representative_email: {
    testId: "authorized_representative--email",
    type: "text",
    section: "Authorized Representative",
    field: "E-mail Address",
  },

  // ************ Payee ************
  payee_name_prefix: {
    testId: "payee--name--prefix",
    type: "text",
    section: "Payee",
    field: "Prefix",
  },
  payee_name_first_name: {
    testId: "payee--name--first_name",
    type: "text",
    section: "Payee",
    field: "First Name",
  },
  payee_name_middle_name: {
    testId: "payee--name--middle_name",
    type: "text",
    section: "Payee",
    field: "Middle Name",
  },
  payee_name_last_name: {
    testId: "payee--name--last_name",
    type: "text",
    section: "Payee",
    field: "Last Name",
  },
  payee_name_suffix: {
    testId: "payee--name--suffix",
    type: "text",
    section: "Payee",
    field: "Suffix",
  },
  payee_title: {
    testId: "payee--title",
    type: "text",
    section: "Payee",
    field: "Title",
  },
  payee_address_street1: {
    testId: "payee--address--street1",
    type: "text",
    section: "Payee",
    field: "Street 1",
  },
  payee_address_street2: {
    testId: "payee--address--street2",
    type: "text",
    section: "Payee",
    field: "Street 2",
  },
  payee_address_city: {
    testId: "payee--address--city",
    type: "text",
    section: "Payee",
    field: "City",
  },
  payee_address_state: {
    selector: "#payee--address--state",
    type: "dropdown",
    section: "Payee",
    field: "State",
  },
  payee_address_zip_code: {
    testId: "payee--address--zip_code",
    type: "text",
    section: "Payee",
    field: "Zip Code",
  },
  payee_address_country: {
    selector: "#payee--address--country",
    type: "dropdown",
    section: "Payee",
    field: "Country",
  },
  payee_phone: {
    testId: "payee--phone",
    type: "text",
    section: "Payee",
    field: "Phone Number",
  },
  payee_email: {
    testId: "payee--email",
    type: "text",
    section: "Payee",
    field: "E-mail Address",
  },

  // ************ Administrative Contact ************
  administrative_contact_name_prefix: {
    testId: "administrative_contact--name--prefix",
    type: "text",
    section: "Administrative Contact",
    field: "Prefix",
  },
  administrative_contact_name_first_name: {
    testId: "administrative_contact--name--first_name",
    type: "text",
    section: "Administrative Contact",
    field: "First Name",
  },
  administrative_contact_name_middle_name: {
    testId: "administrative_contact--name--middle_name",
    type: "text",
    section: "Administrative Contact",
    field: "Middle Name",
  },
  administrative_contact_name_last_name: {
    testId: "administrative_contact--name--last_name",
    type: "text",
    section: "Administrative Contact",
    field: "Last Name",
  },
  administrative_contact_name_suffix: {
    testId: "administrative_contact--name--suffix",
    type: "text",
    section: "Administrative Contact",
    field: "Suffix",
  },
  administrative_contact_title: {
    testId: "administrative_contact--title",
    type: "text",
    section: "Administrative Contact",
    field: "Title",
  },
  administrative_contact_address_street1: {
    testId: "administrative_contact--address--street1",
    type: "text",
    section: "Administrative Contact",
    field: "Street 1",
  },
  administrative_contact_address_street2: {
    testId: "administrative_contact--address--street2",
    type: "text",
    section: "Administrative Contact",
    field: "Street 2",
  },
  administrative_contact_address_city: {
    testId: "administrative_contact--address--city",
    type: "text",
    section: "Administrative Contact",
    field: "City",
  },
  administrative_contact_address_state: {
    selector: "#administrative_contact--address--state",
    type: "dropdown",
    section: "Administrative Contact",
    field: "State",
  },
  administrative_contact_address_zip_code: {
    testId: "administrative_contact--address--zip_code",
    type: "text",
    section: "Administrative Contact",
    field: "Zip Code",
  },
  administrative_contact_address_country: {
    selector: "#administrative_contact--address--country",
    type: "dropdown",
    section: "Administrative Contact",
    field: "Country",
  },
  administrative_contact_phone: {
    testId: "administrative_contact--phone",
    type: "text",
    section: "Administrative Contact",
    field: "Phone Number",
  },
  administrative_contact_email: {
    testId: "administrative_contact--email",
    type: "text",
    section: "Administrative Contact",
    field: "E-mail Address",
  },

  // ************ Project Manager ************
  project_manager_name_prefix: {
    testId: "project_manager--name--prefix",
    type: "text",
    section: "Project Manager",
    field: "Prefix",
  },
  project_manager_name_first_name: {
    testId: "project_manager--name--first_name",
    type: "text",
    section: "Project Manager",
    field: "First Name",
  },
  project_manager_name_middle_name: {
    testId: "project_manager--name--middle_name",
    type: "text",
    section: "Project Manager",
    field: "Middle Name",
  },
  project_manager_name_last_name: {
    testId: "project_manager--name--last_name",
    type: "text",
    section: "Project Manager",
    field: "Last Name",
  },
  project_manager_name_suffix: {
    testId: "project_manager--name--suffix",
    type: "text",
    section: "Project Manager",
    field: "Suffix",
  },
  project_manager_title: {
    testId: "project_manager--title",
    type: "text",
    section: "Project Manager",
    field: "Title",
  },
  project_manager_address_street1: {
    testId: "project_manager--address--street1",
    type: "text",
    section: "Project Manager",
    field: "Street 1",
  },
  project_manager_address_street2: {
    testId: "project_manager--address--street2",
    type: "text",
    section: "Project Manager",
    field: "Street 2",
  },
  project_manager_address_city: {
    testId: "project_manager--address--city",
    type: "text",
    section: "Project Manager",
    field: "City",
  },
  project_manager_address_state: {
    selector: "#project_manager--address--state",
    type: "dropdown",
    section: "Project Manager",
    field: "State",
  },
  project_manager_address_zip_code: {
    testId: "project_manager--address--zip_code",
    type: "text",
    section: "Project Manager",
    field: "Zip Code",
  },
  project_manager_address_country: {
    selector: "#project_manager--address--country",
    type: "dropdown",
    section: "Project Manager",
    field: "Country",
  },
  project_manager_phone: {
    testId: "project_manager--phone",
    type: "text",
    section: "Project Manager",
    field: "Phone Number",
  },
  project_manager_email: {
    testId: "project_manager--email",
    type: "text",
    section: "Project Manager",
    field: "E-mail Address",
  },
};

export const EPA_KEY_CONTACTS_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "EPA KEY CONTACTS FORM",
  fields: fieldDefinitionsEPAKeyContacts,
} as const;

// Required field validation errors for failure-path tests.
// Each of the four sections requires: First Name, Last Name, Street 1, City, Country, Phone.
const SECTION_REQUIRED_ERRORS = (section: string): FieldError[] => [
  {
    fieldId: `${section}--name--first_name`,
    message: "First Name is required",
  },
  { fieldId: `${section}--name--last_name`, message: "Last Name is required" },
  {
    fieldId: `${section}--address--street1`,
    message: "Address Street 1 is required",
  },
  { fieldId: `${section}--address--city`, message: "Address City is required" },
  {
    fieldId: `${section}--address--country`,
    message: "Address Country is required",
  },
  { fieldId: `${section}--phone`, message: "Phone Number is required" },
];

export const EPA_KEY_CONTACTS_REQUIRED_FIELD_ERRORS: FieldError[] = [
  ...SECTION_REQUIRED_ERRORS("authorized_representative"),
  ...SECTION_REQUIRED_ERRORS("payee"),
  ...SECTION_REQUIRED_ERRORS("administrative_contact"),
  ...SECTION_REQUIRED_ERRORS("project_manager"),
];
