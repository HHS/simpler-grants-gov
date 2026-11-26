import type { fieldDefinitionsSF424 } from "tests/e2e/apply/fixtures/sf424-field-definitions";
import {
  FillFieldDefinition,
  FormFillFieldDefinitions,
} from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

// The SF-424 generated from forms/specs. It nests each answer under its section, so its
// field ids differ from the hand-written form's. Each definition keeps the hand-written
// key, so both forms fill from the same test data.

const APPLICATION = "Application Information";
const ORGANIZATION = "Applicant Organization";
const CONTACT = "Contact Person";
const PROJECT = "Project Information";
const FUNDING = "Estimated Funding";
const AOR = "Authorized Representative";

const STATE_REVIEW_A =
  "a. This application was made available to the State under the Executive Order 12372 Process for review on";

const text = (
  testId: string,
  maxLength: number,
  section: string,
  field: string,
): FillFieldDefinition => ({
  testId,
  type: "text",
  maxLength,
  section,
  field,
});

// A radio group renders one input per answer, named by the field. A configured selector
// wins over the fill value, so the definition names the answer to click.
const radio = (
  id: string,
  value: string,
  section: string,
  field: string,
): FillFieldDefinition => ({
  selector: `input[name="${id}"][value="${value}"]`,
  printTestId: id,
  type: "radiobutton",
  section,
  field,
});

const dropdown = (
  id: string,
  section: string,
  field: string,
): FillFieldDefinition => ({
  selector: `#${id}`,
  printTestId: id,
  type: "dropdown",
  section,
  field,
});

const file = (id: string, section: string, field: string) => ({
  selector: `input[name="${id}-visible"][type="file"]`,
  type: "file" as const,
  section,
  field,
});

// maxLength values sourced from:
// api/src/form_schema/forms/sf424_generated/1/0/json_schema.json
export const fieldDefinitionsSF424Generated = {
  submission_type: radio(
    "application--submission_type",
    "Application",
    APPLICATION,
    "Submission Type",
  ),
  application_type: radio(
    "application--application_type",
    "New",
    APPLICATION,
    "Application Type",
  ),
  revision_type: {
    ...dropdown("application--revision--type", APPLICATION, "Revision Type"),
    dependsOn: { field: "application_type", value: "Revision" },
  },
  revision_other_specify: {
    ...text(
      "application--revision--other_specify",
      21,
      APPLICATION,
      "Other Explanation",
    ),
    dependsOn: { field: "revision_type", value: "E: Other (specify)" },
  },
  applicant_id: text(
    "application--applicant_id",
    30,
    APPLICATION,
    "Applicant Identifier",
  ),
  federal_entity_identifier: text(
    "application--federal_entity_identifier",
    30,
    APPLICATION,
    "Federal Entity Identifier",
  ),
  federal_award_identifier: text(
    "application--federal_award_identifier",
    25,
    APPLICATION,
    "Federal Award Identifier",
  ),
  organization_name: text(
    "applicant--organization--name",
    60,
    ORGANIZATION,
    "Legal Name",
  ),
  employer_taxpayer_identification_number: text(
    "applicant--organization--ein",
    30,
    ORGANIZATION,
    "EIN/TIN",
  ),
  applicant_street1: text(
    "applicant--organization--address--street1",
    55,
    ORGANIZATION,
    "Street 1",
  ),
  applicant_street2: text(
    "applicant--organization--address--street2",
    55,
    ORGANIZATION,
    "Street 2",
  ),
  applicant_city: text(
    "applicant--organization--address--city",
    35,
    ORGANIZATION,
    "City",
  ),
  applicant_state: dropdown(
    "applicant--organization--address--state",
    ORGANIZATION,
    "State",
  ),
  applicant_country: dropdown(
    "applicant--organization--address--country",
    ORGANIZATION,
    "Country",
  ),
  applicant_zip_code: text(
    "applicant--organization--address--zip_code",
    30,
    ORGANIZATION,
    "Zip / Postal Code",
  ),
  department_name: text(
    "applicant--organization--department",
    30,
    ORGANIZATION,
    "Department Name",
  ),
  division_name: text(
    "applicant--organization--division",
    30,
    ORGANIZATION,
    "Division Name",
  ),
  contact_person_prefix: text(
    "contacts--point_of_contact--name--prefix",
    10,
    CONTACT,
    "Prefix",
  ),
  contact_person_first_name: text(
    "contacts--point_of_contact--name--first_name",
    35,
    CONTACT,
    "First Name",
  ),
  contact_person_middle_name: text(
    "contacts--point_of_contact--name--middle_name",
    25,
    CONTACT,
    "Middle Name",
  ),
  contact_person_last_name: text(
    "contacts--point_of_contact--name--last_name",
    60,
    CONTACT,
    "Last Name",
  ),
  contact_person_suffix: text(
    "contacts--point_of_contact--name--suffix",
    10,
    CONTACT,
    "Suffix",
  ),
  contact_person_title: text(
    "contacts--point_of_contact--title",
    45,
    CONTACT,
    "Title",
  ),
  organization_affiliation: text(
    "contacts--point_of_contact--organization--name",
    60,
    CONTACT,
    "Organizational Affiliation",
  ),
  phone_number: text(
    "contacts--point_of_contact--phone",
    25,
    CONTACT,
    "Phone Number",
  ),
  fax: text("contacts--point_of_contact--fax", 25, CONTACT, "Fax Number"),
  email: text("contacts--point_of_contact--email", 60, CONTACT, "Email"),
  applicant_type_code__combobox: {
    testId: "combo-box-toggle",
    printTestId: "applicant--type--codes",
    optionTestIdPrefix: "combo-box-option-",
    type: "combo-box-input",
    section: "Applicant Type",
    field: "Type of Applicant",
  },
  applicant_type_other_specify: text(
    "applicant--type--other_specify",
    30,
    "Applicant Type",
    "Type of Applicant Other Explanation",
  ),
  areas_affected_attachment: file(
    "project--areas_affected",
    PROJECT,
    "Areas Affected",
  ),
  project_title: text("project--title", 200, PROJECT, "Project Title"),
  additional_project_title_attachment: file(
    "project--additional_titles",
    PROJECT,
    "Additional Project Title",
  ),
  congressional_district_applicant: text(
    "applicant--congressional_district",
    6,
    PROJECT,
    "Applicant District",
  ),
  congressional_district_program_project: text(
    "project--congressional_district",
    6,
    PROJECT,
    "Program District",
  ),
  additional_congressional_attachment: file(
    "project--additional_congressional_districts",
    PROJECT,
    "Additional Congressional Districts",
  ),
  project_start_date: text(
    "project--timeline--start_date",
    10,
    PROJECT,
    "Project Start Date",
  ),
  project_end_date: text(
    "project--timeline--end_date",
    10,
    PROJECT,
    "Project End Date",
  ),
  federal_estimated_funding: text(
    "budget--funding_sources--federal",
    15,
    FUNDING,
    "Federal Estimated Funding",
  ),
  applicant_estimated_funding: text(
    "budget--funding_sources--applicant",
    15,
    FUNDING,
    "Applicant Estimated Funding",
  ),
  state_estimated_funding: text(
    "budget--funding_sources--state",
    15,
    FUNDING,
    "State Estimated Funding",
  ),
  local_estimated_funding: text(
    "budget--funding_sources--local",
    15,
    FUNDING,
    "Local Estimated Funding",
  ),
  other_estimated_funding: text(
    "budget--funding_sources--other",
    15,
    FUNDING,
    "Other Estimated Funding",
  ),
  program_income_estimated_funding: text(
    "budget--funding_sources--program_income",
    15,
    FUNDING,
    "Program Income Estimated Funding",
  ),
  application_subject_to: radio(
    "application--state_review--status",
    "c. Program is not covered by E.O. 12372.",
    "State Review",
    "Is Application Subject to Review By State Under Executive Order 12372 Process?",
  ),
  // The date is enabled only for answer a.
  state_review_available_date: {
    ...text(
      "application--state_review--date",
      10,
      "State Review",
      "State Review Date",
    ),
    dependsOn: { field: "application_subject_to", value: STATE_REVIEW_A },
  },
  delinquent_federal_debt: radio(
    "applicant--delinquent_federal_debt--answer",
    "false",
    "Federal Debt",
    "Applicant Delinquent on Federal Debt",
  ),
  debt_explanation_attachment: {
    ...file(
      "applicant--delinquent_federal_debt--explanation",
      "Federal Debt",
      "Debt Explanation",
    ),
    dependsOn: { field: "delinquent_federal_debt", value: "Yes" },
  },
  certification_agree: {
    selector: "#certification--agree",
    type: "checkbox",
    section: "Certification",
    field: "I Agree",
  },
  authorized_representative_prefix: text(
    "contacts--authorized_representative--name--prefix",
    10,
    AOR,
    "Prefix",
  ),
  authorized_representative_first_name: text(
    "contacts--authorized_representative--name--first_name",
    35,
    AOR,
    "First Name",
  ),
  authorized_representative_middle_name: text(
    "contacts--authorized_representative--name--middle_name",
    25,
    AOR,
    "Middle Name",
  ),
  authorized_representative_last_name: text(
    "contacts--authorized_representative--name--last_name",
    60,
    AOR,
    "Last Name",
  ),
  authorized_representative_suffix: text(
    "contacts--authorized_representative--name--suffix",
    10,
    AOR,
    "Suffix",
  ),
  authorized_representative_title: text(
    "contacts--authorized_representative--title",
    45,
    AOR,
    "Title",
  ),
  authorized_representative_phone_number: text(
    "contacts--authorized_representative--phone",
    25,
    AOR,
    "Phone Number",
  ),
  authorized_representative_fax: text(
    "contacts--authorized_representative--fax",
    25,
    AOR,
    "Fax Number",
  ),
  authorized_representative_email: text(
    "contacts--authorized_representative--email",
    60,
    AOR,
    "Email",
  ),
} satisfies Partial<
  Record<keyof typeof fieldDefinitionsSF424, FillFieldDefinition>
> satisfies FormFillFieldDefinitions;

export const SF424_GENERATED_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "Application for Federal Assistance (SF-424)",
  fields: fieldDefinitionsSF424Generated,
} as const;

// The validation summary titles each error with the field's layout label, and an empty
// save leaves out each empty section, so a nested field's error starts with its parent's
// title.
const required = (fieldId: string, title: string): FieldError => ({
  fieldId,
  message: `${title} is required`,
});

export const SF424_GENERATED_REQUIRED_FIELD_ERRORS: FieldError[] = [
  required("application--submission_type", "Submission Type"),
  required("application--application_type", "Application Type"),
  required("applicant--organization--name", "Legal Name"),
  required("applicant--organization--ein", "EIN/TIN"),
  required("applicant--organization--address--street1", "Address Street 1"),
  required("applicant--organization--address--city", "Address City"),
  required("applicant--organization--address--country", "Address Country"),
  required("contacts--point_of_contact--name--first_name", "Name First Name"),
  required("contacts--point_of_contact--name--last_name", "Name Last Name"),
  required("contacts--point_of_contact--phone", "Phone Number"),
  required("contacts--point_of_contact--email", "Email"),
  required("applicant--type--codes", "Type of Applicant"),
  required("project--title", "Project Title"),
  required("applicant--congressional_district", "Applicant District"),
  required("project--congressional_district", "Program District"),
  required("project--timeline--start_date", "Project Start Date"),
  required("project--timeline--end_date", "Project End Date"),
  required("budget--funding_sources--federal", "Federal Estimated Funding"),
  required("budget--funding_sources--applicant", "Applicant Estimated Funding"),
  required("budget--funding_sources--state", "State Estimated Funding"),
  required("budget--funding_sources--local", "Local Estimated Funding"),
  required("budget--funding_sources--other", "Other Estimated Funding"),
  required(
    "budget--funding_sources--program_income",
    "Program Income Estimated Funding",
  ),
  required(
    "application--state_review--status",
    "Is Application Subject to Review By State Under Executive Order 12372 Process",
  ),
  required(
    "applicant--delinquent_federal_debt--answer",
    "Applicant Delinquent on Federal Debt",
  ),
  required("certification--agree", "Certification I Agree"),
  required(
    "contacts--authorized_representative--name--first_name",
    "Name First Name",
  ),
  required(
    "contacts--authorized_representative--name--last_name",
    "Name Last Name",
  ),
  required("contacts--authorized_representative--title", "Title"),
  required("contacts--authorized_representative--phone", "Phone Number"),
  required("contacts--authorized_representative--email", "Email"),
];
