import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

export const SF424_SHORT_FORM_MATCHER =
  /Application\s+for\s+Federal\s+Domestic\s+Assistance[\s-]*Short\s+Organizational\s*\(SF\s*[-‑–—]?\s*424\)/i;

// maxLength values sourced from:
// api/src/form_schema/forms/sf424_short/1/0/form_json.py
// api/src/form_schema/shared/common_shared.py
// api/src/form_schema/shared/address_shared.py
//
// NOTE: unlike SF-424 (long), several groups here nest further (project_director /
// contact_person each wrap a `name` + `address` sub-object via `contact_person_group`).
// Following the flattening convention already used for `applicant--street1` and
// `contact_person--first_name` in the SF-424 (long) fixture, nested testIds below drop the
// intermediate `name`/`address` wrapper and join group -> leaf with `--`
// (e.g. `project_director--first_name`, `project_director--street1`).
// TODO: confirm these testIds against the actual SF-424 Short form component - they are
// inferred from the schema shape, not read from the frontend implementation.
export const fieldDefinitionsSF424Short: FormFillFieldDefinitions = {
  // Section 5 - Applicant Information
  organization_name: {
    testId: "organization_name",
    type: "text",
    maxLength: 60, // common_shared.py.organization_name
    section: "Section 5",
    field: "Legal Name",
  },
  applicant_street1: {
    testId: "applicant--street1",
    type: "text",
    maxLength: 55, // address_shared.py.street1
    section: "Section 5",
    field: "Street 1",
  },
  applicant_street2: {
    testId: "applicant--street2",
    type: "text",
    maxLength: 55, // address_shared.py.street2
    section: "Section 5",
    field: "Street 2",
  },
  applicant_city: {
    testId: "applicant--city",
    type: "text",
    maxLength: 35, // address_shared.py.city
    section: "Section 5",
    field: "City",
  },
  applicant_state: {
    selector: "#applicant--state",
    printTestId: "applicant--state",
    type: "dropdown",
    section: "Section 5",
    field: "Applicant State",
  },
  applicant_country: {
    selector: "#applicant--country",
    printTestId: "applicant--country",
    type: "dropdown",
    section: "Section 5",
    field: "Applicant Country",
  },
  applicant_zip_code: {
    testId: "applicant--zip_code",
    type: "text",
    maxLength: 30, // address_shared.py.zip_code
    section: "Section 5",
    field: "Applicant Zip Code",
  },
  applicant_web_address: {
    testId: "applicant_web_address",
    type: "text",
    maxLength: 250, // FORM_JSON_SCHEMA.properties.applicant_web_address
    section: "Section 5",
    field: "Web Address",
  },
  // MultiSelect widget for applicant_type_code (array, minItems: 1, maxItems: 3)
  // Renders as a ComboBox with hidden inputs for each selected value
  // Component ID: applicant_type_code__combobox (derived from field id + "__combobox")
  applicant_type_code: {
    testId: "applicant_type_code__combobox",
    printTestId: "applicant_type_code",
    optionTestIdPrefix: "applicant-type-code-option-",
    type: "combo-box-input",
    section: "Section 5",
    field: "Type of Applicant",
  },
  applicant_type_other_specify: {
    dependsOn: {
      field: "applicant_type_code",
      value: "X: Other (specify)",
    },
    testId: "applicant_type_other_specify",
    type: "text",
    maxLength: 30, // FORM_JSON_SCHEMA.properties.applicant_type_other_specify
    section: "Section 5",
    field: "Applicant Type Other Specify",
  },
  employer_taxpayer_identification_number: {
    testId: "employer_taxpayer_identification_number",
    type: "text",
    maxLength: 30, // FORM_JSON_SCHEMA.properties.employer_taxpayer_identification_number
    section: "Section 5",
    field: "EIN/TIN",
  },
  congressional_district_applicant: {
    testId: "congressional_district_applicant",
    type: "text",
    maxLength: 6, // FORM_JSON_SCHEMA.properties.congressional_district_applicant
    section: "Section 5",
    field: "Congressional District of Applicant",
  },

  // Section 6 - Project Information
  project_title: {
    testId: "project_title",
    type: "text",
    maxLength: 200, // FORM_JSON_SCHEMA.properties.project_title
    section: "Section 6",
    field: "Project Title",
  },
  project_description: {
    selector: "#project_description",
    type: "textarea",
    maxLength: 1000, // FORM_JSON_SCHEMA.properties.project_description
    section: "Section 6",
    field: "Project Description",
  },
  project_start_date: {
    testId: "project_start_date",
    type: "text",
    maxLength: 10, // Date format MM/DD/YYYY
    section: "Section 6",
    field: "Project Start Date",
  },
  project_end_date: {
    testId: "project_end_date",
    type: "text",
    maxLength: 10, // Date format MM/DD/YYYY
    section: "Section 6",
    field: "Project End Date",
  },

  // Section 7 - Project Director (contact_person_group)
  // NOTE: Name and address fields use nested testIds: --name--, --address--
  project_director_prefix: {
    testId: "project_director--name--prefix",
    type: "text",
    maxLength: 10, // common_shared.py.person_name.prefix
    section: "Section 7",
    field: "Project Director Prefix",
  },
  project_director_first_name: {
    testId: "project_director--name--first_name",
    type: "text",
    maxLength: 35, // common_shared.py.person_name.first_name
    section: "Section 7",
    field: "Project Director First Name",
  },
  project_director_middle_name: {
    testId: "project_director--name--middle_name",
    type: "text",
    maxLength: 25, // common_shared.py.person_name.middle_name
    section: "Section 7",
    field: "Project Director Middle Name",
  },
  project_director_last_name: {
    testId: "project_director--name--last_name",
    type: "text",
    maxLength: 60, // common_shared.py.person_name.last_name
    section: "Section 7",
    field: "Project Director Last Name",
  },
  project_director_suffix: {
    testId: "project_director--name--suffix",
    type: "text",
    maxLength: 10, // common_shared.py.person_name.suffix
    section: "Section 7",
    field: "Project Director Suffix",
  },
  project_director_title: {
    testId: "project_director--title",
    type: "text",
    maxLength: 45, // common_shared.py.contact_person_title
    section: "Section 7",
    field: "Project Director Title",
  },
  project_director_email: {
    testId: "project_director--email",
    type: "text",
    maxLength: 60, // common_shared.py.contact_email
    section: "Section 7",
    field: "Project Director Email",
  },
  project_director_phone_number: {
    testId: "project_director--phone_number",
    type: "text",
    maxLength: 25, // common_shared.py.phone_number
    section: "Section 7",
    field: "Project Director Telephone Number",
  },
  project_director_fax: {
    testId: "project_director--fax",
    type: "text",
    maxLength: 25, // common_shared.py.phone_number
    section: "Section 7",
    field: "Project Director Fax",
  },
  project_director_street1: {
    testId: "project_director--address--street1",
    type: "text",
    maxLength: 55, // address_shared.py.street1
    section: "Section 7",
    field: "Project Director Street 1",
  },
  project_director_street2: {
    testId: "project_director--address--street2",
    type: "text",
    maxLength: 55, // address_shared.py.street2
    section: "Section 7",
    field: "Project Director Street 2",
  },
  project_director_city: {
    testId: "project_director--address--city",
    type: "text",
    maxLength: 35, // address_shared.py.city
    section: "Section 7",
    field: "Project Director City",
  },
  project_director_state: {
    selector: "#project_director--address--state",
    printTestId: "project_director--address--state",
    type: "dropdown",
    section: "Section 7",
    field: "Project Director State",
  },
  project_director_country: {
    selector: "#project_director--address--country",
    printTestId: "project_director--address--country",
    type: "dropdown",
    section: "Section 7",
    field: "Project Director Country",
  },
  project_director_zip_code: {
    testId: "project_director--address--zip_code",
    type: "text",
    maxLength: 30, // address_shared.py.zip_code
    section: "Section 7",
    field: "Project Director Zip Code",
  },

  // Section 8 - Primary Contact/Grants Administrator (contact_person_group)
  // NOTE: "Same as Project Director" is informational only per the source schema comment
  // (epic #10796) - it does not auto-populate or hide Section 8, so the happy path fills
  // Section 8 independently rather than relying on this checkbox.
  same_as_project_director: {
    getByText: "Same as Project Director",
    type: "checkbox",
    section: "Section 8",
    field: "Same as Project Director",
  },
  contact_person_prefix: {
    testId: "contact_person--name--prefix",
    type: "text",
    maxLength: 10,
    section: "Section 8",
    field: "Contact Person Prefix",
  },
  contact_person_first_name: {
    testId: "contact_person--name--first_name",
    type: "text",
    maxLength: 35,
    section: "Section 8",
    field: "Contact Person First Name",
  },
  contact_person_middle_name: {
    testId: "contact_person--name--middle_name",
    type: "text",
    maxLength: 25,
    section: "Section 8",
    field: "Contact Person Middle Name",
  },
  contact_person_last_name: {
    testId: "contact_person--name--last_name",
    type: "text",
    maxLength: 60,
    section: "Section 8",
    field: "Contact Person Last Name",
  },
  contact_person_suffix: {
    testId: "contact_person--name--suffix",
    type: "text",
    maxLength: 10,
    section: "Section 8",
    field: "Contact Person Suffix",
  },
  contact_person_title: {
    testId: "contact_person--title",
    type: "text",
    maxLength: 45,
    section: "Section 8",
    field: "Contact Person Title",
  },
  contact_person_email: {
    testId: "contact_person--email",
    type: "text",
    maxLength: 60,
    section: "Section 8",
    field: "Contact Person Email",
  },
  contact_person_phone_number: {
    testId: "contact_person--phone_number",
    type: "text",
    maxLength: 25,
    section: "Section 8",
    field: "Contact Person Telephone Number",
  },
  contact_person_fax: {
    testId: "contact_person--fax",
    type: "text",
    maxLength: 25,
    section: "Section 8",
    field: "Contact Person Fax",
  },
  contact_person_street1: {
    testId: "contact_person--address--street1",
    type: "text",
    maxLength: 55,
    section: "Section 8",
    field: "Contact Person Street 1",
  },
  contact_person_street2: {
    testId: "contact_person--address--street2",
    type: "text",
    maxLength: 55,
    section: "Section 8",
    field: "Contact Person Street 2",
  },
  contact_person_city: {
    testId: "contact_person--address--city",
    type: "text",
    maxLength: 35,
    section: "Section 8",
    field: "Contact Person City",
  },
  contact_person_state: {
    selector: "#contact_person--address--state",
    printTestId: "contact_person--address--state",
    type: "dropdown",
    section: "Section 8",
    field: "Contact Person State",
  },
  contact_person_country: {
    selector: "#contact_person--address--country",
    printTestId: "contact_person--address--country",
    type: "dropdown",
    section: "Section 8",
    field: "Contact Person Country",
  },
  contact_person_zip_code: {
    testId: "contact_person--address--zip_code",
    type: "text",
    maxLength: 30,
    section: "Section 8",
    field: "Contact Person Zip Code",
  },

  // Section 9 - Authorized Representative
  application_certification: {
    // TODO: confirm exact accessible-name text against the rendered label; SF-424 (long)
    // uses "Certification Agree*By" for its analogous getByText match.
    getByText: "** I Agree*",
    type: "checkbox",
    section: "Section 9",
    field: "Application Certification",
  },
  authorized_representative_prefix: {
    testId: "authorized_representative--prefix",
    type: "text",
    maxLength: 10,
    section: "Section 9",
    field: "Authorized Representative Prefix",
  },
  authorized_representative_first_name: {
    testId: "authorized_representative--first_name",
    type: "text",
    maxLength: 35,
    section: "Section 9",
    field: "Authorized Representative First Name",
  },
  authorized_representative_middle_name: {
    testId: "authorized_representative--middle_name",
    type: "text",
    maxLength: 25,
    section: "Section 9",
    field: "Authorized Representative Middle Name",
  },
  authorized_representative_last_name: {
    testId: "authorized_representative--last_name",
    type: "text",
    maxLength: 60,
    section: "Section 9",
    field: "Authorized Representative Last Name",
  },
  authorized_representative_suffix: {
    testId: "authorized_representative--suffix",
    type: "text",
    maxLength: 10,
    section: "Section 9",
    field: "Authorized Representative Suffix",
  },
  authorized_representative_title: {
    testId: "authorized_representative_title",
    type: "text",
    maxLength: 45, // common_shared.py.contact_person_title
    section: "Section 9",
    field: "Authorized Representative Title",
  },
  authorized_representative_email: {
    testId: "authorized_representative_email",
    type: "text",
    maxLength: 60, // common_shared.py.contact_email
    section: "Section 9",
    field: "Authorized Representative Email",
  },
  authorized_representative_phone_number: {
    testId: "authorized_representative_phone_number",
    type: "text",
    maxLength: 25, // common_shared.py.phone_number
    section: "Section 9",
    field: "Authorized Representative Telephone Number",
  },
  authorized_representative_fax: {
    testId: "authorized_representative_fax",
    type: "text",
    maxLength: 25, // common_shared.py.phone_number
    section: "Section 9",
    field: "Authorized Representative Fax",
  },
};

export const SF424_SHORT_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName:
    "Application for Federal Domestic Assistance-Short Organizational (SF-424)",
  fields: fieldDefinitionsSF424Short,
} as const;

// Required field validation errors for SF-424 Short.
// Excludes agency_name / funding_opportunity_number / funding_opportunity_title / sam_uei,
// which are pre-populated from the opportunity cover sheet rather than user-entered
// (same exclusion pattern as SF424_REQUIRED_FIELD_ERRORS).
// TODO: verify exact validation copy against the rendered UI - messages below are inferred
// from field titles in form_json.py, not confirmed against actual error text.
export const SF424_SHORT_REQUIRED_FIELD_ERRORS: FieldError[] = [
  { fieldId: "organization_name", message: "Legal Name is required" },
  { fieldId: "applicant--street1", message: "Street 1 is required" },
  { fieldId: "applicant--city", message: "City is required" },
  { fieldId: "applicant--country", message: "Country is required" },
  { fieldId: "applicant_type_code", message: "Type of Applicant is required" },
  {
    fieldId: "employer_taxpayer_identification_number",
    message: "EIN/TIN is required",
  },
  {
    fieldId: "congressional_district_applicant",
    message: "Congressional District of Applicant is required",
  },
  { fieldId: "project_title", message: "Project Title is required" },
  {
    fieldId: "project_description",
    message: "Project Description is required",
  },
  { fieldId: "project_start_date", message: "Project Start Date is required" },
  { fieldId: "project_end_date", message: "Project End Date is required" },
  {
    fieldId: "project_director--first_name",
    message: "First Name is required",
  },
  {
    fieldId: "project_director--last_name",
    message: "Last Name is required",
  },
  { fieldId: "project_director--title", message: "Title is required" },
  { fieldId: "project_director--street1", message: "Street 1 is required" },
  { fieldId: "project_director--city", message: "City is required" },
  { fieldId: "project_director--country", message: "Country is required" },
  {
    fieldId: "project_director--phone_number",
    message: "Telephone Number is required",
  },
  { fieldId: "project_director--email", message: "Email is required" },
  {
    fieldId: "contact_person--name--first_name",
    message: "First Name is required",
  },
  {
    fieldId: "contact_person--name--last_name",
    message: "Last Name is required",
  },
  { fieldId: "contact_person--title", message: "Title is required" },
  {
    fieldId: "contact_person--address--street1",
    message: "Street 1 is required",
  },
  { fieldId: "contact_person--address--city", message: "City is required" },
  {
    fieldId: "contact_person--address--country",
    message: "Country is required",
  },
  {
    fieldId: "contact_person--phone_number",
    message: "Telephone Number is required",
  },
  { fieldId: "contact_person--email", message: "Email is required" },
  {
    fieldId: "application_certification",
    message: "Application Certification is required",
  },
  {
    fieldId: "authorized_representative--first_name",
    message: "First Name is required",
  },
  {
    fieldId: "authorized_representative--last_name",
    message: "Last Name is required",
  },
  { fieldId: "authorized_representative_title", message: "Title is required" },
  {
    fieldId: "authorized_representative_email",
    message: "Email is required",
  },
  {
    fieldId: "authorized_representative_phone_number",
    message: "Telephone Number is required",
  },
];
