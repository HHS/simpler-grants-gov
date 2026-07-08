import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

export const SFLLL_FORM_MATCHER =
  /SF\s*[-‑–—]?\s*LLL|Disclosure\s+of\s+Lobbying\s+Activities/i;

// maxLength values sourced from:
// api/src/form_schema/forms/sflll/1/0/form_json.py
// api/src/form_schema/shared/common_shared.py
// api/src/form_schema/shared/address_shared.py
export const fieldDefinitionsSFLLL: FormFillFieldDefinitions = {
  federalAction_type: {
    selector: "#federal_action_type",
    type: "dropdown",
    section: "Section 1",
    field: "Type of Federal Action",
  },
  federalAction_status: {
    selector: "#federal_action_status",
    type: "dropdown",
    section: "Section 2",
    field: "Status of Federal Action",
  },
  federalAction_reportType: {
    selector: "#report_type",
    type: "dropdown",
    section: "Section 3",
    field: "Report Type",
  },
  materialChange_year: {
    testId: "material_change_year",
    type: "text",
    maxLength: 4, // FORM_JSON_SCHEMA.properties.material_change_year pattern ^[1-9][0-9]{3}$
    section: "Section 3",
    field: "Material Change Year",
  },
  materialChange_quarter: {
    testId: "material_change_quarter",
    type: "text",
    maxLength: 1, // FORM_JSON_SCHEMA.properties.material_change_quarter minimum: 1, maximum: 4
    section: "Section 3",
    field: "Material Change Quarter",
  },
  materialChange_lastReportDate: {
    testId: "last_report_date",
    type: "text",
    maxLength: 10, // Date format MM/DD/YYYY
    section: "Section 3",
    field: "Last Report Date",
  },
  reportingEntity_type: {
    selector: "#reporting_entity--entity_type",
    type: "dropdown",
    section: "Section 4",
    field: "Entity Type",
  },
  reportingEntity_tier: {
    testId: "reporting_entity--tier",
    type: "text",
    maxLength: 2, // FORM_JSON_SCHEMA.properties.reporting_entity.tier minimum: 1, maximum: 99
    section: "Section 4",
    field: "Tier",
  },
  reportingEntity_orgName: {
    testId: "reporting_entity--applicant_reporting_entity--organization_name",
    type: "text",
    maxLength: 60, // common_shared.py.organization_name
    section: "Section 4",
    field: "Organization Name",
  },
  reportingEntity_street1: {
    testId: "reporting_entity--applicant_reporting_entity--address--street1",
    type: "text",
    maxLength: 55, // address_shared.py.street1
    section: "Section 4",
    field: "Street 1",
  },
  reportingEntity_street2: {
    testId: "reporting_entity--applicant_reporting_entity--address--street2",
    type: "text",
    maxLength: 55, // address_shared.py.street2
    section: "Section 4",
    field: "Street 2",
  },
  reportingEntity_city: {
    testId: "reporting_entity--applicant_reporting_entity--address--city",
    type: "text",
    maxLength: 35, // address_shared.py.city
    section: "Section 4",
    field: "City",
  },
  reportingEntity_state: {
    selector: "#reporting_entity--applicant_reporting_entity--address--state",
    type: "dropdown",
    section: "Section 4",
    field: "State",
  },
  reportingEntity_zip: {
    testId: "reporting_entity--applicant_reporting_entity--address--zip_code",
    type: "text",
    maxLength: 30, // address_shared.py.zip_code
    section: "Section 4",
    field: "Zip Code",
  },
  reportingEntity_district: {
    testId:
      "reporting_entity--applicant_reporting_entity--congressional_district",
    type: "text",
    maxLength: 6, // FORM_JSON_SCHEMA.$defs.reporting_entity_awardee.congressional_district
    section: "Section 4",
    field: "Congressional District",
  },
  primeEntity_orgName: {
    testId: "reporting_entity--prime_reporting_entity--organization_name",
    type: "text",
    maxLength: 60, // common_shared.py.organization_name
    section: "Section 5",
    field: "Prime Organization Name",
  },
  primeEntity_street1: {
    testId: "reporting_entity--prime_reporting_entity--address--street1",
    type: "text",
    maxLength: 55, // address_shared.py.street1
    section: "Section 5",
    field: "Prime Street 1",
  },
  primeEntity_street2: {
    testId: "reporting_entity--prime_reporting_entity--address--street2",
    type: "text",
    maxLength: 55, // address_shared.py.street2
    section: "Section 5",
    field: "Prime Street 2",
  },
  primeEntity_city: {
    testId: "reporting_entity--prime_reporting_entity--address--city",
    type: "text",
    maxLength: 35, // address_shared.py.city
    section: "Section 5",
    field: "Prime City",
  },
  primeEntity_state: {
    selector: "#reporting_entity--prime_reporting_entity--address--state",
    type: "dropdown",
    section: "Section 5",
    field: "Prime State",
  },
  primeEntity_zip: {
    testId: "reporting_entity--prime_reporting_entity--address--zip_code",
    type: "text",
    maxLength: 30, // address_shared.py.zip_code
    section: "Section 5",
    field: "Prime Zip Code",
  },
  primeEntity_district: {
    testId: "reporting_entity--prime_reporting_entity--congressional_district",
    type: "text",
    maxLength: 6, // FORM_JSON_SCHEMA.$defs.reporting_entity_awardee.congressional_district
    section: "Section 5",
    field: "Prime Congressional District",
  },
  federalInfo_agencyDepartment: {
    testId: "federal_agency_department",
    type: "text",
    maxLength: 40, // FORM_JSON_SCHEMA.properties.federal_agency_department
    section: "Section 6",
    field: "Federal Agency/Department",
  },
  federalInfo_name: {
    testId: "federal_program_name",
    type: "text",
    maxLength: 120, // FORM_JSON_SCHEMA.properties.federal_program_name
    section: "Section 7",
    field: "Federal Program Name",
  },
  federalInfo_assistanceListingNumber: {
    testId: "assistance_listing_number",
    type: "text",
    maxLength: 120, // FORM_JSON_SCHEMA.properties.assistance_listing_number
    section: "Section 7",
    field: "Assistance Listing Number",
  },
  federalInfo_actionNumber: {
    testId: "federal_action_number",
    type: "text",
    maxLength: 120, // FORM_JSON_SCHEMA.properties.federal_action_number
    section: "Section 8",
    field: "Federal Action Number",
  },
  federalInfo_awardAmount: {
    testId: "award_amount",
    type: "text",
    maxLength: 14, // common_shared.py.budget_monetary_amount
    section: "Section 9",
    field: "Award Amount",
  },
  lobbyingRegistrant_firstName: {
    testId: "lobbying_registrant--individual--first_name",
    type: "text",
    maxLength: 35, // common_shared.py.person_name.first_name
    section: "Section 10a",
    field: "First Name",
  },
  lobbyingRegistrant_middleName: {
    testId: "lobbying_registrant--individual--middle_name",
    type: "text",
    maxLength: 25, // common_shared.py.person_name.middle_name
    section: "Section 10a",
    field: "Middle Name",
  },
  lobbyingRegistrant_lastName: {
    testId: "lobbying_registrant--individual--last_name",
    type: "text",
    maxLength: 60, // common_shared.py.person_name.last_name
    section: "Section 10a",
    field: "Last Name",
  },
  lobbyingRegistrant_prefix: {
    testId: "lobbying_registrant--individual--prefix",
    type: "text",
    maxLength: 10, // common_shared.py.person_name.prefix
    section: "Section 10a",
    field: "Prefix",
  },
  lobbyingRegistrant_suffix: {
    testId: "lobbying_registrant--individual--suffix",
    type: "text",
    maxLength: 10, // common_shared.py.person_name.suffix
    section: "Section 10a",
    field: "Suffix",
  },
  lobbyingRegistrant_street1: {
    testId: "lobbying_registrant--address--street1",
    type: "text",
    maxLength: 55, // address_shared.py.street1
    section: "Section 10a",
    field: "Street 1",
  },
  lobbyingRegistrant_street2: {
    testId: "lobbying_registrant--address--street2",
    type: "text",
    maxLength: 55, // address_shared.py.street2
    section: "Section 10a",
    field: "Street 2",
  },
  lobbyingRegistrant_city: {
    testId: "lobbying_registrant--address--city",
    type: "text",
    maxLength: 35, // address_shared.py.city
    section: "Section 10a",
    field: "City",
  },
  lobbyingRegistrant_state: {
    selector: "#lobbying_registrant--address--state",
    type: "dropdown",
    section: "Section 10a",
    field: "State",
  },
  lobbyingRegistrant_zip: {
    testId: "lobbying_registrant--address--zip_code",
    type: "text",
    maxLength: 30, // address_shared.py.zip_code
    section: "Section 10a",
    field: "Zip Code",
  },
  performingService_firstName: {
    testId: "individual_performing_service--individual--first_name",
    type: "text",
    maxLength: 35, // common_shared.py.person_name.first_name
    section: "Section 10b",
    field: "First Name",
  },
  performingService_middleName: {
    testId: "individual_performing_service--individual--middle_name",
    type: "text",
    maxLength: 25, // common_shared.py.person_name.middle_name
    section: "Section 10b",
    field: "Middle Name",
  },
  performingService_lastName: {
    testId: "individual_performing_service--individual--last_name",
    type: "text",
    maxLength: 60, // common_shared.py.person_name.last_name
    section: "Section 10b",
    field: "Last Name",
  },
  performingService_prefix: {
    testId: "individual_performing_service--individual--prefix",
    type: "text",
    maxLength: 10, // common_shared.py.person_name.prefix
    section: "Section 10b",
    field: "Prefix",
  },
  performingService_suffix: {
    testId: "individual_performing_service--individual--suffix",
    type: "text",
    maxLength: 10, // common_shared.py.person_name.suffix
    section: "Section 10b",
    field: "Suffix",
  },
  performingService_street1: {
    testId: "individual_performing_service--address--street1",
    type: "text",
    maxLength: 55, // address_shared.py.street1
    section: "Section 10b",
    field: "Street 1",
  },
  performingService_street2: {
    testId: "individual_performing_service--address--street2",
    type: "text",
    maxLength: 55, // address_shared.py.street2
    section: "Section 10b",
    field: "Street 2",
  },
  performingService_city: {
    testId: "individual_performing_service--address--city",
    type: "text",
    maxLength: 35, // address_shared.py.city
    section: "Section 10b",
    field: "City",
  },
  performingService_state: {
    selector: "#individual_performing_service--address--state",
    type: "dropdown",
    section: "Section 10b",
    field: "State",
  },
  performingService_zip: {
    testId: "individual_performing_service--address--zip_code",
    type: "text",
    maxLength: 30, // address_shared.py.zip_code
    section: "Section 10b",
    field: "Zip Code",
  },
  signature_prefix: {
    testId: "signature_block--name--prefix",
    type: "text",
    maxLength: 10, // common_shared.py.person_name.prefix
    section: "Section 11",
    field: "Prefix",
  },
  signature_firstName: {
    testId: "signature_block--name--first_name",
    type: "text",
    maxLength: 35, // common_shared.py.person_name.first_name
    section: "Section 11",
    field: "First Name",
  },
  signature_middleName: {
    testId: "signature_block--name--middle_name",
    type: "text",
    maxLength: 25, // common_shared.py.person_name.middle_name
    section: "Section 11",
    field: "Middle Name",
  },
  signature_lastName: {
    testId: "signature_block--name--last_name",
    type: "text",
    maxLength: 60, // common_shared.py.person_name.last_name
    section: "Section 11",
    field: "Last Name",
  },
  signature_suffix: {
    testId: "signature_block--name--suffix",
    type: "text",
    maxLength: 10, // common_shared.py.person_name.suffix
    section: "Section 11",
    field: "Suffix",
  },
  signature_title: {
    testId: "signature_block--title",
    type: "text",
    maxLength: 45, // common_shared.py.contact_person_title
    section: "Section 11",
    field: "Title",
  },
  signature_phone: {
    testId: "signature_block--telephone",
    type: "text",
    maxLength: 25, // common_shared.py.phone_number
    section: "Section 11",
    field: "Telephone",
  },
};

export const SFLLL_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: SFLLL_FORM_MATCHER,
  fields: fieldDefinitionsSFLLL,
} as const;

// Required field validation errors for SF-LLL
// Sourced from FORM_JSON_SCHEMA.required and nested required arrays in form_json.py
export const SFLLL_REQUIRED_FIELD_ERRORS: FieldError[] = [
  {
    fieldId: "federal_action_type",
    message: "Type of Federal Action is required",
  },
  {
    fieldId: "federal_action_status",
    message: "Status of Federal Action is required",
  },
  { fieldId: "report_type", message: "Report Type is required" },
  {
    fieldId: "reporting_entity--entity_type",
    message: "Entity Type is required",
  },
  {
    fieldId: "reporting_entity--applicant_reporting_entity--organization_name",
    message: "Organization Name is required",
  },
  {
    fieldId: "reporting_entity--applicant_reporting_entity--address--street1",
    message: "Address Street 1 is required",
  },
  {
    fieldId: "reporting_entity--applicant_reporting_entity--address--city",
    message: "Address City is required",
  },
  {
    fieldId: "federal_agency_department",
    message: "Federal Department/Agency is required",
  },
  {
    fieldId: "lobbying_registrant--individual--first_name",
    message: "Name and Contact Information First Name is required",
  },
  {
    fieldId: "lobbying_registrant--individual--last_name",
    message: "Name and Contact Information Last Name is required",
  },
  {
    fieldId: "individual_performing_service--individual--first_name",
    message: "Name and Contact Information First Name is required",
  },
  {
    fieldId: "individual_performing_service--individual--last_name",
    message: "Name and Contact Information Last Name is required",
  },
  {
    fieldId: "signature_block--name--first_name",
    message: "Name and Contact Information First Name is required",
  },
  {
    fieldId: "signature_block--name--last_name",
    message: "Name and Contact Information Last Name is required",
  },
];
