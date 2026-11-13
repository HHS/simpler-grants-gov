import type { SFLLL_FORM_CONFIG } from "tests/e2e/apply/fixtures/sfLLL-field-definitions";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";
import { toHappyPathSuffix } from "tests/e2e/utils/submission/print-view-utils";

/**
 * Happy-path test data builder for the SF-LLL form.
 * Generates unique values using a numeric suffix to prevent collisions across runs.
 * Short suffixes keep dynamic values within field max lengths.
 */
export const buildSFLLLHappyPathTestData = (
  suffix: number,
): Record<string, string> => {
  const shortSuffix = toHappyPathSuffix(suffix);

  return {
    // Section 1 - Type of Federal Action
    federalAction_type: "Grant",
    // Section 2 - Status of Federal Action
    federalAction_status: "BidOffer",
    // Section 3 - Report Type
    federalAction_reportType: "MaterialChange",
    materialChange_year: "2025",
    materialChange_quarter: "1",
    materialChange_lastReportDate: "2025-03-31",
    // Section 4 - Reporting Entity
    reportingEntity_type: "Prime",
    reportingEntity_tier: "1",
    reportingEntity_orgName: `ReportOrg ${shortSuffix}`,
    reportingEntity_street1: `${shortSuffix} Report St`,
    reportingEntity_street2: `ReportingSuite ${shortSuffix}`,
    reportingEntity_city: `ReportingCity ${shortSuffix}`,
    reportingEntity_state: "AL: Alabama",
    reportingEntity_zip: "11111",
    reportingEntity_district: "AL-001",
    // Section 5 - Prime Entity
    primeEntity_orgName: `PrimeOrg ${shortSuffix}`,
    primeEntity_street1: `${shortSuffix} Prime St`,
    primeEntity_street2: `PrimeSuite ${shortSuffix}`,
    primeEntity_city: `PrimeCity ${shortSuffix}`,
    primeEntity_state: "VA: Virginia",
    primeEntity_zip: "44444",
    primeEntity_district: "VA-001",
    // Section 6 - Federal Agency/Department
    federalInfo_agencyDepartment: `FedDept ${shortSuffix}`,
    // Section 7 - Federal Program Name / Assistance Listing
    // NOT included: both are read-only and pre-populated from the opportunity.
    // They are checked through expectedPrepopulatedFields instead.
    // Section 8 - Federal Action Number
    federalInfo_actionNumber: `ACT-${shortSuffix}`,
    // Section 9 - Award Amount
    federalInfo_awardAmount: "9999999",
    // Section 10a - Lobbying Registrant
    lobbyingRegistrant_prefix: `LP${shortSuffix}`,
    lobbyingRegistrant_firstName: `LRFirst${shortSuffix}`,
    lobbyingRegistrant_middleName: `LRMid${shortSuffix}`,
    lobbyingRegistrant_lastName: `LRLast${shortSuffix}`,
    lobbyingRegistrant_suffix: `LRS${shortSuffix}`,
    lobbyingRegistrant_street1: `${shortSuffix} Lobby St`,
    lobbyingRegistrant_street2: `LobbyApt ${shortSuffix}`,
    lobbyingRegistrant_city: `LobbyCity ${shortSuffix}`,
    lobbyingRegistrant_state: "AK: Alaska",
    lobbyingRegistrant_zip: "55555",
    // Section 10b - Individual Performing Service
    performingService_prefix: `PP${shortSuffix}`,
    performingService_firstName: `PSFirst${shortSuffix}`,
    performingService_middleName: `PSMid${shortSuffix}`,
    performingService_lastName: `PSLast${shortSuffix}`,
    performingService_suffix: `PSS${shortSuffix}`,
    performingService_street1: `${shortSuffix} Service St`,
    performingService_street2: `ServiceUnit ${shortSuffix}`,
    performingService_city: `ServiceCity ${shortSuffix}`,
    performingService_state: "AK: Alaska",
    performingService_zip: "66666",
    // Section 11 - Signature Block
    signature_prefix: `SP${shortSuffix}`,
    signature_firstName: `SigFirst${shortSuffix}`,
    signature_middleName: `SigMid${shortSuffix}`,
    signature_lastName: `SigLast${shortSuffix}`,
    signature_suffix: `SS${shortSuffix}`,
    signature_title: `SigTitle${shortSuffix}`,
    signature_phone: "9999999999",
  } satisfies Partial<Record<keyof typeof SFLLL_FORM_CONFIG.fields, string>>;
};

/** API map_values transform: ReportEntityIsPrime ("Prime" → "Y: Yes", "SubAwardee" → "N: No"). */
const xmlReportEntityIsPrime = (value: string): string =>
  value === "Prime" ? "Y: Yes" : "N: No";

/**
 * Contains opportunity metadata, expected prepopulated field values, and the form-specific test data builder.
 * Imported by load-opportunity-config.ts to build the opportunity registry.
 */
export const SFLLL_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "f3e438ee-ff4c-475b-a058-8049aee9abda",
  opportunityNumber: "E2E-SFLLL-ORG-IND-01",
  formKey: "sfLLL",
  expectedPrepopulatedFields: {
    // Section 7 - Federal Program Name / Assistance Listing (testIds must match form)
    assistance_listing_number: "10.960",
    federal_program_name: "Technical Agricultural Assistance",
  },
  buildTestData: buildSFLLLHappyPathTestData,
  // What the submission zip spec verifies per field (XML element and/or PDF text).
  // signature and signed_date are system post-populated; the spec supplies their values.
  submissionFields: {
    federalAction_type: { xmlElement: "SFLLL_2_0:FederalActionType" },
    federalAction_status: { xmlElement: "SFLLL_2_0:FederalActionStatus" },
    federalAction_reportType: { xmlElement: "SFLLL_2_0:ReportType" },
    materialChange_year: { xmlElement: "SFLLL_2_0:MaterialChangeYear" },
    materialChange_quarter: { xmlElement: "SFLLL_2_0:MaterialChangeQuarter" },
    materialChange_lastReportDate: { xmlElement: "SFLLL_2_0:LastReportDate" },
    reportingEntity_type: {
      xmlElement: "SFLLL_2_0:ReportEntityIsPrime",
      xmlTransform: xmlReportEntityIsPrime,
    },
    reportingEntity_tier: { xmlElement: "SFLLL_2_0:TierValue" },
    reportingEntity_orgName: {
      xmlElement: "SFLLL_2_0:OrganizationName",
      verifyInPdf: true,
    },
    reportingEntity_street1: {
      xmlElement: "SFLLL_2_0:Street1",
      verifyInPdf: true,
    },
    reportingEntity_street2: {
      xmlElement: "SFLLL_2_0:Street2",
      verifyInPdf: true,
    },
    reportingEntity_city: { xmlElement: "SFLLL_2_0:City", verifyInPdf: true },
    reportingEntity_state: { xmlElement: "SFLLL_2_0:State" },
    reportingEntity_zip: { xmlElement: "SFLLL_2_0:ZipPostalCode" },
    reportingEntity_district: { xmlElement: "SFLLL_2_0:CongressionalDistrict" },
    primeEntity_orgName: {
      xmlElement: "SFLLL_2_0:OrganizationName",
      verifyInPdf: true,
    },
    primeEntity_street1: { xmlElement: "SFLLL_2_0:Street1", verifyInPdf: true },
    primeEntity_street2: { xmlElement: "SFLLL_2_0:Street2", verifyInPdf: true },
    primeEntity_city: { xmlElement: "SFLLL_2_0:City", verifyInPdf: true },
    primeEntity_state: { xmlElement: "SFLLL_2_0:State" },
    primeEntity_zip: { xmlElement: "SFLLL_2_0:ZipPostalCode" },
    primeEntity_district: { xmlElement: "SFLLL_2_0:CongressionalDistrict" },
    federalInfo_agencyDepartment: {
      xmlElement: "SFLLL_2_0:FederalAgencyDepartment",
      verifyInPdf: true,
    },
    federal_program_name: { xmlElement: "SFLLL_2_0:FederalProgramName" },
    assistance_listing_number: { xmlElement: "SFLLL_2_0:CFDANumber" },
    federalInfo_actionNumber: {
      xmlElement: "SFLLL_2_0:FederalActionNumber",
      verifyInPdf: true,
    },
    federalInfo_awardAmount: { xmlElement: "SFLLL_2_0:AwardAmount" },
    lobbyingRegistrant_prefix: { xmlElement: "globLib:PrefixName" },
    lobbyingRegistrant_firstName: {
      xmlElement: "globLib:FirstName",
      verifyInPdf: true,
    },
    lobbyingRegistrant_middleName: { xmlElement: "globLib:MiddleName" },
    lobbyingRegistrant_lastName: {
      xmlElement: "globLib:LastName",
      verifyInPdf: true,
    },
    lobbyingRegistrant_suffix: { xmlElement: "globLib:SuffixName" },
    lobbyingRegistrant_street1: {
      xmlElement: "SFLLL_2_0:Street1",
      verifyInPdf: true,
    },
    lobbyingRegistrant_street2: {
      xmlElement: "SFLLL_2_0:Street2",
      verifyInPdf: true,
    },
    lobbyingRegistrant_city: {
      xmlElement: "SFLLL_2_0:City",
      verifyInPdf: true,
    },
    lobbyingRegistrant_state: { xmlElement: "SFLLL_2_0:State" },
    lobbyingRegistrant_zip: { xmlElement: "SFLLL_2_0:ZipPostalCode" },
    performingService_prefix: { xmlElement: "globLib:PrefixName" },
    performingService_firstName: {
      xmlElement: "globLib:FirstName",
      verifyInPdf: true,
    },
    performingService_middleName: { xmlElement: "globLib:MiddleName" },
    performingService_lastName: {
      xmlElement: "globLib:LastName",
      verifyInPdf: true,
    },
    performingService_suffix: { xmlElement: "globLib:SuffixName" },
    performingService_street1: {
      xmlElement: "SFLLL_2_0:Street1",
      verifyInPdf: true,
    },
    performingService_street2: {
      xmlElement: "SFLLL_2_0:Street2",
      verifyInPdf: true,
    },
    performingService_city: { xmlElement: "SFLLL_2_0:City", verifyInPdf: true },
    performingService_state: { xmlElement: "SFLLL_2_0:State" },
    performingService_zip: { xmlElement: "SFLLL_2_0:ZipPostalCode" },
    signature_prefix: { xmlElement: "globLib:PrefixName" },
    signature_firstName: { xmlElement: "globLib:FirstName", verifyInPdf: true },
    signature_middleName: { xmlElement: "globLib:MiddleName" },
    signature_lastName: { xmlElement: "globLib:LastName", verifyInPdf: true },
    signature_suffix: { xmlElement: "globLib:SuffixName" },
    signature_title: { xmlElement: "SFLLL_2_0:Title", verifyInPdf: true },
    signature_phone: { xmlElement: "SFLLL_2_0:Telephone" },
    signature: { xmlElement: "SFLLL_2_0:Signature" },
    signed_date: { xmlElement: "SFLLL_2_0:SignedDate" },
  },
};
