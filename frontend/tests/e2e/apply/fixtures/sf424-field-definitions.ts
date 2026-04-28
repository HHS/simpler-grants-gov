import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

export const SF424_FORM_MATCHER =
  /SF\s*[-‑–—]?\s*424(?![A-Za-z0-9])|Application\s+for\s+Federal\s+Assistance/i;

export const fieldDefinitionsSF424: FormFillFieldDefinitions = {
  submission_type: {
    selector: "#submission_type",
    type: "dropdown",
    section: "Section 1",
    field: "Submission Type",
  },
  application_type: {
    selector: "#application_type",
    type: "dropdown",
    section: "Section 2",
    field: "Application Type",
  },
  revision_type: {
    selector: "#revision_type",
    type: "dropdown",
    section: "Section 2",
    field: "Revision Type",
  },
  revision_other_specify: {
    testId: "revision_other_specify",
    type: "text",
    section: "Section 2",
    field: "Revision Other Specify",
  },
  applicant_id: {
    testId: "applicant_id",
    type: "text",
    section: "Section 4",
    field: "Applicant Identifier",
  },
  federal_entity_identifier: {
    testId: "federal_entity_identifier",
    type: "text",
    section: "Section 5a",
    field: "Federal Entity Identifier",
  },
  federal_award_identifier: {
    testId: "federal_award_identifier",
    type: "text",
    section: "Section 5b",
    field: "Federal Award Identifier",
  },
  organization_name: {
    testId: "organization_name",
    type: "text",
    section: "Section 6",
    field: "Organization Name",
  },
  employer_taxpayer_identification_number: {
    testId: "employer_taxpayer_identification_number",
    type: "text",
    section: "Section 7",
    field: "Employer Taxpayer Identification Number",
  },
  applicant_street1: {
    testId: "applicant--street1",
    type: "text",
    section: "Section 8",
    field: "Street 1",
  },
  applicant_street2: {
    testId: "applicant--street2",
    type: "text",
    section: "Section 8",
    field: "Street 2",
  },
  applicant_city: {
    testId: "applicant--city",
    type: "text",
    section: "Section 8",
    field: "City",
  },
  applicant_state: {
    selector: "#applicant--state",
    type: "dropdown",
    section: "Section 8",
    field: "Applicant State",
  },
  applicant_country: {
    selector: "#applicant--country",
    type: "dropdown",
    section: "Section 8",
    field: "Applicant Country",
  },
  applicant_zip_code: {
    testId: "applicant--zip_code",
    type: "text",
    section: "Section 8",
    field: "Applicant Zip Code",
  },
  department_name: {
    testId: "department_name",
    type: "text",
    section: "Section 8e",
    field: "Department Name",
  },
  division_name: {
    testId: "division_name",
    type: "text",
    section: "Section 8e",
    field: "Division Name",
  },
  contact_person_prefix: {
    testId: "contact_person--prefix",
    type: "text",
    section: "Section 8f",
    field: "Contact Person Prefix",
  },
  contact_person_first_name: {
    testId: "contact_person--first_name",
    type: "text",
    section: "Section 8f",
    field: "Contact Person First Name",
  },
  contact_person_middle_name: {
    testId: "contact_person--middle_name",
    type: "text",
    section: "Section 8f",
    field: "Contact Person Middle Name",
  },
  contact_person_last_name: {
    testId: "contact_person--last_name",
    type: "text",
    section: "Section 8f",
    field: "Contact Person Last Name",
  },
  contact_person_suffix: {
    testId: "contact_person--suffix",
    type: "text",
    section: "Section 8f",
    field: "Contact Person Suffix",
  },
  contact_person_title: {
    testId: "contact_person_title",
    type: "text",
    section: "Section 8f",
    field: "Contact Person Title",
  },
  organization_affiliation: {
    testId: "organization_affiliation",
    type: "text",
    section: "Section 8f",
    field: "Organization Affiliation",
  },
  phone_number: {
    testId: "phone_number",
    type: "text",
    section: "Section 8f",
    field: "Phone Number",
  },
  fax: {
    testId: "fax",
    type: "text",
    section: "Section 8f",
    field: "Fax",
  },
  email: {
    testId: "email",
    type: "text",
    section: "Section 8f",
    field: "Email",
  },
  applicant_type_code__combobox: {
    testId: "combo-box-toggle",
    optionTestIdPrefix: "combo-box-option-",
    type: "combo-box-input",
    section: "Section 9",
    field: "Type of Applicant",
  },
  applicant_type_other_specify: {
    testId: "applicant_type_other_specify",
    type: "text",
    section: "Section 9",
    field: "Applicant Type Other Specify",
  },
  agency_name: {
    testId: "agency_name",
    type: "text",
    section: "Section 11",
    field: "Agency Name",
  },
  assistance_listing_program_title: {
    testId: "assistance_listing_program_title",
    type: "text",
    section: "Section 12",
    field: "Assistance Listing Program Title",
  },
  areas_affected_attachment: {
    selector: 'input[name="areas_affected"][type="file"]',
    type: "file",
    section: "Section 14",
    field: "Areas Affected Attachment",
  },
  project_title: {
    testId: "project_title",
    type: "text",
    section: "Section 15",
    field: "Project Title",
  },
  additional_project_title_attachment: {
    selector: 'input[name="additional_project_title"][type="file"]',
    type: "file",
    section: "Section 15",
    field: "Additional Project Title Attachment",
  },
  congressional_district_applicant: {
    testId: "congressional_district_applicant",
    type: "text",
    section: "Section 16",
    field: "Congressional District Applicant",
  },
  congressional_district_program_project: {
    testId: "congressional_district_program_project",
    type: "text",
    section: "Section 16",
    field: "Congressional District Program Project",
  },
  additional_congressional_attachment: {
    selector: 'input[name="additional_congressional_districts"][type="file"]',
    type: "file",
    section: "Section 16",
    field: "Additional Congressional Attachment",
  },
  project_start_date: {
    testId: "project_start_date",
    type: "text",
    section: "Section 17",
    field: "Project Start Date",
  },
  project_end_date: {
    testId: "project_end_date",
    type: "text",
    section: "Section 17",
    field: "Project End Date",
  },
  federal_estimated_funding: {
    testId: "federal_estimated_funding",
    type: "text",
    section: "Section 18",
    field: "Federal Estimated Funding",
  },
  applicant_estimated_funding: {
    testId: "applicant_estimated_funding",
    type: "text",
    section: "Section 18",
    field: "Applicant Estimated Funding",
  },
  state_estimated_funding: {
    testId: "state_estimated_funding",
    type: "text",
    section: "Section 18",
    field: "State Estimated Funding",
  },
  local_estimated_funding: {
    testId: "local_estimated_funding",
    type: "text",
    section: "Section 18",
    field: "Local Estimated Funding",
  },
  other_estimated_funding: {
    testId: "other_estimated_funding",
    type: "text",
    section: "Section 18",
    field: "Other Estimated Funding",
  },
  program_income_estimated_funding: {
    testId: "program_income_estimated_funding",
    type: "text",
    section: "Section 18",
    field: "Program Income Estimated Funding",
  },
  application_subject_to: {
    selector: "#state_review",
    type: "dropdown",
    section: "Section 19",
    field:
      "Is Application Subject to Review By State Under Executive Order 12372 Process?",
  },
  state_review_available_date: {
    testId: "state_review_available_date",
    type: "text",
    section: "Section 19",
    field: "State Review Available Date",
  },
  delinquent_federal_debt: {
    useDataAsText: true,
    type: "radiobutton",
    section: "Section 20",
    field: "Applicant Delinquent on Federal Debt",
  },
  debt_explanation_attachment: {
    dependsOn: {
      field: "delinquent_federal_debt",
      value: "Yes",
    },
    selector: 'input[name="debt_explanation"][type="file"]',
    type: "file",
    section: "Section 20",
    field: "Debt Explanation Attachment",
  },
  certification_agree: {
    getByText: "Certification Agree*By",
    type: "checkbox",
    section: "Section 21",
    field: "Certification Agree",
  },
  authorized_representative_prefix: {
    testId: "authorized_representative--prefix",
    type: "text",
    section: "Section 21",
    field: "Authorized Representative Prefix",
  },
  authorized_representative_first_name: {
    testId: "authorized_representative--first_name",
    type: "text",
    section: "Section 21",
    field: "Authorized Representative First Name",
  },
  authorized_representative_middle_name: {
    testId: "authorized_representative--middle_name",
    type: "text",
    section: "Section 21",
    field: "Authorized Representative Middle Name",
  },
  authorized_representative_last_name: {
    testId: "authorized_representative--last_name",
    type: "text",
    section: "Section 21",
    field: "Authorized Representative Last Name",
  },
  authorized_representative_suffix: {
    testId: "authorized_representative--suffix",
    type: "text",
    section: "Section 21",
    field: "Authorized Representative Suffix",
  },
  authorized_representative_title: {
    testId: "authorized_representative_title",
    type: "text",
    section: "Section 21",
    field: "Authorized Representative Title",
  },
  authorized_representative_phone_number: {
    testId: "authorized_representative_phone_number",
    type: "text",
    section: "Section 21",
    field: "Authorized Representative Phone Number",
  },
  authorized_representative_fax: {
    testId: "authorized_representative_fax",
    type: "text",
    section: "Section 21",
    field: "Authorized Representative Fax",
  },
  authorized_representative_email: {
    testId: "authorized_representative_email",
    type: "text",
    section: "Section 21",
    field: "Authorized Representative Email",
  },
};

export const SF424_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "Application for Federal Assistance (SF-424)",
  fields: fieldDefinitionsSF424,
} as const;

// Required field validation errors for SF-424
export const SF424_REQUIRED_FIELD_ERRORS: FieldError[] = [
  { fieldId: "submission_type", message: "Submission Type is required" },
  { fieldId: "application_type", message: "Application Type is required" },
  { fieldId: "organization_name", message: "Legal Name is required" },
  {
    fieldId: "employer_taxpayer_identification_number",
    message: "EIN/TIN is required",
  },
  { fieldId: "applicant--street1", message: "Applicant Street 1 is required" },
  { fieldId: "applicant--city", message: "Applicant City is required" },
  { fieldId: "applicant--country", message: "Applicant Country is required" },
  {
    fieldId: "contact_person--first_name",
    message: "Contact Person First Name is required",
  },
  {
    fieldId: "contact_person--last_name",
    message: "Contact Person Last Name is required",
  },
  { fieldId: "phone_number", message: "Telephone Number is required" },
  { fieldId: "email", message: "Email is required" },
  { fieldId: "applicant_type_code", message: "Type of Applicant is required" },
  { fieldId: "project_title", message: "Project Title is required" },
  {
    fieldId: "congressional_district_applicant",
    message: "Applicant District is required",
  },
  {
    fieldId: "congressional_district_program_project",
    message: "Program District is required",
  },
  { fieldId: "project_start_date", message: "Project Start Date is required" },
  { fieldId: "project_end_date", message: "Project End Date is required" },
  {
    fieldId: "federal_estimated_funding",
    message: "Federal Estimated Funding is required",
  },
  {
    fieldId: "applicant_estimated_funding",
    message: "Applicant Estimated Funding is required",
  },
  {
    fieldId: "state_estimated_funding",
    message: "State Estimated Funding is required",
  },
  {
    fieldId: "local_estimated_funding",
    message: "Local Estimated Funding is required",
  },
  {
    fieldId: "other_estimated_funding",
    message: "Other Estimated Funding is required",
  },
  {
    fieldId: "program_income_estimated_funding",
    message: "Program Income Estimated Funding is required",
  },
  {
    fieldId: "state_review",
    message:
      "Is Application Subject to Review By State Under Executive Order 12372 Process is required",
  },
  {
    fieldId: "delinquent_federal_debt",
    message: "Applicant Delinquent on Federal Debt is required",
  },
  {
    fieldId: "certification_agree",
    message: "Certification Agree is required",
  },
  {
    fieldId: "authorized_representative--first_name",
    message: "Authorized Representative First Name is required",
  },
  {
    fieldId: "authorized_representative--last_name",
    message: "Authorized Representative Last Name is required",
  },
  { fieldId: "authorized_representative_title", message: "Title is required" },
  {
    fieldId: "authorized_representative_phone_number",
    message: "AOR Telephone Number is required",
  },
  {
    fieldId: "authorized_representative_email",
    message: "AOR email is required",
  },
];
