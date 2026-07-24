import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

export const PPSL_FORM_MATCHER = /Project\/Performance\s+Site\s+Location/i;

// maxLength values sourced from:
// api/src/form_schema/forms/project_performance_site_location/1/0/form_json.py
// api/src/form_schema/shared/common_shared.py
// api/src/form_schema/shared/address_shared.py
export const fieldDefinitionsPPSL: FormFillFieldDefinitions = {
  // ********* Primary Site *********
  // primary_site--submitting_as_individual is omitted: it defaults to false (unchecked)
  // which is the correct state for the happy path. Actively setting it to false is
  // unnecessary and the checkboxHandler cannot locate the element by testId.
  //
  // primary_site--uei is omitted: unlike SF-424 where UEI is prepopulated from the
  // user's SAM.gov account, PPSL requires manual entry. Since UEI differs across
  // local and deployed environments and is not a required field, it is excluded here.
  //
  // primary_site--address--province is omitted: only applicable for non-US addresses.
  // The happy path uses USA as the country, so province is never shown or required.
  "primary_site--organization_name": {
    testId: "primary_site--organization_name",
    type: "text",
    maxLength: 60, // common_shared.py.organization_name
    section: "Project/Performance Site Primary Location",
    field: "Organization Name",
  },
  "primary_site--address--street1": {
    testId: "primary_site--address--street1",
    type: "text",
    maxLength: 55, // address_shared.py.street1
    section: "Project/Performance Site Primary Location",
    field: "Street 1",
  },
  "primary_site--address--street2": {
    testId: "primary_site--address--street2",
    type: "text",
    maxLength: 55, // address_shared.py.street2
    section: "Project/Performance Site Primary Location",
    field: "Street 2",
  },
  "primary_site--address--city": {
    testId: "primary_site--address--city",
    type: "text",
    maxLength: 35, // address_shared.py.city
    section: "Project/Performance Site Primary Location",
    field: "City",
  },
  "primary_site--address--county": {
    testId: "primary_site--address--county",
    type: "text",
    maxLength: 35, // address_shared.py.county
    section: "Project/Performance Site Primary Location",
    field: "County",
  },
  "primary_site--address--state": {
    selector: "#primary_site--address--state",
    type: "dropdown",
    section: "Project/Performance Site Primary Location",
    field: "State",
  },
  "primary_site--address--country": {
    selector: "#primary_site--address--country",
    type: "dropdown",
    section: "Project/Performance Site Primary Location",
    field: "Country",
  },
  "primary_site--address--zip_code": {
    testId: "primary_site--address--zip_code",
    type: "text",
    maxLength: 30, // address_shared.py.zip_code
    section: "Project/Performance Site Primary Location",
    field: "Zip Code",
  },
  "primary_site--congressional_district": {
    testId: "primary_site--congressional_district",
    type: "text",
    maxLength: 6, // FORM_JSON_SCHEMA.$defs.primary_site.properties.congressional_district
    section: "Project/Performance Site Primary Location",
    field: "Congressional District",
  },
  // ********* Additional Locations Attachment (optional) *********
  additional_locations_attachment: {
    selector: 'input[name="additional_locations_attachment"][type="file"]',
    type: "file",
    section: "Additional Location(s) Attachment",
    field: "Additional Location(s)",
  },
};

export const PPSL_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: PPSL_FORM_MATCHER,
  fields: fieldDefinitionsPPSL,
} as const;

// Sourced from FORM_JSON_SCHEMA required arrays in form_json.py
export const PPSL_REQUIRED_FIELD_ERRORS: FieldError[] = [
  {
    fieldId: "primary_site--organization_name",
    message: "Organization Name is required",
  },
  {
    fieldId: "primary_site--address--street1",
    message: "Street 1 is required",
  },
  {
    fieldId: "primary_site--address--city",
    message: "City is required",
  },
  {
    fieldId: "primary_site--address--country",
    message: "Country is required",
  },
  {
    fieldId: "primary_site--congressional_district",
    message: "Congressional District is required",
  },
];
