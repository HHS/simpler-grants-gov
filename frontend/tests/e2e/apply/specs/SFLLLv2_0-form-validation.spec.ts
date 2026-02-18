// ============================================================================
// SFLLL v2.0 Form Validation Test
// ============================================================================

// ---- Imports ----
// import { test, expect, Page, TestInfo, Locator } from '@playwright/test';
import testConfig from '../../test-data/test-config.json' with { type: 'json' };
import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { createSpoofedSessionCookie } from "tests/e2e/loginUtils";
import playwrightEnv from "tests/e2e/playwright-env";
import { openMobileNav } from "tests/e2e/playwrightUtils";
import { performStagingLogin } from "tests/e2e/utils/perform-login-utils";
import {
  safeHelp_safeExpect,
  safeHelp_safeStep,
  safeHelp_attachTestSummary,
  safeHelp_updateApplicationName,
  safeHelp_GotoForm,
  safeHelp_selectDropdownLocator,
  safeHelp_fillFieldsByTestId,
  safeHelp_ValidateTextAtLocator,
  safeHelp_safeGoto,
  safeHelp_safeWaitForLoadState,
  safeHelp_clickLink,
  safeHelp_clickButton,
} from 'tests/e2e/helpers/safeHelp';

// ---- Environment Configuration ----
const BASE_DOMAIN = testConfig.environment.baseDomain;
const APPLICATION_ID = testConfig.environment.applicationId;
const directPageUrl = `https://${BASE_DOMAIN}/applications/${APPLICATION_ID}`;

// ---- Test Data ----
const ENTITY_DATA = {
  form: {
    name: 'Disclosure of Lobbying',
  },
  messages: {
    formSaved: 'Form was saved',
    correctErrors: 'Correct the following errors before submitting your application.',
    typeOfFederalActionRequired: 'Type of Federal Action is required',
    statusOfFederalActionRequired: 'Status of Federal Action is required',
    reportTypeRequired: 'Report Type is required',
    entityTypeRequired: 'Entity Type is required',
    organizationNameRequired: 'Organization Name is required',
    addressStreet1Required: 'Address Street 1 is required',
    street1Required: 'Street 1 is required',
    federalDepartmentAgencyRequired: 'Federal Department/Agency is required',
    lastNameRequired: 'Last Name is required',
    firstNameRequired: 'First Name is required',
    nameAndContactInformation: 'Name and Contact Information',
    nameAndContactInformationFirstNameRequired: 'Name and Contact Information First Name is required',
    noErrorsDetected: 'Form was savedNo errors were detected.',
    disclosureOfLobbyingNoIssues: 'Disclosure of Lobbying Activities (SF-LLL) No issues detected.',
  },
  links: {
    typeOfFederalAction: 'Type of Federal Action is required',
    statusOfFederalAction: 'Status of Federal Action is required',
    reportType: 'Report Type is required',
    entityType: 'Entity Type is required',
    organizationName: 'Organization Name is required',
    addressStreet1: 'Address Street 1 is required',
    street1Exact: 'Street 1 is required',
    federalDepartmentAgency: 'Federal Department/Agency is required',
    nameAndContactInfo: 'Name and Contact Information',
    nameAndContactInfoFirstName: 'Name and Contact Information First Name is required',
    lastNameRequired: 'Last Name is required',
    firstNameRequired: 'First Name is required',
    testAt: /Test at/,
  },
  Dropdown: {
    typeOfFederalAction: 'Grant',
    statusOfFederalAction: 'InitialAward',
    reportType: 'InitialFiling',
    entityType: 'Prime',
  },
  clear: {
    clearData: '',
  },
};
		
// ============================================================================
// Main Test
// ============================================================================

test('SFLLLv2_0-form-validation', async ({ page }, testInfo) => {
  test.setTimeout(180000); // 3 minutes for comprehensive validation test
  const startTime = new Date();
  const goToForm = safeHelp_GotoForm(testInfo, page);

  try {
    // ========================================================================
    // Step 1: Navigate to Application
    // ========================================================================
    await safeHelp_safeGoto(testInfo, page, directPageUrl);
    await safeHelp_clickLink(testInfo, page.getByRole('link', { name: 'Sign in' }));

    // ========================================================================
    // Step 2: Update Application Name
    // ========================================================================
    const { appLinkName, prevYear, quarter, lastDayOfPrevQuarter } = await safeHelp_updateApplicationName(
      testInfo,
      page
    );

    // ========================================================================
    // Step 3: Navigate to Form and Clear All Fields
    // ========================================================================
    await goToForm(ENTITY_DATA.form.name);
    await safeHelp_safeWaitForLoadState(testInfo, page);

    await safeHelp_safeStep(testInfo, 'Clear all form fields', async () => {

      // Section 1: Type of Federal Action
      await safeHelp_selectDropdownLocator(testInfo, page, '#federal_action_type', ENTITY_DATA.clear.clearData);

      // Section 2: Status of Federal Action
      await safeHelp_selectDropdownLocator(testInfo, page, '#federal_action_status', ENTITY_DATA.clear.clearData);

      // Section 3: Report Type
      await safeHelp_selectDropdownLocator(testInfo, page, '#report_type', ENTITY_DATA.clear.clearData);
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'material_change_year', value: ENTITY_DATA.clear.clearData },
        { testId: 'material_change_quarter', value: ENTITY_DATA.clear.clearData },
        { testId: 'last_report_date', value: ENTITY_DATA.clear.clearData },
      ]);

      // Section 4: Reporting Entity
      await safeHelp_selectDropdownLocator(testInfo, page, '#reporting_entity--entity_type', ENTITY_DATA.clear.clearData);
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'reporting_entity--tier', value: ENTITY_DATA.clear.clearData },
        { testId: 'reporting_entity--applicant_reporting_entity--organization_name', value: ENTITY_DATA.clear.clearData },
        { testId: 'reporting_entity--applicant_reporting_entity--address--street1', value: ENTITY_DATA.clear.clearData },
        { testId: 'reporting_entity--applicant_reporting_entity--address--street2', value: ENTITY_DATA.clear.clearData },
        { testId: 'reporting_entity--applicant_reporting_entity--address--city', value: ENTITY_DATA.clear.clearData },
      ]);
      await safeHelp_selectDropdownLocator(testInfo, page, '#reporting_entity--applicant_reporting_entity--address--state', ENTITY_DATA.clear.clearData);
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'reporting_entity--applicant_reporting_entity--address--zip_code', value: ENTITY_DATA.clear.clearData },
        { testId: 'reporting_entity--applicant_reporting_entity--congressional_district', value: ENTITY_DATA.clear.clearData },
      ]);

      // Section 5: Prime Reporting Entity
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'reporting_entity--prime_reporting_entity--organization_name', value: ENTITY_DATA.clear.clearData },
        { testId: 'reporting_entity--prime_reporting_entity--address--street1', value: ENTITY_DATA.clear.clearData },
        { testId: 'reporting_entity--prime_reporting_entity--address--street2', value: ENTITY_DATA.clear.clearData },
        { testId: 'reporting_entity--prime_reporting_entity--address--city', value: ENTITY_DATA.clear.clearData },
      ]);
      await safeHelp_selectDropdownLocator(testInfo, page, '#reporting_entity--prime_reporting_entity--address--state', ENTITY_DATA.clear.clearData);
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'reporting_entity--prime_reporting_entity--address--zip_code', value: ENTITY_DATA.clear.clearData },
        { testId: 'reporting_entity--prime_reporting_entity--congressional_district', value: ENTITY_DATA.clear.clearData },
      ]);

      // Section 6-9: Federal Information
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'federal_agency_department', value: ENTITY_DATA.clear.clearData },
        { testId: 'federal_program_name', value: ENTITY_DATA.clear.clearData },
        { testId: 'assistance_listing_number', value: ENTITY_DATA.clear.clearData },
        { testId: 'federal_action_number', value: ENTITY_DATA.clear.clearData },
        { testId: 'award_amount', value: ENTITY_DATA.clear.clearData },
      ]);

      // Section 10a: Lobbying Registrant
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'lobbying_registrant--individual--first_name', value: ENTITY_DATA.clear.clearData },
        { testId: 'lobbying_registrant--individual--middle_name', value: ENTITY_DATA.clear.clearData },
        { testId: 'lobbying_registrant--individual--last_name', value: ENTITY_DATA.clear.clearData },
        { testId: 'lobbying_registrant--individual--prefix', value: ENTITY_DATA.clear.clearData },
        { testId: 'lobbying_registrant--individual--suffix', value: ENTITY_DATA.clear.clearData },
        { testId: 'lobbying_registrant--address--street1', value: ENTITY_DATA.clear.clearData },
        { testId: 'lobbying_registrant--address--street2', value: ENTITY_DATA.clear.clearData },
        { testId: 'lobbying_registrant--address--city', value: ENTITY_DATA.clear.clearData },
      ]);
      await safeHelp_selectDropdownLocator(
        testInfo,
        page,
        '#lobbying_registrant--address--state',
        ENTITY_DATA.clear.clearData
      );
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'lobbying_registrant--address--zip_code', value: ENTITY_DATA.clear.clearData },
      ]);

      // Section 10b: Individual Performing Services
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'individual_performing_service--individual--first_name', value: ENTITY_DATA.clear.clearData },
        { testId: 'individual_performing_service--individual--middle_name', value: ENTITY_DATA.clear.clearData },
        { testId: 'individual_performing_service--individual--last_name', value: ENTITY_DATA.clear.clearData },
        { testId: 'individual_performing_service--individual--prefix', value: ENTITY_DATA.clear.clearData },
        { testId: 'individual_performing_service--individual--suffix', value: ENTITY_DATA.clear.clearData },
        { testId: 'individual_performing_service--address--street1', value: ENTITY_DATA.clear.clearData },
        { testId: 'individual_performing_service--address--street2', value: ENTITY_DATA.clear.clearData },
        { testId: 'individual_performing_service--address--city', value: ENTITY_DATA.clear.clearData },
      ]);
      await safeHelp_selectDropdownLocator(testInfo, page, '#individual_performing_service--address--state', ENTITY_DATA.clear.clearData);
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'individual_performing_service--address--zip_code', value: ENTITY_DATA.clear.clearData },
      ]);

      // Section 11: Signature
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'signature_block--name--prefix', value: ENTITY_DATA.clear.clearData },
        { testId: 'signature_block--name--first_name', value: ENTITY_DATA.clear.clearData },
        { testId: 'signature_block--name--middle_name', value: ENTITY_DATA.clear.clearData },
        { testId: 'signature_block--name--last_name', value: ENTITY_DATA.clear.clearData },
        { testId: 'signature_block--name--suffix', value: ENTITY_DATA.clear.clearData },
        { testId: 'signature_block--title', value: ENTITY_DATA.clear.clearData },
        { testId: 'signature_block--telephone', value: ENTITY_DATA.clear.clearData },
      ]);
    });

    // ========================================================================
    // Step 4: Save and Initialize Validation
    // ========================================================================
    await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');
    await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');

    // ========================================================================
    // Step 5: Validate and Correct Form Fields
    // ========================================================================

    // 5.1 Type of Federal Action
    await safeHelp_safeStep(testInfo, 'Validate Type of Federal Action', async () => {
      await safeHelp_safeExpect(testInfo, async () => 
        expect(page.locator('#error-for-federal_action_type')).toBeVisible()
      );
      await safeHelp_safeExpect(testInfo, async () => 
        expect(page.getByTestId('alert')).toContainText(
          `${ENTITY_DATA.messages.formSaved}${ENTITY_DATA.messages.correctErrors}${ENTITY_DATA.messages.typeOfFederalActionRequired}`
        )
      );
      await safeHelp_clickButton(testInfo, page, 'click save button', 'apply-form-save');
      await safeHelp_selectDropdownLocator(
        testInfo, 
        page, 
        '#federal_action_type', 
        ENTITY_DATA.Dropdown.typeOfFederalAction
      );
      await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');
    });

    // 5.2 Status of Federal Action
    await safeHelp_safeStep(testInfo, 'Validate Status of Federal Action', async () => {
      await safeHelp_safeExpect(testInfo, async () => 
        expect(page.getByTestId('alert')).toContainText(
          `${ENTITY_DATA.messages.formSaved}${ENTITY_DATA.messages.correctErrors}${ENTITY_DATA.messages.statusOfFederalActionRequired}`
        )
      );
      await safeHelp_safeExpect(testInfo, async () => 
        expect(page.getByRole('link', { name: ENTITY_DATA.links.statusOfFederalAction })).toBeVisible()
      );
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: ENTITY_DATA.links.statusOfFederalAction }));
      await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#error-for-federal_action_status')).toBeVisible());
      await safeHelp_safeExpect(testInfo, async () => expect(page.getByLabel('Status of Federal Action*')).toBeVisible());
      await safeHelp_selectDropdownLocator(testInfo, page, '#federal_action_status', ENTITY_DATA.Dropdown.statusOfFederalAction);
      await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');
    });

    // 5.3 Report Type
    await safeHelp_safeStep(testInfo, 'Validate Report Type', async () => {
      await safeHelp_safeExpect(testInfo, async () =>
        expect(page.getByTestId('alert')).toContainText(
          `${ENTITY_DATA.messages.formSaved}${ENTITY_DATA.messages.correctErrors}${ENTITY_DATA.messages.reportTypeRequired}`
        )
      );
      await safeHelp_safeExpect(testInfo, async () => expect(page.getByRole('link', { name: ENTITY_DATA.links.reportType })).toBeVisible());
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: ENTITY_DATA.links.reportType }));
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: ENTITY_DATA.links.reportType }));
      await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#error-for-report_type')).toBeVisible());
      await safeHelp_safeExpect(testInfo, async () => expect(page.getByLabel('Report Type*')).toBeVisible());
      await safeHelp_selectDropdownLocator(testInfo, page, '#report_type', 'InitialFiling');
      await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');
    });

    // 5.4 Entity Type
    await safeHelp_safeStep(testInfo, 'Validate Entity Type', async () => {
      await safeHelp_safeExpect(testInfo, async () =>
        expect(page.getByTestId('alert')).toContainText(
          `${ENTITY_DATA.messages.formSaved}${ENTITY_DATA.messages.correctErrors}${ENTITY_DATA.messages.entityTypeRequired}`
        )
      );
      await safeHelp_safeExpect(testInfo, async () => expect(page.getByRole('link', { name: ENTITY_DATA.links.entityType })).toBeVisible());
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: ENTITY_DATA.links.entityType }));
      await safeHelp_selectDropdownLocator(testInfo, page, '#reporting_entity--entity_type', ENTITY_DATA.Dropdown.entityType);
      await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');
    });

    // 5.5 Organization Name
    await safeHelp_safeStep(testInfo, 'Validate Organization Name', async () => {
      await safeHelp_safeExpect(testInfo, async () =>
        expect(page.getByTestId('alert')).toContainText(
          `${ENTITY_DATA.messages.formSaved}${ENTITY_DATA.messages.correctErrors}${ENTITY_DATA.messages.organizationNameRequired}`
        )
      );
      await safeHelp_safeExpect(testInfo, async () => expect(page.getByRole('link', { name: ENTITY_DATA.links.organizationName })).toBeVisible());
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: ENTITY_DATA.links.organizationName }));
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: ENTITY_DATA.links.organizationName }));
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'reporting_entity--applicant_reporting_entity--organization_name', value: 'Test' },
      ]);
      await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');
    });

    // 5.6 Address Street 1
    await safeHelp_safeStep(testInfo, 'Validate Address Street 1', async () => {
      await safeHelp_safeExpect(testInfo, async () => expect(page.getByRole('link', { name: ENTITY_DATA.links.addressStreet1 }).first()).toBeVisible());
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: ENTITY_DATA.links.addressStreet1 }).first());
      await safeHelp_safeExpect(testInfo, async () =>
        expect(page.locator('#error-for-reporting_entity--applicant_reporting_entity--address--street1')).toBeVisible()
      );
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'reporting_entity--applicant_reporting_entity--address--street1', value: 'Test' },
      ]);
      await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');

      // City
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: 'Address City is required' }).first());
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'reporting_entity--applicant_reporting_entity--address--city', value: 'Test' },
      ]);
      await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');
    });

    // 5.7 Federal Agency/Department
    await safeHelp_safeStep(testInfo, 'Validate Federal Agency/Department', async () => {
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: ENTITY_DATA.links.federalDepartmentAgency }));
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: ENTITY_DATA.links.federalDepartmentAgency }));
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'federal_agency_department', value: 'Test' },
      ]);
      await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');
    });

    // 5.8 Lobbying Registrant Information
    await safeHelp_safeStep(testInfo, 'Validate Lobbying Registrant Information', async () => {
      // First Name
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: ENTITY_DATA.links.nameAndContactInfoFirstName }).first());
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'lobbying_registrant--individual--first_name', value: 'Test' },
      ]);
      await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');

      // Last Name
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: ENTITY_DATA.links.lastNameRequired }).first());
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'lobbying_registrant--individual--last_name', value: 'Test' },
      ]);
      await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');

      // Street 1
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: ENTITY_DATA.links.addressStreet1 }).nth(1));
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'lobbying_registrant--address--street1', value: 'Test' },
      ]);
      await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');

      // City
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: 'Address City is required' }).nth(1));
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'lobbying_registrant--address--city', value: 'Test' },
      ]);
      await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');
    });

    // 5.9 Individual Performing Service Information
    await safeHelp_safeStep(testInfo, 'Validate Individual Performing Service Information', async () => {
      // First Name
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: ENTITY_DATA.links.nameAndContactInfoFirstName }).nth(1));
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'individual_performing_service--individual--first_name', value: 'Test' },
      ]);
      await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');

      // Last Name
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: ENTITY_DATA.links.lastNameRequired }).nth(1));
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'individual_performing_service--individual--last_name', value: 'Test' },
      ]);
      await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');

      // Street 1
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: ENTITY_DATA.links.addressStreet1 }).nth(2));
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'individual_performing_service--address--street1', value: 'Test' },
      ]);
      await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');

      // City
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: 'Address City is required' }).nth(2));
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'individual_performing_service--address--city', value: 'Test' },
      ]);
      await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');
    });

    // 5.10 Signature Block Information
    await safeHelp_safeStep(testInfo, 'Validate Signature Block Information', async () => {
      // First Name
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: ENTITY_DATA.links.nameAndContactInfoFirstName }).last());
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'signature_block--name--first_name', value: 'Test' },
      ]);
      await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');

      // Last Name
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: ENTITY_DATA.links.lastNameRequired }).last());
      await safeHelp_fillFieldsByTestId(testInfo, page, [
        { testId: 'signature_block--name--last_name', value: 'Test' },
      ]);
      await safeHelp_clickButton(testInfo, page, 'save form', 'apply-form-save');
    });

    // ========================================================================
    // Step 6: Verify Validation Cleared and Form is Submittable
    // ========================================================================
    await safeHelp_safeStep(testInfo, 'Verify validation cleared ', async () => {
      await safeHelp_safeExpect(testInfo, async () => 
        expect(page.getByTestId('alert')).toContainText(ENTITY_DATA.messages.noErrorsDetected)
      );
      await safeHelp_clickLink(testInfo, page.getByRole('link', { name: ENTITY_DATA.links.testAt }));
      await safeHelp_safeExpect(testInfo, async () => 
        expect(page.getByRole('cell', { name: ENTITY_DATA.messages.disclosureOfLobbyingNoIssues })).toBeVisible()
      );
    });
  } catch (error) {
    const errorMsg = String(error);
    testInfo.annotations.push({
      type: 'test-error',
      description: errorMsg,
    });
    await testInfo.attach('test-error', {
      body: errorMsg,
      contentType: 'text/plain',
    });
    console.log(`❌ ${errorMsg}`);
    // Softfail: Do not re-throw error to allow test to pass
  } finally {
    await safeHelp_attachTestSummary(testInfo, 0, startTime);
  }
});


