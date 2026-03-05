import { Page, TestInfo } from "@playwright/test";
import {
  fillField,
  FillFieldDefinition,
} from "tests/e2e/utils/form-fill-utils";

// Test data for filling the form - modify as needed for different test scenarios
export const ENTITY_DATA = {
  form: {
    name: "Disclosure of Lobbying Activities (SF-LLL)",
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
// Field Definitions for Form Filling
// ============================================================================
// Note: FillFieldDefinition interface is defined in test-form-fill-utls.ts

const FILL_FIELDS: FillFieldDefinition[] = [
  // Section 1: Type of Federal Action
  {
    selector: "#federal_action_type",
    value: ENTITY_DATA.federalAction.type,
    type: "dropdown",
    section: "Section 1: Type of Federal Action",
  },

  // Section 2: Status of Federal Action
  {
    selector: "#federal_action_status",
    value: ENTITY_DATA.federalAction.status,
    type: "dropdown",
    section: "Section 2: Status of Federal Action",
  },

  // Section 3: Report Type
  {
    selector: "#report_type",
    value: ENTITY_DATA.federalAction.reportType,
    type: "dropdown",
    section: "Section 3: Report Type",
  },

  // Section 3a: Material Change Details
  {
    testId: "material_change_year",
    value: ENTITY_DATA.materialChange.year,
    type: "text",
    section: "Section 3: Material Change Year",
  },
  {
    testId: "material_change_quarter",
    value: ENTITY_DATA.materialChange.quarter,
    type: "text",
    section: "Section 3: Material Change Quarter",
  },
  {
    testId: "last_report_date",
    value: ENTITY_DATA.materialChange.lastReportDate,
    type: "text",
    section: "Section 3: Last Report Date",
  },

  // Section 4: Reporting Entity
  {
    selector: "#reporting_entity--entity_type",
    value: ENTITY_DATA.reportingEntity.type,
    type: "dropdown",
    section: "Section 4: Entity Type",
  },
  {
    testId: "reporting_entity--tier",
    value: ENTITY_DATA.reportingEntity.tier,
    type: "text",
    section: "Section 4: Tier",
  },
  {
    testId: "reporting_entity--applicant_reporting_entity--organization_name",
    value: ENTITY_DATA.reportingEntity.orgName,
    type: "text",
    section: "Section 4: Organization Name",
  },
  {
    testId: "reporting_entity--applicant_reporting_entity--address--street1",
    value: ENTITY_DATA.reportingEntity.street1,
    type: "text",
    section: "Section 4: Street 1",
  },
  {
    testId: "reporting_entity--applicant_reporting_entity--address--street2",
    value: ENTITY_DATA.reportingEntity.street2,
    type: "text",
    section: "Section 4: Street 2",
  },
  {
    testId: "reporting_entity--applicant_reporting_entity--address--city",
    value: ENTITY_DATA.reportingEntity.city,
    type: "text",
    section: "Section 4: City",
  },
  {
    selector: "#reporting_entity--applicant_reporting_entity--address--state",
    value: ENTITY_DATA.reportingEntity.state,
    type: "dropdown",
    section: "Section 4: State",
  },
  {
    testId: "reporting_entity--applicant_reporting_entity--address--zip_code",
    value: ENTITY_DATA.reportingEntity.zip,
    type: "text",
    section: "Section 4: Zip Code",
  },
  {
    testId:
      "reporting_entity--applicant_reporting_entity--congressional_district",
    value: ENTITY_DATA.reportingEntity.district,
    type: "text",
    section: "Section 4: Congressional District",
  },

  // Section 5: Prime Reporting Entity
  {
    testId: "reporting_entity--prime_reporting_entity--organization_name",
    value: ENTITY_DATA.primeEntity.orgName,
    type: "text",
    section: "Section 5: Prime Organization Name",
  },
  {
    testId: "reporting_entity--prime_reporting_entity--address--street1",
    value: ENTITY_DATA.primeEntity.street1,
    type: "text",
    section: "Section 5: Prime Street 1",
  },
  {
    testId: "reporting_entity--prime_reporting_entity--address--street2",
    value: ENTITY_DATA.primeEntity.street2,
    type: "text",
    section: "Section 5: Prime Street 2",
  },
  {
    testId: "reporting_entity--prime_reporting_entity--address--city",
    value: ENTITY_DATA.primeEntity.city,
    type: "text",
    section: "Section 5: Prime City",
  },
  {
    selector: "#reporting_entity--prime_reporting_entity--address--state",
    value: ENTITY_DATA.primeEntity.state,
    type: "dropdown",
    section: "Section 5: Prime State",
  },
  {
    testId: "reporting_entity--prime_reporting_entity--address--zip_code",
    value: ENTITY_DATA.primeEntity.zip,
    type: "text",
    section: "Section 5: Prime Zip Code",
  },
  {
    testId: "reporting_entity--prime_reporting_entity--congressional_district",
    value: ENTITY_DATA.primeEntity.district,
    type: "text",
    section: "Section 5: Prime Congressional District",
  },

  // Section 6-9: Federal Information
  {
    testId: "federal_agency_department",
    value: ENTITY_DATA.federalInfo.agencyDepartment,
    type: "text",
    section: "Section 6: Federal Agency/Department",
  },
  {
    testId: "federal_program_name",
    value: ENTITY_DATA.federalInfo.programName,
    type: "text",
    section: "Section 7: Federal Program Name",
  },
  {
    testId: "assistance_listing_number",
    value: ENTITY_DATA.federalInfo.assistanceListingNumber,
    type: "text",
    section: "Section 7: Assistance Listing Number",
  },
  {
    testId: "federal_action_number",
    value: ENTITY_DATA.federalInfo.actionNumber,
    type: "text",
    section: "Section 8: Federal Action Number",
  },
  {
    testId: "award_amount",
    value: ENTITY_DATA.federalInfo.awardAmount,
    type: "text",
    section: "Section 9: Award Amount",
  },

  // Section 10a: Lobbying Registrant
  {
    testId: "lobbying_registrant--individual--first_name",
    value: ENTITY_DATA.lobbyingRegistrant.firstName,
    type: "text",
    section: "Section 10a: First Name",
  },
  {
    testId: "lobbying_registrant--individual--middle_name",
    value: ENTITY_DATA.lobbyingRegistrant.middleName,
    type: "text",
    section: "Section 10a: Middle Name",
  },
  {
    testId: "lobbying_registrant--individual--last_name",
    value: ENTITY_DATA.lobbyingRegistrant.lastName,
    type: "text",
    section: "Section 10a: Last Name",
  },
  {
    testId: "lobbying_registrant--individual--prefix",
    value: ENTITY_DATA.lobbyingRegistrant.prefix,
    type: "text",
    section: "Section 10a: Prefix",
  },
  {
    testId: "lobbying_registrant--individual--suffix",
    value: ENTITY_DATA.lobbyingRegistrant.suffix,
    type: "text",
    section: "Section 10a: Suffix",
  },
  {
    testId: "lobbying_registrant--address--street1",
    value: ENTITY_DATA.lobbyingRegistrant.street1,
    type: "text",
    section: "Section 10a: Street 1",
  },
  {
    testId: "lobbying_registrant--address--street2",
    value: ENTITY_DATA.lobbyingRegistrant.street2,
    type: "text",
    section: "Section 10a: Street 2",
  },
  {
    testId: "lobbying_registrant--address--city",
    value: ENTITY_DATA.lobbyingRegistrant.city,
    type: "text",
    section: "Section 10a: City",
  },
  {
    selector: "#lobbying_registrant--address--state",
    value: ENTITY_DATA.lobbyingRegistrant.state,
    type: "dropdown",
    section: "Section 10a: State",
  },
  {
    testId: "lobbying_registrant--address--zip_code",
    value: ENTITY_DATA.lobbyingRegistrant.zip,
    type: "text",
    section: "Section 10a: Zip Code",
  },

  // Section 10b: Individual Performing Services
  {
    testId: "individual_performing_service--individual--first_name",
    value: ENTITY_DATA.performingService.firstName,
    type: "text",
    section: "Section 10b: First Name",
  },
  {
    testId: "individual_performing_service--individual--middle_name",
    value: ENTITY_DATA.performingService.middleName,
    type: "text",
    section: "Section 10b: Middle Name",
  },
  {
    testId: "individual_performing_service--individual--last_name",
    value: ENTITY_DATA.performingService.lastName,
    type: "text",
    section: "Section 10b: Last Name",
  },
  {
    testId: "individual_performing_service--individual--prefix",
    value: ENTITY_DATA.performingService.prefix,
    type: "text",
    section: "Section 10b: Prefix",
  },
  {
    testId: "individual_performing_service--individual--suffix",
    value: ENTITY_DATA.performingService.suffix,
    type: "text",
    section: "Section 10b: Suffix",
  },
  {
    testId: "individual_performing_service--address--street1",
    value: ENTITY_DATA.performingService.street1,
    type: "text",
    section: "Section 10b: Street 1",
  },
  {
    testId: "individual_performing_service--address--street2",
    value: ENTITY_DATA.performingService.street2,
    type: "text",
    section: "Section 10b: Street 2",
  },
  {
    testId: "individual_performing_service--address--city",
    value: ENTITY_DATA.performingService.city,
    type: "text",
    section: "Section 10b: City",
  },
  {
    selector: "#individual_performing_service--address--state",
    value: ENTITY_DATA.performingService.state,
    type: "dropdown",
    section: "Section 10b: State",
  },
  {
    testId: "individual_performing_service--address--zip_code",
    value: ENTITY_DATA.performingService.zip,
    type: "text",
    section: "Section 10b: Zip Code",
  },

  // Section 11: Signature
  {
    testId: "signature_block--name--prefix",
    value: ENTITY_DATA.signature.prefix,
    type: "text",
    section: "Section 11: Prefix",
  },
  {
    testId: "signature_block--name--first_name",
    value: ENTITY_DATA.signature.firstName,
    type: "text",
    section: "Section 11: First Name",
  },
  {
    testId: "signature_block--name--middle_name",
    value: ENTITY_DATA.signature.middleName,
    type: "text",
    section: "Section 11: Middle Name",
  },
  {
    testId: "signature_block--name--last_name",
    value: ENTITY_DATA.signature.lastName,
    type: "text",
    section: "Section 11: Last Name",
  },
  {
    testId: "signature_block--name--suffix",
    value: ENTITY_DATA.signature.suffix,
    type: "text",
    section: "Section 11: Suffix",
  },
  {
    testId: "signature_block--title",
    value: ENTITY_DATA.signature.title,
    type: "text",
    section: "Section 11: Title",
  },
  {
    testId: "signature_block--telephone",
    value: ENTITY_DATA.signature.phone,
    type: "text",
    section: "Section 11: Telephone",
  },
];

// ============================================================================
// Main Function to Fill Form
// ============================================================================

export async function fillSflllForm(
  testInfo: TestInfo,
  page: Page,
): Promise<void> {
  // Wrap the entire process in a try-catch to capture any unexpected errors
  try {
    // Extract ApplicationURL and attach to test report
    const applicationURL = page.url();
    await testInfo.attach("fillSflllForm-applicationURL", {
      body: `Application URL: ${applicationURL}`,
      contentType: "text/plain",
    });

    // Navigate to the SF-LLL form from the application overview page
    await page.getByRole("link", { name: ENTITY_DATA.form.name }).click();

    // Wait for form to fully load with increased timeout for stability
    // Use .first() to avoid strict mode violation when form name appears in history
    await page
      .getByText(ENTITY_DATA.form.name)
      .first()
      .waitFor({ state: "visible", timeout: 35000 });

    // Fill all fields using the field definitions array
    for (const field of FILL_FIELDS) {
      await fillField(testInfo, page, field);
    }

    // Add small delay to allow form to stabilize after all entries
    await page.waitForTimeout(500);

    // Click Save Button
    await page.getByTestId("apply-form-save").click();

    // Verify No Validation Errors
    await page
      .getByText("No errors were detected")
      .waitFor({ state: "visible", timeout: 10000 });

    // Navigate back to application overview using applicationURL
    await page.goto(applicationURL);
  } catch (error) {
    // Attach error to test report instead of console
    await testInfo.attach("fillSflllForm-error", {
      body: error instanceof Error ? error.message : String(error),
      contentType: "text/plain",
    });
    throw error;
  }
}
