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
    reportingEntity_street2: `Suite ${shortSuffix}`,
    reportingEntity_city: `City ${shortSuffix}`,
    reportingEntity_state: "AL: Alabama",
    reportingEntity_zip: "11111",
    reportingEntity_district: "AL-001",
    // Section 5 - Prime Entity
    primeEntity_orgName: `PrimeOrg ${shortSuffix}`,
    primeEntity_street1: `${shortSuffix} Prime St`,
    primeEntity_street2: `Suite ${shortSuffix}`,
    primeEntity_city: `City ${shortSuffix}`,
    primeEntity_state: "VA: Virginia",
    primeEntity_zip: "44444",
    primeEntity_district: "VA-001",
    // Section 6 - Federal Agency/Department
    federalInfo_agencyDepartment: `FedDept ${shortSuffix}`,
    // Section 7 - Federal Program Name / Assistance Listing (prepopulated from opportunity)
    federalInfo_name: "Technical Agricultural Assistance",
    federalInfo_assistanceListingNumber: "10.960",
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
    lobbyingRegistrant_street2: `Apt ${shortSuffix}`,
    lobbyingRegistrant_city: `City ${shortSuffix}`,
    lobbyingRegistrant_state: "AK: Alaska",
    lobbyingRegistrant_zip: "55555",
    // Section 10b - Individual Performing Service
    performingService_prefix: `PP${shortSuffix}`,
    performingService_firstName: `PSFirst${shortSuffix}`,
    performingService_middleName: `PSMid${shortSuffix}`,
    performingService_lastName: `PSLast${shortSuffix}`,
    performingService_suffix: `PSS${shortSuffix}`,
    performingService_street1: `${shortSuffix} Service St`,
    performingService_street2: `Unit ${shortSuffix}`,
    performingService_city: `City ${shortSuffix}`,
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
};
