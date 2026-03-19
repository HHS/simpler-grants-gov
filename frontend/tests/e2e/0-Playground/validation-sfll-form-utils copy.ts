// /**
//  * Validation utilities for SF-LLL (Disclosure of Lobbying Activities) form
//  * 
//  * This module provides utilities to test form validation by:
//  * - Triggering validation errors on required fields
//  * - Verifying error messages are displayed correctly
//  * - Filling fields one by one to resolve errors
//  * - Confirming all validation errors are cleared
//  */

// import { Page, TestInfo } from "@playwright/test";
// // import { safeHelp_safeWaitForLoadState } from "tests/e2e/utils/test-navigation-utils";
// import { safeHelp_attachTestSummary } from "tests/e2e/utils/test-report-utils";

// /**
//  * Test data for SF-LLL form validation
//  */
// export const ENTITY_DATA = {
//   form: {
//     name: "Disclosure of Lobbying Activities (SF-LLL)",
//   },
//   reportingEntity: {
//     orgName: "Organization Name for test Q4",
//     street1: "Street 1 for test Q4",
//     city: "City for test Q4",
//     state: "AL: Alabama",
//     zip: "11111",
//     district: "AL-001",
//   },
//   primeEntity: {
//     orgName: "Organization for test",
//     street1: "Street 1 for test",
//     city: "City for test",
//     state: "NY",
//     zip: "55555",
//     district: "VA-001",
//   },
//   federalInfo: {
//     agencyDepartment: "Federal Department or Agency for test",
//     programName: "Battlefield Land Acquisition Grants for test",
//     assistanceListingNumber: "15.92800000",
//     actionNumber: "TES-QC-00-001",
//     awardAmount: "9999999",
//   },
//   lobbyingRegistrant: {
//     firstName: "First Name for test 10a",
//     lastName: "Last Name for test 10a",
//     street1: "Street 1 for test Q10a",
//   },
//   performingService: {
//     firstName: "First Name for test 10b",
//     lastName: "Last Name for test 10b",
//     street1: "Street 1 for test 10b",
//   },
//   signature: {
//     firstName: "First Name for test Signature",
//     lastName: "Last Name for test Signature",
//     title: "TitleTest",
//     phone: "9999999999",
//   },
// };

// /**
//  * Field definition for validation testing
//  */
// interface FieldDefinition {
//   errorLinkText: string;
//   testId: string;
//   value: string;
//   isDropdown?: boolean;
// }

// /**
//  * Helper function to validate and fill a single field
//  */
// async function validateAndFillField(
//   page: Page,
//   field: FieldDefinition
// ): Promise<void> {
//   // Trigger validation by saving
//   await page.getByTestId("apply-form-save").click();
  
//   // Click the error link to navigate to the field
//   await page.getByRole('link', { name: field.errorLinkText }).click();
  
//   // Wait a moment for any scroll/focus animations
//   await page.waitForTimeout(500);
  
//   // Fill or select the field value
//   const fieldLocator = page.getByTestId(field.testId);
  
//   if (field.isDropdown) {
//     await fieldLocator.selectOption(field.value);
//   } else {
//     await fieldLocator.fill(field.value);
//   }
  
//   // Save the form to clear the error
//   await page.getByTestId("apply-form-save").click();
// }

// /**
//  * Field configurations for validation testing
//  */
// const VALIDATION_FIELDS: FieldDefinition[] = [
//   // Federal Action Section
//   {
//     errorLinkText: "Type of Federal Action is required",
//     testId: "federal_action_type",
//     value: "Grant",
//     isDropdown: true,
//   },
//   {
//     errorLinkText: "Status of Federal Action is required",
//     testId: "federal_action_status",
//     value: "InitialAward",
//     isDropdown: true,
//   },
//   {
//     errorLinkText: "Report Type is required",
//     testId: "report_type",
//     value: "InitialFiling",
//     isDropdown: true,
//   },
  
//   // Reporting Entity Section
//   {
//     errorLinkText: "Entity Type is required",
//     testId: "reporting_entity--entity_type",
//     value: "Prime",
//     isDropdown: true,
//   },
//   {
//     errorLinkText: "Organization Name is required",
//     testId: "reporting_entity--applicant_reporting_entity--organization_name",
//     value: ENTITY_DATA.reportingEntity.orgName,
//   },
//   {
//     errorLinkText: "Address Street 1 is required",
//     testId: "reporting_entity--applicant_reporting_entity--address--street1",
//     value: ENTITY_DATA.reportingEntity.street1,
//   },
//   {
//     errorLinkText: "Address City is required",
//     testId: "reporting_entity--applicant_reporting_entity--address--city",
//     value: ENTITY_DATA.reportingEntity.city,
//   },
//   {
//     errorLinkText: "Address State is required",
//     testId: "reporting_entity--applicant_reporting_entity--address--state",
//     value: ENTITY_DATA.reportingEntity.state,
//     isDropdown: true,
//   },
//   {
//     errorLinkText: "Address Zip Code is required",
//     testId: "reporting_entity--applicant_reporting_entity--address--zip_code",
//     value: ENTITY_DATA.reportingEntity.zip,
//   },
//   {
//     errorLinkText: "Congressional District is required",
//     testId: "reporting_entity--applicant_reporting_entity--congressional_district",
//     value: ENTITY_DATA.reportingEntity.district,
//   },
  
//   // Prime Entity Section
//   {
//     errorLinkText: "Prime Organization Name is required",
//     testId: "reporting_entity--prime_reporting_entity--organization_name",
//     value: ENTITY_DATA.primeEntity.orgName,
//   },
//   {
//     errorLinkText: "Prime Address Street 1 is required",
//     testId: "reporting_entity--prime_reporting_entity--address--street1",
//     value: ENTITY_DATA.primeEntity.street1,
//   },
//   {
//     errorLinkText: "Address City is required",
//     testId: "reporting_entity--prime_reporting_entity--address--city",
//     value: ENTITY_DATA.primeEntity.city,
//   },
//   {
//     errorLinkText: "Address State is required",
//     testId: "reporting_entity--prime_reporting_entity--address--state",
//     value: ENTITY_DATA.primeEntity.state,
//     isDropdown: true,
//   },
//   {
//     errorLinkText: "Address Zip Code is required",
//     testId: "reporting_entity--prime_reporting_entity--address--zip_code",
//     value: ENTITY_DATA.primeEntity.zip,
//   },
//   {
//     errorLinkText: "Congressional District is required",
//     testId: "reporting_entity--prime_reporting_entity--congressional_district",
//     value: ENTITY_DATA.primeEntity.district,
//   },
  
//   // Federal Information Section
//   {
//     errorLinkText: "Federal Department/Agency is required",
//     testId: "federal_agency_department",
//     value: ENTITY_DATA.federalInfo.agencyDepartment,
//   },
//   {
//     errorLinkText: "Federal Program Name is required",
//     testId: "federal_program_name",
//     value: ENTITY_DATA.federalInfo.programName,
//   },
//   {
//     errorLinkText: "Assistance Listing Number is required",
//     testId: "assistance_listing_number",
//     value: ENTITY_DATA.federalInfo.assistanceListingNumber,
//   },
//   {
//     errorLinkText: "Federal Action Number is required",
//     testId: "federal_action_number",
//     value: ENTITY_DATA.federalInfo.actionNumber,
//   },
//   {
//     errorLinkText: "Award Amount is required",
//     testId: "award_amount",
//     value: ENTITY_DATA.federalInfo.awardAmount,
//   },
  
//   // Lobbying Registrant Section
//   {
//     errorLinkText: "Lobbying Registrant First Name is required",
//     testId: "lobbying_registrant--individual--first_name",
//     value: ENTITY_DATA.lobbyingRegistrant.firstName,
//   },
//   {
//     errorLinkText: "Lobbying Registrant Last Name is required",
//     testId: "lobbying_registrant--individual--last_name",
//     value: ENTITY_DATA.lobbyingRegistrant.lastName,
//   },
//   {
//     errorLinkText: "Lobbying Registrant Address Street 1 is required",
//     testId: "lobbying_registrant--address--street1",
//     value: ENTITY_DATA.lobbyingRegistrant.street1,
//   },
  
//   // Individual Performing Services Section
//   {
//     errorLinkText: "Individual Performing Services First Name is required",
//     testId: "individual_performing_service--individual--first_name",
//     value: ENTITY_DATA.performingService.firstName,
//   },
//   {
//     errorLinkText: "Individual Performing Services Last Name is required",
//     testId: "individual_performing_service--individual--last_name",
//     value: ENTITY_DATA.performingService.lastName,
//   },
//   {
//     errorLinkText: "Individual Performing Services Address Street 1 is required",
//     testId: "individual_performing_service--address--street1",
//     value: ENTITY_DATA.performingService.street1,
//   },
  
//   // Signature Section
//   {
//     errorLinkText: "Signature First Name is required",
//     testId: "signature_block--name--first_name",
//     value: ENTITY_DATA.signature.firstName,
//   },
//   {
//     errorLinkText: "Signature Last Name is required",
//     testId: "signature_block--name--last_name",
//     value: ENTITY_DATA.signature.lastName,
//   },
//   {
//     errorLinkText: "Signature Title is required",
//     testId: "signature_block--title",
//     value: ENTITY_DATA.signature.title,
//   },
//   {
//     errorLinkText: "Signature Telephone is required",
//     testId: "signature_block--telephone",
//     value: ENTITY_DATA.signature.phone,
//   },
// ];

// /**
//  * Main function to validate SF-LLL form
//  * 
//  * This function tests the form validation by:
//  * 1. Opening the SF-LLL form
//  * 2. Iterating through each required field
//  * 3. Triggering validation errors and filling fields sequentially
//  * 4. Verifying all errors are resolved at the end
//  */
// export async function validationSflllFormUtils(
//   testInfo: TestInfo,
//   page: Page
// ): Promise<void> {
//   const startTime = new Date();

//   try {
//     // Navigate to the SF-LLL form
//     await page.getByRole("link", { name: ENTITY_DATA.form.name }).click();
//     // await safeHelp_safeWaitForLoadState(testInfo, page);

//     // Validate and fill each required field sequentially
//     for (const field of VALIDATION_FIELDS) {
//       await validateAndFillField(page, field);
//     }

//     // Verify that all validation errors have been resolved
//     await page
//       .getByText("No errors were detected")
//       .waitFor({ state: "visible", timeout: 10000 });
//   } catch (error) {
//     await testInfo.attach("validationSflllFormUtils-error", {
//       body: error instanceof Error ? error.message : String(error),
//       contentType: "text/plain",
//     });
//     throw error;
//   } finally {
//     await safeHelp_attachTestSummary(testInfo, 0, startTime);
//   }
// }

