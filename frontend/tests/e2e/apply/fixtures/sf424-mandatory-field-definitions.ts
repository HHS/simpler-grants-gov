import type {
  FillFieldDefinition,
  FormFillFieldDefinitions,
} from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import type { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

// The SF424 Mandatory Form generated from forms/specs. Field ids follow the answer's path,
// e.g. applicant--organization--address--city.

export const SF424_MANDATORY_FORM_MATCHER = /SF424 Mandatory Form/i;

const SUBMISSION = "Submission Information";
const DATES = "Dates";
const IDENTIFIERS = "Identifiers";
const APPLICANT = "Applicant Organization";
const CONTACT = "Contact Person";
const PROJECT = "Project Information";
const DISTRICTS = "Congressional Districts";
const BUDGET = "Funding Period and Estimated Funding";
const STATE_REVIEW = "State Review";
const FEDERAL_DEBT = "Federal Debt";
const CERTIFICATION = "Certification";
const REPRESENTATIVE = "Authorized Representative";
const ATTACHMENTS = "Attachments";

const STATE_REVIEW_QUESTION =
  "Is Submission Subject to Review by State Under Executive Order 12372?";
const DELINQUENT_DEBT_QUESTION =
  "Is the Applicant Delinquent on Any Federal Debt?";

const text = (
  testId: string,
  section: string,
  field: string,
  maxLength?: number,
): FillFieldDefinition => ({ testId, type: "text", section, field, maxLength });

// A textarea's test id is "textarea", so find it by its field id.
const textArea = (
  id: string,
  section: string,
  field: string,
  maxLength: number,
): FillFieldDefinition => ({
  selector: `[id="${id}"]`,
  printTestId: id,
  type: "textarea",
  section,
  field,
  maxLength,
});

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

// Each yes/no question renders one radio per answer, named by the field. A configured
// selector wins over the fill value, so the definition names the answer to click.
const yesNo = (
  id: string,
  section: string,
  field: string,
  answer: boolean,
): FillFieldDefinition => ({
  selector: `input[name="${id}"][value="${answer}"]`,
  printTestId: id,
  type: "radiobutton",
  section,
  field,
});

const file = (
  id: string,
  section: string,
  field: string,
): FillFieldDefinition => ({
  selector: `input[name="${id}-visible"][type="file"]`,
  type: "file",
  section,
  field,
});

// Ask a follow-up only after the answer that requires it.
const after = (
  definition: FillFieldDefinition,
  field: string,
  value: string,
): FillFieldDefinition => ({ ...definition, dependsOn: { field, value } });

/** A person's name, title, organization, and contact details, by path below the person. */
const personFields = (
  person: string,
  section: string,
): FormFillFieldDefinitions => ({
  [`${person}--name--prefix`]: text(
    `${person}--name--prefix`,
    section,
    "Prefix",
    10,
  ),
  [`${person}--name--first_name`]: text(
    `${person}--name--first_name`,
    section,
    "First Name",
    35,
  ),
  [`${person}--name--middle_name`]: text(
    `${person}--name--middle_name`,
    section,
    "Middle Name",
    25,
  ),
  [`${person}--name--last_name`]: text(
    `${person}--name--last_name`,
    section,
    "Last Name",
    60,
  ),
  [`${person}--name--suffix`]: text(
    `${person}--name--suffix`,
    section,
    "Suffix",
    10,
  ),
  [`${person}--title`]: text(`${person}--title`, section, "Title", 45),
  [`${person}--organization--name`]: text(
    `${person}--organization--name`,
    section,
    "Organizational Affiliation",
    60,
  ),
  [`${person}--phone`]: text(`${person}--phone`, section, "Phone Number", 25),
  [`${person}--fax`]: text(`${person}--fax`, section, "Fax Number", 25),
  [`${person}--email`]: text(`${person}--email`, section, "Email", 60),
});

// maxLength values sourced from:
// api/src/form_schema/forms/sf424_mandatory_generated/1/0/json_schema.json
export const fieldDefinitionsSF424Mandatory: FormFillFieldDefinitions = {
  "application--submission_type": dropdown(
    "application--submission_type",
    SUBMISSION,
    "Type of Submission",
  ),
  "application--submission_type_other": after(
    textArea(
      "application--submission_type_other",
      SUBMISSION,
      "Type of Submission - Other (specify)",
      50,
    ),
    "application--submission_type",
    "Other",
  ),
  "application--frequency--code": dropdown(
    "application--frequency--code",
    SUBMISSION,
    "Frequency",
  ),
  "application--frequency--other": after(
    textArea(
      "application--frequency--other",
      SUBMISSION,
      "Frequency - Other (specify)",
      50,
    ),
    "application--frequency--code",
    "Other",
  ),
  "application--consolidated_request--answer": yesNo(
    "application--consolidated_request--answer",
    SUBMISSION,
    "Consolidated Application/Plan/Funding Request?",
    false,
  ),
  "application--version": dropdown(
    "application--version",
    SUBMISSION,
    "Version",
  ),
  "application--state--received_date": text(
    "application--state--received_date",
    DATES,
    "Date Received by State",
  ),
  "application--applicant_id": text(
    "application--applicant_id",
    IDENTIFIERS,
    "Applicant Identifier",
    30,
  ),
  "application--federal_entity_identifier": text(
    "application--federal_entity_identifier",
    IDENTIFIERS,
    "Federal Entity Identifier",
    30,
  ),
  "application--federal_award_identifier": text(
    "application--federal_award_identifier",
    IDENTIFIERS,
    "Federal Award Identifier",
    25,
  ),
  "application--state--application_id": text(
    "application--state--application_id",
    IDENTIFIERS,
    "State Application Identifier",
    30,
  ),
  "applicant--organization--name": text(
    "applicant--organization--name",
    APPLICANT,
    "Legal Name",
    60,
  ),
  "applicant--organization--ein": text(
    "applicant--organization--ein",
    APPLICANT,
    "EIN/TIN",
    30,
  ),
  "applicant--organization--address--street1": text(
    "applicant--organization--address--street1",
    APPLICANT,
    "Street 1",
    55,
  ),
  "applicant--organization--address--street2": text(
    "applicant--organization--address--street2",
    APPLICANT,
    "Street 2",
    55,
  ),
  "applicant--organization--address--city": text(
    "applicant--organization--address--city",
    APPLICANT,
    "City",
    35,
  ),
  "applicant--organization--address--county": text(
    "applicant--organization--address--county",
    APPLICANT,
    "County/Parish",
    30,
  ),
  "applicant--organization--address--state": dropdown(
    "applicant--organization--address--state",
    APPLICANT,
    "State",
  ),
  "applicant--organization--address--country": dropdown(
    "applicant--organization--address--country",
    APPLICANT,
    "Country",
  ),
  "applicant--organization--address--zip_code": text(
    "applicant--organization--address--zip_code",
    APPLICANT,
    "Zip / Postal Code",
    30,
  ),
  "applicant--organization--department": text(
    "applicant--organization--department",
    APPLICANT,
    "Department Name",
    30,
  ),
  "applicant--organization--division": text(
    "applicant--organization--division",
    APPLICANT,
    "Division Name",
    30,
  ),
  "applicant--type--code": dropdown(
    "applicant--type--code",
    APPLICANT,
    "Type of Applicant",
  ),
  "applicant--type--other_specify": after(
    text("applicant--type--other_specify", APPLICANT, "Other (specify)", 50),
    "applicant--type--code",
    "X: Other (specify)",
  ),
  "applicant--type--additional_description": textArea(
    "applicant--type--additional_description",
    APPLICANT,
    "Additional Description",
    50,
  ),
  ...personFields("contacts--point_of_contact", CONTACT),
  "project--title": text(
    "project--title",
    PROJECT,
    "Descriptive Title of Applicant's Project",
    250,
  ),
  "project--areas_affected": textArea(
    "project--areas_affected",
    PROJECT,
    "Areas Affected by Funding",
    250,
  ),
  "applicant--congressional_district": text(
    "applicant--congressional_district",
    DISTRICTS,
    "Applicant Congressional District",
    6,
  ),
  "project--congressional_district": text(
    "project--congressional_district",
    DISTRICTS,
    "Program/Project Congressional District",
    6,
  ),
  "project--additional_congressional_districts": file(
    "project--additional_congressional_districts",
    DISTRICTS,
    "Additional Congressional Districts Attachment",
  ),
  "budget--funding_period--start_date": text(
    "budget--funding_period--start_date",
    BUDGET,
    "Funding Period Start Date",
  ),
  "budget--funding_period--end_date": text(
    "budget--funding_period--end_date",
    BUDGET,
    "Funding Period End Date",
  ),
  "budget--funding_sources--federal": text(
    "budget--funding_sources--federal",
    BUDGET,
    "Estimated Funding - Federal",
    15,
  ),
  "budget--funding_sources--match": text(
    "budget--funding_sources--match",
    BUDGET,
    "Estimated Funding - Match",
    15,
  ),
  "application--state_review--status": dropdown(
    "application--state_review--status",
    STATE_REVIEW,
    STATE_REVIEW_QUESTION,
  ),
  "application--state_review--date": after(
    text(
      "application--state_review--date",
      STATE_REVIEW,
      "State Review Available Date",
    ),
    "application--state_review--status",
    "StateReviewAvailable",
  ),
  "applicant--delinquent_federal_debt--answer": yesNo(
    "applicant--delinquent_federal_debt--answer",
    FEDERAL_DEBT,
    DELINQUENT_DEBT_QUESTION,
    false,
  ),
  // Find the agreement by its input: the checkbox has no test id.
  "certification--agree": {
    selector: 'input[name="certification--agree"]',
    type: "checkbox",
    section: CERTIFICATION,
    field: "Application Certification (I Agree)",
  },
  ...personFields("contacts--authorized_representative", REPRESENTATIVE),
  "attachments--additional": file(
    "attachments--additional",
    ATTACHMENTS,
    "Supporting Documents",
  ),
};

export const SF424_MANDATORY_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "SF424 Mandatory Form",
  fields: fieldDefinitionsSF424Mandatory,
} as const;

// The validation summary drops a title's "?" and apostrophes before "is required", and puts
// the title of a missing group in front, e.g. "Address City is required".
const required = (fieldId: string, title: string): FieldError => ({
  fieldId,
  message: `${title.replace("?", "").replace(/'/g, "")} is required`,
});

const personRequiredErrors = (person: string): FieldError[] => [
  required(`${person}--name--first_name`, "Name First Name"),
  required(`${person}--name--last_name`, "Name Last Name"),
];

// An empty save leaves out every unanswered group, so each required field below it is
// reported. The agency, assistance listing, and UEI are pre-populated, so they're not.
export const SF424_MANDATORY_REQUIRED_FIELD_ERRORS: FieldError[] = [
  required("application--submission_type", "Type of Submission"),
  required("application--frequency--code", "Frequency"),
  required("application--version", "Version"),
  required("applicant--organization--name", "Legal Name"),
  required("applicant--organization--ein", "EIN/TIN"),
  required("applicant--organization--address--street1", "Address Street 1"),
  required("applicant--organization--address--city", "Address City"),
  required("applicant--organization--address--country", "Address Country"),
  required("applicant--type--code", "Type of Applicant"),
  ...personRequiredErrors("contacts--point_of_contact"),
  required("contacts--point_of_contact--phone", "Phone Number"),
  required("contacts--point_of_contact--email", "Email"),
  required("project--title", "Descriptive Title of Applicant's Project"),
  required(
    "applicant--congressional_district",
    "Applicant Congressional District",
  ),
  required("budget--funding_period--start_date", "Funding Period Start Date"),
  required("budget--funding_period--end_date", "Funding Period End Date"),
  required("budget--funding_sources--federal", "Estimated Funding - Federal"),
  required("application--state_review--status", STATE_REVIEW_QUESTION),
  required(
    "applicant--delinquent_federal_debt--answer",
    DELINQUENT_DEBT_QUESTION,
  ),
  required(
    "certification--agree",
    "Certification Application Certification (I Agree)",
  ),
  ...personRequiredErrors("contacts--authorized_representative"),
  required("contacts--authorized_representative--title", "Title"),
  required("contacts--authorized_representative--phone", "Phone Number"),
  required("contacts--authorized_representative--email", "Email"),
];
