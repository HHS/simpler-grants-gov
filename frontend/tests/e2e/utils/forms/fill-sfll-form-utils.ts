// ============================================================================
// Function to Fill SFLLL v2.0 Form
// ============================================================================
// This utility function:
// - Clicks the "Disclosure of Lobbying" link on the application overview page
// - Fills out the form with test data
// - Saves it
// - Verifies that the save was successful with no validation errors
//
// Usage:
// import { fillSfllFormUtils } from "tests/e2e/utils/forms/fill-sfll-form-utils";
// await fillSfllFormUtils(testInfo, page);
//
// Modify ENTITY_DATA for custom test data or enhance the function for dynamic scenarios.

import { Page, TestInfo } from "@playwright/test";
import { selectDropdownByValueOrLabel } from "tests/e2e/utils/test-action-utils";
import { safeHelp_safeWaitForLoadState } from "tests/e2e/utils/test-navigation-utils";
import { safeHelp_attachTestSummary } from "tests/e2e/utils/test-report-utils";

// Test data for filling the form - modify as needed for different test scenarios
export const ENTITY_DATA = {
  form: {
    name: "Disclosure of Lobbying",
  },
  federalAction: {
    type: "Grant",
    status: "BidOffer",
    reportType: "MaterialChange",
  },
  materialChange: {
    year: "2025",
    quarter: "1",
    lastReportDate: "2025-03-31",
  },
  reportingEntity: {
    type: "Prime",
    tier: "1",
    orgName: "Organization Name for test Q4",
    street1: "Street 1 for test Q4",
    street2: "Street 2 for test Q4",
    city: "City for test Q4",
    state: "AL: Alabama",
    zip: "11111",
    district: "AL-001",
  },
  primeEntity: {
    orgName: "Organization for test",
    street1: "Street 1 for test",
    street2: "Street 2 for test",
    city: "City for test",
    state: "VA: Virginia",
    zip: "55555",
    district: "VA-001",
  },
  federalInfo: {
    agencyDepartment: "Federal Department or Agency for test",
    programName: "Battlefield Land Acquisition Grants for test",
    assistanceListingNumber: "15.92800000",
    actionNumber: "TES-QC-00-001",
    awardAmount: "9999999",
  },
  lobbyingRegistrant: {
    firstName: "First Name for test 10a",
    middleName: "Middle Name for test 10a",
    lastName: "Last Name for test 10a",
    prefix: "PrefixTest",
    suffix: "SuffixTest",
    street1: "Street 1 for test Q10a",
    street2: "Street 2 for test Q10a",
    city: "City for test Q10a",
    state: "AK: Alaska",
    zip: "55555",
  },
  performingService: {
    firstName: "First Name for test 10b",
    middleName: "Middle Name for test 10b",
    lastName: "Last Name for test 10b",
    prefix: "PrefixTest",
    suffix: "SuffixTest",
    street1: "Street 1 for test 10b",
    street2: "Street 2 for test 10b",
    city: "City for test 10b",
    state: "AK: Alaska",
    zip: "66666",
  },
  signature: {
    prefix: "PrefixTest",
    firstName: "First Name for test Signature",
    middleName: "Middle Name for test Signature",
    lastName: "Last Name for test Signature",
    suffix: "SuffixTest",
    title: "TitleTest",
    phone: "9999999999",
  },
};

// ============================================================================
// Main Function to Fill Form
// ============================================================================

export async function fillSfllFormUtils(
  testInfo: TestInfo,
  page: Page,
): Promise<void> {
  const startTime = new Date();

  try {
    // Click the form link to open it from the application overview page
    await page.getByRole("link", { name: ENTITY_DATA.form.name }).click();
    await safeHelp_safeWaitForLoadState(testInfo, page);

    // Section 1: Type of Federal Action
    await selectDropdownByValueOrLabel(
      page,
      "#federal_action_type",
      ENTITY_DATA.federalAction.type,
    );

    // Section 2: Status of Federal Action
    await selectDropdownByValueOrLabel(
      page,
      "#federal_action_status",
      ENTITY_DATA.federalAction.status,
    );

    // Section 3: Report Type
    await selectDropdownByValueOrLabel(
      page,
      "#report_type",
      ENTITY_DATA.federalAction.reportType,
    );

    // Section 3a: Material Change Details
    await page
      .getByTestId("material_change_year")
      .fill(ENTITY_DATA.materialChange.year);
    await page
      .getByTestId("material_change_quarter")
      .fill(ENTITY_DATA.materialChange.quarter);
    await page
      .getByTestId("last_report_date")
      .fill(ENTITY_DATA.materialChange.lastReportDate);

    // Section 4: Reporting Entity
    await selectDropdownByValueOrLabel(
      page,
      "#reporting_entity--entity_type",
      ENTITY_DATA.reportingEntity.type,
    );
    await page
      .getByTestId("reporting_entity--tier")
      .fill(ENTITY_DATA.reportingEntity.tier);
    await page
      .getByTestId(
        "reporting_entity--applicant_reporting_entity--organization_name",
      )
      .fill(ENTITY_DATA.reportingEntity.orgName);
    await page
      .getByTestId(
        "reporting_entity--applicant_reporting_entity--address--street1",
      )
      .fill(ENTITY_DATA.reportingEntity.street1);
    await page
      .getByTestId(
        "reporting_entity--applicant_reporting_entity--address--street2",
      )
      .fill(ENTITY_DATA.reportingEntity.street2);
    await page
      .getByTestId(
        "reporting_entity--applicant_reporting_entity--address--city",
      )
      .fill(ENTITY_DATA.reportingEntity.city);
    await selectDropdownByValueOrLabel(
      page,
      "#reporting_entity--applicant_reporting_entity--address--state",
      ENTITY_DATA.reportingEntity.state,
    );
    await page
      .getByTestId(
        "reporting_entity--applicant_reporting_entity--address--zip_code",
      )
      .fill(ENTITY_DATA.reportingEntity.zip);
    await page
      .getByTestId(
        "reporting_entity--applicant_reporting_entity--congressional_district",
      )
      .fill(ENTITY_DATA.reportingEntity.district);

    // Section 5: Prime Reporting Entity
    await page
      .getByTestId(
        "reporting_entity--prime_reporting_entity--organization_name",
      )
      .fill(ENTITY_DATA.primeEntity.orgName);
    await page
      .getByTestId("reporting_entity--prime_reporting_entity--address--street1")
      .fill(ENTITY_DATA.primeEntity.street1);
    await page
      .getByTestId("reporting_entity--prime_reporting_entity--address--street2")
      .fill(ENTITY_DATA.primeEntity.street2);
    await page
      .getByTestId("reporting_entity--prime_reporting_entity--address--city")
      .fill(ENTITY_DATA.primeEntity.city);
    await selectDropdownByValueOrLabel(
      page,
      "#reporting_entity--prime_reporting_entity--address--state",
      ENTITY_DATA.primeEntity.state,
    );
    await page
      .getByTestId(
        "reporting_entity--prime_reporting_entity--address--zip_code",
      )
      .fill(ENTITY_DATA.primeEntity.zip);
    await page
      .getByTestId(
        "reporting_entity--prime_reporting_entity--congressional_district",
      )
      .fill(ENTITY_DATA.primeEntity.district);

    // Section 6-9: Federal Information
    await page
      .getByTestId("federal_agency_department")
      .fill(ENTITY_DATA.federalInfo.agencyDepartment);
    await page
      .getByTestId("federal_program_name")
      .fill(ENTITY_DATA.federalInfo.programName);
    await page
      .getByTestId("assistance_listing_number")
      .fill(ENTITY_DATA.federalInfo.assistanceListingNumber);
    await page
      .getByTestId("federal_action_number")
      .fill(ENTITY_DATA.federalInfo.actionNumber);
    await page
      .getByTestId("award_amount")
      .fill(ENTITY_DATA.federalInfo.awardAmount);

    // Section 10a: Lobbying Registrant
    await page
      .getByTestId("lobbying_registrant--individual--first_name")
      .fill(ENTITY_DATA.lobbyingRegistrant.firstName);
    await page
      .getByTestId("lobbying_registrant--individual--middle_name")
      .fill(ENTITY_DATA.lobbyingRegistrant.middleName);
    await page
      .getByTestId("lobbying_registrant--individual--last_name")
      .fill(ENTITY_DATA.lobbyingRegistrant.lastName);
    await page
      .getByTestId("lobbying_registrant--individual--prefix")
      .fill(ENTITY_DATA.lobbyingRegistrant.prefix);
    await page
      .getByTestId("lobbying_registrant--individual--suffix")
      .fill(ENTITY_DATA.lobbyingRegistrant.suffix);
    await page
      .getByTestId("lobbying_registrant--address--street1")
      .fill(ENTITY_DATA.lobbyingRegistrant.street1);
    await page
      .getByTestId("lobbying_registrant--address--street2")
      .fill(ENTITY_DATA.lobbyingRegistrant.street2);
    await page
      .getByTestId("lobbying_registrant--address--city")
      .fill(ENTITY_DATA.lobbyingRegistrant.city);
    await selectDropdownByValueOrLabel(
      page,
      "#lobbying_registrant--address--state",
      ENTITY_DATA.lobbyingRegistrant.state,
    );
    await page
      .getByTestId("lobbying_registrant--address--zip_code")
      .fill(ENTITY_DATA.lobbyingRegistrant.zip);

    // Section 10b: Individual Performing Services
    await page
      .getByTestId("individual_performing_service--individual--first_name")
      .fill(ENTITY_DATA.performingService.firstName);
    await page
      .getByTestId("individual_performing_service--individual--middle_name")
      .fill(ENTITY_DATA.performingService.middleName);
    await page
      .getByTestId("individual_performing_service--individual--last_name")
      .fill(ENTITY_DATA.performingService.lastName);
    await page
      .getByTestId("individual_performing_service--individual--prefix")
      .fill(ENTITY_DATA.performingService.prefix);
    await page
      .getByTestId("individual_performing_service--individual--suffix")
      .fill(ENTITY_DATA.performingService.suffix);
    await page
      .getByTestId("individual_performing_service--address--street1")
      .fill(ENTITY_DATA.performingService.street1);
    await page
      .getByTestId("individual_performing_service--address--street2")
      .fill(ENTITY_DATA.performingService.street2);
    await page
      .getByTestId("individual_performing_service--address--city")
      .fill(ENTITY_DATA.performingService.city);
    await selectDropdownByValueOrLabel(
      page,
      "#individual_performing_service--address--state",
      ENTITY_DATA.performingService.state,
    );
    await page
      .getByTestId("individual_performing_service--address--zip_code")
      .fill(ENTITY_DATA.performingService.zip);

    // Section 11: Signature
    await page
      .getByTestId("signature_block--name--prefix")
      .fill(ENTITY_DATA.signature.prefix);
    await page
      .getByTestId("signature_block--name--first_name")
      .fill(ENTITY_DATA.signature.firstName);
    await page
      .getByTestId("signature_block--name--middle_name")
      .fill(ENTITY_DATA.signature.middleName);
    await page
      .getByTestId("signature_block--name--last_name")
      .fill(ENTITY_DATA.signature.lastName);
    await page
      .getByTestId("signature_block--name--suffix")
      .fill(ENTITY_DATA.signature.suffix);
    await page
      .getByTestId("signature_block--title")
      .fill(ENTITY_DATA.signature.title);
    await page
      .getByTestId("signature_block--telephone")
      .fill(ENTITY_DATA.signature.phone);

    // Click Save Button
    await page.getByTestId("apply-form-save").click();

    // Verify No Validation Errors
    await page
      .getByText("No errors were detected")
      .waitFor({ state: "visible", timeout: 10000 });
  } catch (error) {
    // Attach error to test report instead of console
    await testInfo.attach("fillSfllFormUtils-error", {
      body: error instanceof Error ? error.message : String(error),
      contentType: "text/plain",
    });
    throw error; // Re-throw to ensure test failure is captured
  } finally {
    // Attach test summary with execution time
    await safeHelp_attachTestSummary(testInfo, 0, startTime);
  }
}
