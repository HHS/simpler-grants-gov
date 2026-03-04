import { Page, TestInfo } from "@playwright/test";

import {
  validateAndFillField,
  type FieldDefinition,
} from "tests/e2e/utils/test-validate-and-fill-field-utils";

// Test data for filling the form - modify as needed for different test scenarios
export const ENTITY_DATA = {
  form: {
    name: "Disclosure of Lobbying Activities (SF-LLL)",
  },
  reportingEntity: {
    orgName: "Organization Name for test Q4",
    street1: "Street 1 for test Q4",
    city: "City for test Q4",
    state: "AL: Alabama",
    zip: "11111",
    district: "AL-001",
  },
  primeEntity: {
    orgName: "Organization for test",
    street1: "Street 1 for test",
    city: "City for test",
    state: "NY",
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
    lastName: "Last Name for test 10a",
    street1: "Street 1 for test Q10a",
    city: "City for test 10a",
  },
  performingService: {
    firstName: "First Name for test 10b",
    lastName: "Last Name for test 10b",
    street1: "Street 1 for test 10b",
    city: "City for test 10b",
  },
  signature: {
    firstName: "First Name for test Signature",
    lastName: "Last Name for test Signature",
    title: "TitleTest",
    phone: "9999999999",
  },
};

// ============================================================================
// List of Fields to Validate and Fill from the SF-LLL Form
// ============================================================================

const VALIDATION_FIELDS: FieldDefinition[] = [
  // Federal Action Section
  {
    errorLinkText: "Type of Federal Action is required",
    testId: "#federal_action_type",
    value: "Grant",
    isDropdown: true,
  },
  {
    errorLinkText: "Status of Federal Action is required",
    testId: "#federal_action_status",
    value: "InitialAward",
    isDropdown: true,
  },
  {
    errorLinkText: "Report Type is required",
    testId: "#report_type",
    value: "InitialFiling",
    isDropdown: true,
  },

  // Reporting Entity Section
  {
    errorLinkText: "Entity Type is required",
    testId: "#reporting_entity--entity_type",
    value: "Prime",
    isDropdown: true,
  },
  {
    errorLinkText: "Organization Name is required",
    testId: "reporting_entity--applicant_reporting_entity--organization_name",
    value: ENTITY_DATA.reportingEntity.orgName,
  },
  {
    errorLinkText: "Address Street 1 is required",
    testId: "reporting_entity--applicant_reporting_entity--address--street1",
    value: ENTITY_DATA.reportingEntity.street1,
  },
  {
    errorLinkText: "Address City is required",
    testId: "reporting_entity--applicant_reporting_entity--address--city",
    value: ENTITY_DATA.reportingEntity.city,
  },

  // Prime Recipient Section
  {
    errorLinkText: "Organization Name is required",
    testId: "reporting_entity--prime_reporting_entity--organization_name",
    value: ENTITY_DATA.primeEntity.orgName,
  },
  {
    errorLinkText: "Address Street 1 is required",
    testId: "reporting_entity--prime_reporting_entity--address--street1",
    value: ENTITY_DATA.primeEntity.street1,
  },
  {
    errorLinkText: "Address City is required",
    testId: "reporting_entity--prime_reporting_entity--address--city",
    value: ENTITY_DATA.primeEntity.city,
  },

  // Federal Agency/Department Section
  {
    errorLinkText: "Federal Department/Agency is",
    testId: "federal_agency_department",
    value: ENTITY_DATA.federalInfo.agencyDepartment,
  },

  // Lobbying Registrant Section
  {
    errorLinkText: "Name and Contact Information First Name is required",
    testId: "lobbying_registrant--individual--first_name",
    value: ENTITY_DATA.lobbyingRegistrant.firstName,
  },
  {
    errorLinkText: "Name and Contact Information Last Name is required",
    testId: "lobbying_registrant--individual--last_name",
    value: ENTITY_DATA.lobbyingRegistrant.lastName,
  },
  {
    errorLinkText: "Address Street 1 is required",
    testId: "lobbying_registrant--address--street1",
    value: ENTITY_DATA.lobbyingRegistrant.street1,
  },
  {
    errorLinkText: "City is required",
    testId: "lobbying_registrant--address--city",
    value: ENTITY_DATA.lobbyingRegistrant.city,
  },

  // Individual Performing Service Section
  {
    errorLinkText: "Name and Contact Information First Name is required",
    testId: "individual_performing_service--individual--first_name",
    value: ENTITY_DATA.performingService.firstName,
  },
  {
    errorLinkText: "Name and Contact Information Last Name is required",
    testId: "individual_performing_service--individual--last_name",
    value: ENTITY_DATA.performingService.lastName,
  },
  {
    errorLinkText: "Address Street 1 is required",
    testId: "individual_performing_service--address--street1",
    value: ENTITY_DATA.performingService.street1,
  },
  {
    errorLinkText: "City is required",
    testId: "individual_performing_service--address--city",
    value: ENTITY_DATA.performingService.city,
  },

  // Signature Section
  {
    errorLinkText: "Name and Contact Information First Name is required",
    testId: "signature_block--name--first_name",
    value: ENTITY_DATA.signature.firstName,
  },
  {
    errorLinkText: "Name and Contact Information Last Name is required",
    testId: "signature_block--name--last_name",
    value: ENTITY_DATA.signature.lastName,
  },
];

// ============================================================================
// Main Function to Validate and Fill SF-LLL Form
// ============================================================================

export async function validationSflllFormUtils(
  testInfo: TestInfo,
  page: Page,
): Promise<void> {
  // Wrap the entire process in a try-catch to capture any unexpected errors
  try {
    // Extract ApplicationURL and attach to test report
    const applicationURL = page.url();
    await testInfo.attach("validationSflllFormUtils-applicationURL", {
      body: `Application URL: ${applicationURL}`,
      contentType: "text/plain",
    });

    // Navigate to the SF-LLL form from the application overview page
    await page.getByRole("link", { name: ENTITY_DATA.form.name }).click();

    await page
      .getByText(ENTITY_DATA.form.name)
      .waitFor({ state: "visible", timeout: 35000 });

    // Iterate through each field definition to validate and fill
    for (const field of VALIDATION_FIELDS) {
      await validateAndFillField(testInfo, page, field);
    }

    // Final save to confirm no validation errors remain
    await page
      .getByText("No errors were detected")
      .waitFor({ state: "visible", timeout: 35000 });

    // Navigate back to application overview using applicationURL
    await page.goto(applicationURL);

    // Attach final success info to test report
    await testInfo.attach("validationSflllFormUtils-success", {
      body: "Successfully validated and filled all required fields on the SF-LLL form with no remaining validation errors.",
      contentType: "text/plain",
    });
  } catch (error) {
    // Attach unexpected error info to test report
    await testInfo.attach("validationSflllFormUtils-error", {
      body: error instanceof Error ? error.message : String(error),
      contentType: "text/plain",
    });
    // Rethrow the error to fail the test
    throw error;
  }
}
