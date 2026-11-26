import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

export const SF424_INDIVIDUAL_FORM_MATCHER =
  /Application for Federal Domestic Assistance - Individual/i;

const APPLICANT = "Applicant Information";
const PROJECT = "Project Information";
const CERTIFICATION = "Certification";

const CONTACT = "contacts--point_of_contact";
const ADDRESS = `${CONTACT}--address`;
const CITIZENSHIP = "applicant--person--citizenship";

const text = (
  testId: string,
  section: string,
  field: string,
  maxLength?: number,
) => ({
  testId,
  type: "text" as const,
  section,
  field,
  maxLength,
});

const dropdown = (id: string, section: string, field: string) => ({
  selector: `#${id}`,
  printTestId: id,
  type: "dropdown" as const,
  section,
  field,
});

// maxLength values sourced from:
// api/src/form_schema/forms/sf424_individual_generated/1/0/json_schema.json
export const fieldDefinitionsSF424Individual: FormFillFieldDefinitions = {
  prefix: text(`${CONTACT}--name--prefix`, APPLICANT, "Prefix", 10),
  firstName: text(`${CONTACT}--name--first_name`, APPLICANT, "First Name", 35),
  middleName: text(
    `${CONTACT}--name--middle_name`,
    APPLICANT,
    "Middle Name",
    25,
  ),
  lastName: text(`${CONTACT}--name--last_name`, APPLICANT, "Last Name", 60),
  suffix: text(`${CONTACT}--name--suffix`, APPLICANT, "Suffix", 10),
  phone: text(`${CONTACT}--phone`, APPLICANT, "Phone Number", 25),
  eveningPhone: text(
    `${CONTACT}--evening_phone`,
    APPLICANT,
    "Phone Number (Evening)",
    25,
  ),
  fax: text(`${CONTACT}--fax`, APPLICANT, "Fax Number", 25),
  email: {
    testId: `${CONTACT}--email`,
    type: "email",
    maxLength: 60,
    section: APPLICANT,
    field: "Email",
  },
  street1: text(`${ADDRESS}--street1`, APPLICANT, "Street 1", 55),
  street2: text(`${ADDRESS}--street2`, APPLICANT, "Street 2", 55),
  city: text(`${ADDRESS}--city`, APPLICANT, "City", 35),
  county: text(`${ADDRESS}--county`, APPLICANT, "County/Parish", 30),
  state: dropdown(`${ADDRESS}--state`, APPLICANT, "State"),
  country: dropdown(`${ADDRESS}--country`, APPLICANT, "Country"),
  zipCode: text(`${ADDRESS}--zip_code`, APPLICANT, "Zip / Postal Code", 30),
  // The yes/no question renders one radio per answer, named by the field. A configured
  // selector wins over the fill value, so the definition names the answer to click.
  // Answer No, so the happy path also fills the questions for a non-citizen.
  isUsCitizen: {
    selector: `input[name="${CITIZENSHIP}--is_us_citizen"][value="false"]`,
    printTestId: `${CITIZENSHIP}--is_us_citizen`,
    type: "radiobutton",
    section: APPLICANT,
    field: "U.S. Citizenship",
  },
  alienRegistrationNumber: text(
    `${CITIZENSHIP}--alien_registration_number`,
    APPLICANT,
    "If permanent resident of U.S., enter the Alien Registration #",
    14,
  ),
  citizenshipCountry: dropdown(
    `${CITIZENSHIP}--country`,
    APPLICANT,
    "If foreign national, enter country of citizenship",
  ),
  residencyStartDate: text(
    `${CITIZENSHIP}--residency_start_date`,
    APPLICANT,
    "If foreign national, enter start date of most recent residency in U.S.",
  ),
  congressionalDistrict: text(
    "applicant--congressional_district",
    APPLICANT,
    "Congressional District of Applicant",
    6,
  ),
  projectTitle: text("project--title", PROJECT, "Project Title", 200),
  projectDescription: {
    selector: "#project--description",
    printTestId: "project--description",
    type: "textarea",
    maxLength: 1000,
    section: PROJECT,
    field: "Project Description",
  },
  startDate: text("project--timeline--start_date", PROJECT, "Start Date"),
  endDate: text("project--timeline--end_date", PROJECT, "End Date"),
  agree: {
    selector: 'input[name="certification--agree"]',
    type: "checkbox",
    section: CERTIFICATION,
    field: "I Agree",
  },
};

export const SF424_INDIVIDUAL_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "Application for Federal Domestic Assistance - Individual",
  fields: fieldDefinitionsSF424Individual,
} as const;

const required = (fieldId: string, message: string): FieldError => ({
  fieldId,
  message: `${message} is required`,
});

// An empty save leaves out every section the applicant fills, so each error comes from
// a missing section. A field whose parent has a title (Name, Address, Certification)
// gets that title first. A field's layout label replaces its JSON Schema title.
export const SF424_INDIVIDUAL_REQUIRED_FIELD_ERRORS: FieldError[] = [
  required(`${CONTACT}--name--first_name`, "Name First Name"),
  required(`${CONTACT}--name--last_name`, "Name Last Name"),
  required(`${CONTACT}--phone`, "Phone Number"),
  required(`${CONTACT}--email`, "Email"),
  required(`${ADDRESS}--street1`, "Address Street 1"),
  required(`${ADDRESS}--city`, "Address City"),
  required(`${ADDRESS}--country`, "Address Country"),
  required(`${CITIZENSHIP}--is_us_citizen`, "U.S. Citizenship"),
  required(
    "applicant--congressional_district",
    "Congressional District of Applicant",
  ),
  required("project--title", "Project Title"),
  required("project--description", "Project Description"),
  required("project--timeline--start_date", "Start Date"),
  required("project--timeline--end_date", "End Date"),
  required("certification--agree", "Certification I Agree"),
];
