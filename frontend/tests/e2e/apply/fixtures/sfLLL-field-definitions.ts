import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

export const SFLLL_FORM_MATCHER =
  /SF\s*[-‑–—]?\s*LLL|Disclosure\s+of\s+Lobbying\s+Activities/i;

export const SFLLL_TEST_DATA = {
  federalAction_type: "Grant",
  federalAction_status: "BidOffer",
  federalAction_reportType: "MaterialChange",
  materialChange_year: "2025",
  materialChange_quarter: "1",
  materialChange_lastReportDate: "2025-03-31",
  reportingEntity_type: "Prime",
  reportingEntity_tier: "1",
  reportingEntity_orgName: "Organization Name for test Q4",
  reportingEntity_street1: "Street 1 for test Q4",
  reportingEntity_street2: "Street 2 for test Q4",
  reportingEntity_city: "City for test Q4",
  reportingEntity_state: "AL: Alabama",
  reportingEntity_zip: "11111",
  reportingEntity_district: "AL-001",
  primeEntity_orgName: "Organization for test",
  primeEntity_street1: "Street 1 for test",
  primeEntity_street2: "Street 2 for test",
  primeEntity_city: "City for test",
  primeEntity_state: "VA: Virginia",
  primeEntity_zip: "55555",
  primeEntity_district: "VA-001",
  federalInfo_agencyDepartment: "Federal Department or Agency for test",
  federalInfo_name: "Battlefield Land Acquisition Grants for test",
  federalInfo_assistanceListingNumber: "15.92800000",
  federalInfo_actionNumber: "TES-QC-00-001",
  federalInfo_awardAmount: "9999999",
  lobbyingRegistrant_firstName: "First Name for test 10a",
  lobbyingRegistrant_middleName: "Middle Name for test 10a",
  lobbyingRegistrant_lastName: "Last Name for test 10a",
  lobbyingRegistrant_prefix: "PrefixTest",
  lobbyingRegistrant_suffix: "SuffixTest",
  lobbyingRegistrant_street1: "Street 1 for test Q10a",
  lobbyingRegistrant_street2: "Street 2 for test Q10a",
  lobbyingRegistrant_city: "City for test Q10a",
  lobbyingRegistrant_state: "AK: Alaska",
  lobbyingRegistrant_zip: "55555",
  performingService_firstName: "First Name for test 10b",
  performingService_middleName: "Middle Name for test 10b",
  performingService_lastName: "Last Name for test 10b",
  performingService_prefix: "PrefixTest",
  performingService_suffix: "SuffixTest",
  performingService_street1: "Street 1 for test 10b",
  performingService_street2: "Street 2 for test 10b",
  performingService_city: "City for test 10b",
  performingService_state: "AK: Alaska",
  performingService_zip: "66666",
  signature_prefix: "PrefixTest",
  signature_firstName: "First Name for test Signature",
  signature_middleName: "Middle Name for test Signature",
  signature_lastName: "Last Name for test Signature",
  signature_suffix: "SuffixTest",
  signature_title: "TitleTest",
  signature_phone: "9999999999",
} as const;

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
    fieldId: "reporting_entity--prime_reporting_entity--organization_name",
    message: "Organization Name is required",
  },
  {
    fieldId: "reporting_entity--prime_reporting_entity--address--street1",
    message: "Address Street 1 is required",
  },
  {
    fieldId: "reporting_entity--prime_reporting_entity--address--city",
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
    fieldId: "lobbying_registrant--address--street1",
    message: "Address Street 1 is required",
  },
  {
    fieldId: "lobbying_registrant--address--city",
    message: "Address City is required",
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
    fieldId: "individual_performing_service--address--street1",
    message: "Address Street 1 is required",
  },
  {
    fieldId: "individual_performing_service--address--city",
    message: "Address City is required",
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
