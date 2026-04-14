import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

export const EPA4700_4_FORM_MATCHER = "^EPA\\s+Form\\s+4700-4(?:\\s+.*)?$";

export const fieldDefinitionsEPA47004: FormFillFieldDefinitions = {
  applicant_name: {
    testId: "applicant_name",
    type: "text",
    section: "Applicant Information",
    field: "Applicant Name",
  },
  applicant_address__address: {
    testId: "applicant_address--address",
    type: "text",
    section: "Applicant Information",
    field: "Address",
  },
  applicant_address__city: {
    testId: "applicant_address--city",
    type: "text",
    section: "Applicant Information",
    field: "City",
  },
  applicant_address__state: {
    selector: "#applicant_address--state",
    type: "dropdown",
    section: "Applicant Information",
    field: "State",
  },
  applicant_address__zip_code: {
    testId: "applicant_address--zip_code",
    type: "text",
    section: "Applicant Information",
    field: "ZIP Code",
  },
  point_of_contact_name: {
    testId: "point_of_contact_name",
    type: "text",
    section: "Point of Contact",
    field: "Name",
  },
  point_of_contact_phone_number: {
    testId: "point_of_contact_phone_number",
    type: "text",
    section: "Point of Contact",
    field: "Phone Number",
  },
  point_of_contact_email: {
    testId: "point_of_contact_email",
    type: "text",
    section: "Point of Contact",
    field: "Email",
  },
  point_of_contact_title: {
    testId: "point_of_contact_title",
    type: "text",
    section: "Point of Contact",
    field: "Title",
  },
  applicant_signature_aor_title: {
    testId: "applicant_signature--aor_title",
    type: "text",
    section: "Authorized Official's Title",
    field: "Title",
  },
} as const;

export const EPA4700_4_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "EPA Form 4700-4",
  fields: fieldDefinitionsEPA47004,
} as const;

export const EPA4700_4_REQUIRED_FIELD_ERRORS: FieldError[] = [
  { fieldId: "applicant_name", message: "Name is required" },
  {
    fieldId: "applicant_address--address",
    message: "Address is required",
  },
  { fieldId: "applicant_address--city", message: "City is required" },
  { fieldId: "applicant_address--state", message: "State is required" },
  {
    fieldId: "applicant_address--zip_code",
    message: "Zip / Postal Code is required",
  },
  { fieldId: "point_of_contact_name", message: "Name is required" },
  {
    fieldId: "point_of_contact_phone_number",
    message: "Phone is required",
  },
  { fieldId: "point_of_contact_email", message: "Email is required" },
  { fieldId: "point_of_contact_title", message: "Title is required" },
  {
    fieldId: "applicant_signature--aor_title",
    message: "B. Title of Authorized Official is required",
  },
];
