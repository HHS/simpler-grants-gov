import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

export const NASA_PI_AND_AOR_FORM_MATCHER =
  /NASA - Principal Investigator and Authorized Representative/i;

const AOR = "Authorized Representative Name";
const PI = "Principal Investigator Name";

const US_GOVERNMENT_PARTICIPATION =
  "Is this person participating in this project as an employee of the U.S. Government?";
const INTERNATIONAL_PARTICIPATION =
  "Is this person participating in this project as an employee of a foreign organization?";

const text = (testId: string, section: string, field: string) => ({
  testId,
  type: "text" as const,
  section,
  field,
});

// Each yes/no question renders one radio per answer, named by the field.
const yesNo = (id: string, field: string) => ({
  selector: `input[name="${id}"][value="true"]`,
  printTestId: id,
  type: "radiobutton" as const,
  section: PI,
  field,
});

// maxLength values sourced from:
// api/src/form_schema/forms/nasa_pi_and_aor_generated/1/0/json_schema.json
export const fieldDefinitionsNasaPIAndAOR: FormFillFieldDefinitions = {
  aorPrefix: text("authorized_representative--name--prefix", AOR, "Prefix"),
  aorFirstName: text(
    "authorized_representative--name--first_name",
    AOR,
    "First Name",
  ),
  aorMiddleName: text(
    "authorized_representative--name--middle_name",
    AOR,
    "Middle Name",
  ),
  aorLastName: text(
    "authorized_representative--name--last_name",
    AOR,
    "Last Name",
  ),
  aorSuffix: text("authorized_representative--name--suffix", AOR, "Suffix"),
  aorNspiresUsername: text(
    "authorized_representative--nspires_username",
    AOR,
    "NSPIRES Username",
  ),
  piPrefix: text("principal_investigator--name--prefix", PI, "Prefix"),
  piFirstName: text(
    "principal_investigator--name--first_name",
    PI,
    "First Name",
  ),
  piLastName: text("principal_investigator--name--last_name", PI, "Last Name"),
  piUsGovernmentParticipation: yesNo(
    "principal_investigator--us_government_participation",
    US_GOVERNMENT_PARTICIPATION,
  ),
  piFederalAgency: {
    selector: "#principal_investigator--federal_agency",
    printTestId: "principal_investigator--federal_agency",
    type: "dropdown",
    section: PI,
    field: "If yes, Select U.S. Government agency",
  },
  piFederalAgencyDollar: text(
    "principal_investigator--federal_agency_dollar",
    PI,
    "If yes, enter total dollar amount requested ($)",
  ),
  piInternationalParticipation: yesNo(
    "principal_investigator--international_participation",
    INTERNATIONAL_PARTICIPATION,
  ),
};

export const NASA_PI_AND_AOR_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName:
    "NASA - Principal Investigator and Authorized Representative Supplemental Data Sheet",
  fields: fieldDefinitionsNasaPIAndAOR,
} as const;

// The validation summary drops a title's "?" before "is required".
const required = (fieldId: string, title: string): FieldError => ({
  fieldId,
  message: `${title.replace("?", "")} is required`,
});

// An empty save leaves out each empty name, so its errors start with the name's title.
export const NASA_PI_AND_AOR_REQUIRED_FIELD_ERRORS: FieldError[] = [
  required("authorized_representative--name--first_name", "Name First Name"),
  required("authorized_representative--name--last_name", "Name Last Name"),
  required("principal_investigator--name--first_name", "Name First Name"),
  required("principal_investigator--name--last_name", "Name Last Name"),
  required(
    "principal_investigator--us_government_participation",
    US_GOVERNMENT_PARTICIPATION,
  ),
  required(
    "principal_investigator--international_participation",
    INTERNATIONAL_PARTICIPATION,
  ),
];
