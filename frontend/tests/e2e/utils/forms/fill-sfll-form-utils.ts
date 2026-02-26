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

import { expect, Page, TestInfo } from "@playwright/test";
import {
  safeHelp_attachTestSummary,
  safeHelp_clickButton,
  safeHelp_fillFieldsByTestId,
  safeHelp_GotoForm,
  safeHelp_safeExpect,
  safeHelp_safeStep,
  safeHelp_safeWaitForLoadState,
  safeHelp_selectDropdownLocator,
  safeHelp_ValidateTextAtLocator,
} from "tests/e2e/utils/safe-fail-utils";

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
  const goToForm = safeHelp_GotoForm(testInfo, page);

  try {
    // Navigate to Form
    await goToForm(ENTITY_DATA.form.name);
    await safeHelp_safeWaitForLoadState(testInfo, page);

    // Fill form fields
    await safeHelp_safeStep(testInfo, "Fill form fields", async () => {
      // Section 1: Type of Federal Action
      await safeHelp_selectDropdownLocator(
        testInfo,
        page,
        "#federal_action_type",
        ENTITY_DATA.federalAction.type,
      );
      // Section 2: Status of Federal Action
      await safeHelp_selectDropdownLocator(
        testInfo,
        page,
        "#federal_action_status",
        ENTITY_DATA.federalAction.status,
      );
      // Section 3: Report Type
      await safeHelp_selectDropdownLocator(
        testInfo,
        page,
        "#report_type",
        ENTITY_DATA.federalAction.reportType,
      );
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: "material_change_year", value: "2025" },
        { testId: "material_change_quarter", value: "1" },
        { testId: "last_report_date", value: "2025-03-31" },
      ]);
      // Section 4: Reporting Entity
      await safeHelp_selectDropdownLocator(
        testInfo,
        page,
        "#reporting_entity--entity_type",
        ENTITY_DATA.reportingEntity.type,
      );
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        {
          testId: "reporting_entity--tier",
          value: ENTITY_DATA.reportingEntity.tier,
        },
        {
          testId:
            "reporting_entity--applicant_reporting_entity--organization_name",
          value: ENTITY_DATA.reportingEntity.orgName,
        },
        {
          testId:
            "reporting_entity--applicant_reporting_entity--address--street1",
          value: ENTITY_DATA.reportingEntity.street1,
        },
        {
          testId:
            "reporting_entity--applicant_reporting_entity--address--street2",
          value: ENTITY_DATA.reportingEntity.street2,
        },
        {
          testId: "reporting_entity--applicant_reporting_entity--address--city",
          value: ENTITY_DATA.reportingEntity.city,
        },
      ]);
      await safeHelp_selectDropdownLocator(
        testInfo,
        page,
        "#reporting_entity--applicant_reporting_entity--address--state",
        ENTITY_DATA.reportingEntity.state,
      );
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        {
          testId:
            "reporting_entity--applicant_reporting_entity--address--zip_code",
          value: ENTITY_DATA.reportingEntity.zip,
        },
        {
          testId:
            "reporting_entity--applicant_reporting_entity--congressional_district",
          value: ENTITY_DATA.reportingEntity.district,
        },
      ]);
      // Section 5: Prime Reporting Entity
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        {
          testId: "reporting_entity--prime_reporting_entity--organization_name",
          value: ENTITY_DATA.primeEntity.orgName,
        },
        {
          testId: "reporting_entity--prime_reporting_entity--address--street1",
          value: ENTITY_DATA.primeEntity.street1,
        },
        {
          testId: "reporting_entity--prime_reporting_entity--address--street2",
          value: ENTITY_DATA.primeEntity.street2,
        },
        {
          testId: "reporting_entity--prime_reporting_entity--address--city",
          value: ENTITY_DATA.primeEntity.city,
        },
      ]);
      await safeHelp_selectDropdownLocator(
        testInfo,
        page,
        "#reporting_entity--prime_reporting_entity--address--state",
        ENTITY_DATA.primeEntity.state,
      );
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        {
          testId: "reporting_entity--prime_reporting_entity--address--zip_code",
          value: ENTITY_DATA.primeEntity.zip,
        },
        {
          testId:
            "reporting_entity--prime_reporting_entity--congressional_district",
          value: ENTITY_DATA.primeEntity.district,
        },
      ]);
      // Section 6-9: Federal Information
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        {
          testId: "federal_agency_department",
          value: ENTITY_DATA.federalInfo.agencyDepartment,
        },
        {
          testId: "federal_program_name",
          value: ENTITY_DATA.federalInfo.programName,
        },
        {
          testId: "assistance_listing_number",
          value: ENTITY_DATA.federalInfo.assistanceListingNumber,
        },
        {
          testId: "federal_action_number",
          value: ENTITY_DATA.federalInfo.actionNumber,
        },
        { testId: "award_amount", value: ENTITY_DATA.federalInfo.awardAmount },
      ]);
      // Section 10a: Lobbying Registrant
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        {
          testId: "lobbying_registrant--individual--first_name",
          value: ENTITY_DATA.lobbyingRegistrant.firstName,
        },
        {
          testId: "lobbying_registrant--individual--middle_name",
          value: ENTITY_DATA.lobbyingRegistrant.middleName,
        },
        {
          testId: "lobbying_registrant--individual--last_name",
          value: ENTITY_DATA.lobbyingRegistrant.lastName,
        },
        {
          testId: "lobbying_registrant--individual--prefix",
          value: ENTITY_DATA.lobbyingRegistrant.prefix,
        },
        {
          testId: "lobbying_registrant--individual--suffix",
          value: ENTITY_DATA.lobbyingRegistrant.suffix,
        },
        {
          testId: "lobbying_registrant--address--street1",
          value: ENTITY_DATA.lobbyingRegistrant.street1,
        },
        {
          testId: "lobbying_registrant--address--street2",
          value: ENTITY_DATA.lobbyingRegistrant.street2,
        },
        {
          testId: "lobbying_registrant--address--city",
          value: ENTITY_DATA.lobbyingRegistrant.city,
        },
      ]);
      await safeHelp_selectDropdownLocator(
        testInfo,
        page,
        "#lobbying_registrant--address--state",
        ENTITY_DATA.lobbyingRegistrant.state,
      );
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        {
          testId: "lobbying_registrant--address--zip_code",
          value: ENTITY_DATA.lobbyingRegistrant.zip,
        },
      ]);
      // Section 10b: Individual Performing Services
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        {
          testId: "individual_performing_service--individual--first_name",
          value: ENTITY_DATA.performingService.firstName,
        },
        {
          testId: "individual_performing_service--individual--middle_name",
          value: ENTITY_DATA.performingService.middleName,
        },
        {
          testId: "individual_performing_service--individual--last_name",
          value: ENTITY_DATA.performingService.lastName,
        },
        {
          testId: "individual_performing_service--individual--prefix",
          value: ENTITY_DATA.performingService.prefix,
        },
        {
          testId: "individual_performing_service--individual--suffix",
          value: ENTITY_DATA.performingService.suffix,
        },
        {
          testId: "individual_performing_service--address--street1",
          value: ENTITY_DATA.performingService.street1,
        },
        {
          testId: "individual_performing_service--address--street2",
          value: ENTITY_DATA.performingService.street2,
        },
        {
          testId: "individual_performing_service--address--city",
          value: ENTITY_DATA.performingService.city,
        },
      ]);
      await safeHelp_selectDropdownLocator(
        testInfo,
        page,
        "#individual_performing_service--address--state",
        ENTITY_DATA.performingService.state,
      );
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        {
          testId: "individual_performing_service--address--zip_code",
          value: ENTITY_DATA.performingService.zip,
        },
      ]);
      // Section 11: Signature
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        {
          testId: "signature_block--name--prefix",
          value: ENTITY_DATA.signature.prefix,
        },
        {
          testId: "signature_block--name--first_name",
          value: ENTITY_DATA.signature.firstName,
        },
        {
          testId: "signature_block--name--middle_name",
          value: ENTITY_DATA.signature.middleName,
        },
        {
          testId: "signature_block--name--last_name",
          value: ENTITY_DATA.signature.lastName,
        },
        {
          testId: "signature_block--name--suffix",
          value: ENTITY_DATA.signature.suffix,
        },
        {
          testId: "signature_block--title",
          value: ENTITY_DATA.signature.title,
        },
        {
          testId: "signature_block--telephone",
          value: ENTITY_DATA.signature.phone,
        },
      ]);
    });

    // Save the form
    await safeHelp_clickButton(testInfo, page, "save form", "apply-form-save");

    // Verify save was successful with no validation errors
    await safeHelp_ValidateTextAtLocator(
      testInfo,
      page.locator("#alert"),
      "Verify no validation alerts",
    );
    await safeHelp_safeExpect(
      testInfo,
      async () =>
        expect(page.getByTestId("alert").getByRole("heading")).toContainText(
          "Form was saved",
        ),
      "Verify save success message",
    );
    await safeHelp_safeExpect(
      testInfo,
      async () =>
        expect(page.getByTestId("alert").getByRole("paragraph")).toContainText(
          "No errors were detected.",
        ),
      "Verify no errors message",
    );
  } finally {
    // Attach test summary with execution time and any relevant information for debugging
    await safeHelp_attachTestSummary(testInfo, 0, startTime);
  }
}
