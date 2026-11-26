import {
  FillFieldDefinition,
  FormFillFieldDefinitions,
} from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

// The SF-424 (R&R) generated from forms/specs. Skip the SF-424 family's other forms.
export const SF424_R_R_FORM_MATCHER =
  /Application for Federal Assistance \(SF 424 R&R\)/i;

// The answers the happy path picks for each radio. A configured selector wins over the fill
// value, so each radio definition names the answer to click and the data repeats it for
// the print view.
export const SF424_R_R_RADIO_ANSWERS = {
  submissionType: "Application",
  applicationType: "New",
  stateReviewStatus: "Program is not covered by E.O. 12372",
} as const;

const APPLICATION = "Submission and Application";
const APPLICANT = "Applicant Organization";
const POINT_OF_CONTACT = "Applicant Contact";
const APPLICANT_TYPE = "Type of Applicant";
const PROJECT = "Proposed Project";
const PROJECT_DIRECTOR = "Project Director / Principal Investigator";
const FUNDING = "Estimated Project Funding";
const STATE_REVIEW = "State Review";
const CERTIFICATION = "Certification";
const AUTHORIZED_REPRESENTATIVE = "Authorized Organization Representative";
const ATTACHMENTS = "Supporting Files";

const text = (
  testId: string,
  section: string,
  field: string,
): FillFieldDefinition => ({ testId, type: "text", section, field });

// Selects render with a shared test ID, so target each by its id.
const dropdown = (
  id: string,
  section: string,
  field: string,
): FillFieldDefinition => ({
  selector: `[id="${id}"]`,
  printTestId: id,
  type: "dropdown",
  section,
  field,
});

// Each radio renders one input per answer, named by the field.
const radio = (
  id: string,
  section: string,
  field: string,
  answer: string,
): FillFieldDefinition => ({
  selector: `input[name="${id}"][value="${answer}"]`,
  printTestId: id,
  type: "radiobutton",
  section,
  field,
});

const file = (id: string, field: string): FillFieldDefinition => ({
  selector: `input[name="${id}-visible"][type="file"]`,
  type: "file",
  section: ATTACHMENTS,
  field,
});

const addressFields = (
  prefix: string,
  section: string,
): FormFillFieldDefinitions => ({
  [`${prefix}--address--street1`]: text(
    `${prefix}--address--street1`,
    section,
    "Street 1",
  ),
  [`${prefix}--address--street2`]: text(
    `${prefix}--address--street2`,
    section,
    "Street 2",
  ),
  [`${prefix}--address--city`]: text(
    `${prefix}--address--city`,
    section,
    "City",
  ),
  [`${prefix}--address--county`]: text(
    `${prefix}--address--county`,
    section,
    "County/Parish",
  ),
  [`${prefix}--address--state`]: dropdown(
    `${prefix}--address--state`,
    section,
    "State",
  ),
  [`${prefix}--address--country`]: dropdown(
    `${prefix}--address--country`,
    section,
    "Country",
  ),
  [`${prefix}--address--zip_code`]: text(
    `${prefix}--address--zip_code`,
    section,
    "Zip / Postal Code",
  ),
});

// A contact's questions, keyed by test ID. The PD/PI and AOR also name their organization.
const contactFields = (
  prefix: string,
  section: string,
  withOrganization: boolean,
): FormFillFieldDefinitions => {
  const answer = (field: string, label: string) => ({
    [`${prefix}--${field}`]: text(`${prefix}--${field}`, section, label),
  });
  return {
    ...answer("name--prefix", "Prefix"),
    ...answer("name--first_name", "First Name"),
    ...answer("name--middle_name", "Middle Name"),
    ...answer("name--last_name", "Last Name"),
    ...answer("name--suffix", "Suffix"),
    ...answer("title", "Title"),
    ...(withOrganization
      ? {
          ...answer("organization--name", "Organization Name"),
          ...answer("organization--department", "Department"),
          ...answer("organization--division", "Division"),
        }
      : {}),
    ...addressFields(prefix, section),
    ...answer("phone", "Phone Number"),
    ...answer("fax", "Fax Number"),
    ...answer("email", "Email"),
  };
};

// maxLength values sourced from:
// api/src/form_schema/forms/sf424_r_r_generated/1/0/json_schema.json
export const fieldDefinitionsSF424RR: FormFillFieldDefinitions = {
  "application--submission_type": radio(
    "application--submission_type",
    APPLICATION,
    "Type of Submission",
    SF424_R_R_RADIO_ANSWERS.submissionType,
  ),
  "application--date_submitted": text(
    "application--date_submitted",
    APPLICATION,
    "Date Submitted",
  ),
  "application--applicant_id": text(
    "application--applicant_id",
    APPLICATION,
    "Applicant Identifier",
  ),
  "application--state--received_date": text(
    "application--state--received_date",
    APPLICATION,
    "Date Received by State",
  ),
  "application--state--application_id": text(
    "application--state--application_id",
    APPLICATION,
    "State Application Identifier",
  ),
  "application--federal_identifier": text(
    "application--federal_identifier",
    APPLICATION,
    "Federal Identifier",
  ),
  "application--agency_routing_number": text(
    "application--agency_routing_number",
    APPLICATION,
    "Agency Routing Identifier",
  ),
  "application--previous_tracking_id": {
    ...text(
      "application--previous_tracking_id",
      APPLICATION,
      "Previous Grants.gov Tracking ID",
    ),
    dependsOn: {
      field: "application--submission_type",
      value: "Change/Corrected Application",
    },
  },
  "application--application_type": radio(
    "application--application_type",
    APPLICATION,
    "Type of Application",
    SF424_R_R_RADIO_ANSWERS.applicationType,
  ),
  "application--revision--type": {
    ...dropdown("application--revision--type", APPLICATION, "Revision Type"),
    dependsOn: { field: "application--application_type", value: "Revision" },
  },
  "application--other_agencies--submitted": radio(
    "application--other_agencies--submitted",
    APPLICATION,
    "Is this application being submitted to other agencies?",
    "false",
  ),
  "application--other_agencies--explanation": {
    ...text(
      "application--other_agencies--explanation",
      APPLICATION,
      "Which other agencies?",
    ),
    dependsOn: {
      field: "application--other_agencies--submitted",
      value: "Yes",
    },
  },
  "applicant--organization--name": text(
    "applicant--organization--name",
    APPLICANT,
    "Legal Organization Name",
  ),
  "applicant--organization--department": text(
    "applicant--organization--department",
    APPLICANT,
    "Department",
  ),
  "applicant--organization--division": text(
    "applicant--organization--division",
    APPLICANT,
    "Division",
  ),
  ...addressFields("applicant--organization", APPLICANT),
  "applicant--organization--ein": text(
    "applicant--organization--ein",
    APPLICANT,
    "Employer Identification Number (EIN/TIN)",
  ),
  ...contactFields("contacts--point_of_contact", POINT_OF_CONTACT, false),
  "applicant--type--code": dropdown(
    "applicant--type--code",
    APPLICANT_TYPE,
    "Type of Applicant",
  ),
  "applicant--type--other_specify": {
    ...text(
      "applicant--type--other_specify",
      APPLICANT_TYPE,
      "Other Applicant Type",
    ),
    dependsOn: { field: "applicant--type--code", value: "X: Other (specify)" },
  },
  "project--title": text("project--title", PROJECT, "Project Title"),
  "project--timeline--start_date": text(
    "project--timeline--start_date",
    PROJECT,
    "Start Date",
  ),
  "project--timeline--end_date": text(
    "project--timeline--end_date",
    PROJECT,
    "End Date",
  ),
  "applicant--congressional_district": {
    ...text(
      "applicant--congressional_district",
      PROJECT,
      "Congressional District of Applicant",
    ),
    maxLength: 6,
  },
  ...contactFields("contacts--project_director", PROJECT_DIRECTOR, true),
  "budget--funding_sources--federal": text(
    "budget--funding_sources--federal",
    FUNDING,
    "Total Federal Funds Requested",
  ),
  "budget--funding_sources--non_federal": text(
    "budget--funding_sources--non_federal",
    FUNDING,
    "Total Non-Federal Funds",
  ),
  "budget--funding_sources--total": text(
    "budget--funding_sources--total",
    FUNDING,
    "Total Federal and Non-Federal Funds",
  ),
  "budget--funding_sources--program_income": text(
    "budget--funding_sources--program_income",
    FUNDING,
    "Estimated Program Income",
  ),
  "application--state_review--status": radio(
    "application--state_review--status",
    STATE_REVIEW,
    "Is this application subject to state review under Executive Order 12372?",
    SF424_R_R_RADIO_ANSWERS.stateReviewStatus,
  ),
  "application--state_review--date": {
    ...text(
      "application--state_review--date",
      STATE_REVIEW,
      "Date Submitted for State Review",
    ),
    dependsOn: { field: "application--state_review--status", value: "Y: Yes" },
  },
  "certification--agree": {
    selector: '[id="certification--agree"]',
    printTestId: "certification--agree",
    type: "checkbox",
    section: CERTIFICATION,
    field: "I agree",
  },
  ...contactFields(
    "contacts--authorized_representative",
    AUTHORIZED_REPRESENTATIVE,
    true,
  ),
  "attachments--lobbying_disclosure": file(
    "attachments--lobbying_disclosure",
    "SF-LLL or Other Explanatory Documentation",
  ),
  "attachments--pre_application": file(
    "attachments--pre_application",
    "Pre-Application",
  ),
  "attachments--cover_letter": file(
    "attachments--cover_letter",
    "Cover Letter",
  ),
};

export const SF424_R_R_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "Application for Federal Assistance (SF 424 R&R)",
  fields: fieldDefinitionsSF424RR,
} as const;

const required = (fieldId: string, title: string): FieldError => ({
  fieldId,
  message: `${title.replace("?", "")} is required`,
});

// The frontend drops each empty object an empty save leaves, so the API reports the object
// missing and its fields' errors start with the object's title (e.g. "Address City").
const addressErrors = (prefix: string): FieldError[] => [
  required(`${prefix}--address--street1`, "Address Street 1"),
  required(`${prefix}--address--city`, "Address City"),
  required(`${prefix}--address--country`, "Address Country"),
];

const contactErrors = (
  prefix: string,
  extraFields: Record<string, string>,
): FieldError[] => [
  required(`${prefix}--name--first_name`, "Name First Name"),
  required(`${prefix}--name--last_name`, "Name Last Name"),
  ...Object.entries(extraFields).map(([field, title]) =>
    required(`${prefix}--${field}`, title),
  ),
  ...addressErrors(prefix),
  required(`${prefix}--phone`, "Phone Number"),
];

export const SF424_R_R_REQUIRED_FIELD_ERRORS: FieldError[] = [
  required("application--submission_type", "Type of Submission"),
  required("application--application_type", "Type of Application"),
  required(
    "application--other_agencies--submitted",
    "Is this application being submitted to other agencies?",
  ),
  required(
    "application--state_review--status",
    "Is this application subject to state review under Executive Order 12372?",
  ),
  required("applicant--organization--name", "Legal Organization Name"),
  ...addressErrors("applicant--organization"),
  required(
    "applicant--organization--ein",
    "Employer Identification Number (EIN/TIN)",
  ),
  required("applicant--type--code", "Type of Applicant"),
  required(
    "applicant--congressional_district",
    "Congressional District of Applicant",
  ),
  required("project--title", "Project Title"),
  required("project--timeline--start_date", "Start Date"),
  required("project--timeline--end_date", "End Date"),
  ...contactErrors("contacts--point_of_contact", {}),
  ...contactErrors("contacts--project_director", {
    "organization--name": "Organization Name",
  }),
  required("contacts--project_director--email", "Email"),
  ...contactErrors("contacts--authorized_representative", {
    title: "Title",
    "organization--name": "Organization Name",
  }),
  required("contacts--authorized_representative--email", "Email"),
  required("budget--funding_sources--federal", "Total Federal Funds Requested"),
  required("budget--funding_sources--non_federal", "Total Non-Federal Funds"),
  required(
    "budget--funding_sources--total",
    "Total Federal and Non-Federal Funds",
  ),
  required(
    "budget--funding_sources--program_income",
    "Estimated Program Income",
  ),
  required("certification--agree", "Certification I agree"),
];
