// ============================================================================
// SFLLL v2.0 Form User Interface Test
// ============================================================================

// // ---- Imports ----
import { test, expect } from '@playwright/test';
import testConfig from 'tests/e2e/test-data/test-config.json' with { type: 'json' };
// import {
//   expect,
//   test,
//   type BrowserContext,
//   type Page,
//   type TestInfo,
// } from "@playwright/test";
// import { createSpoofedSessionCookie } from "tests/e2e/loginUtils";
// import playwrightEnv from "tests/e2e/playwright-env";
// import { openMobileNav } from "tests/e2e/playwrightUtils";
// import { performStagingLogin } from "tests/e2e/utils/perform-login-utils";
import {
  safeHelp_safeExpect,
  safeHelp_safeStep,
  safeHelp_attachTestSummary,
  safeHelp_updateApplicationName,
  safeHelp_GotoForm,
  // safeHelp_selectDropdownLocator,
  // safeHelp_fillFieldsByTestId,
  // safeHelp_ValidateTextAtLocator,
  safeHelp_safeGoto,
  safeHelp_safeWaitForLoadState,
  safeHelp_clickLink,
  // safeHelp_clickButton,
} from 'tests/e2e/helpers/safeHelp';

// const { baseUrl, targetEnv } = playwrightEnv;

// ---- Environment Configuration ----
const BASE_DOMAIN = testConfig.environment.baseDomain;
const APPLICATION_ID = testConfig.environment.applicationId;
const directPageUrl = `https://${BASE_DOMAIN}/applications/${APPLICATION_ID}`;

// ---- Test Data ----
const ENTITY_DATA = {
  form: {
    name: 'Disclosure of Lobbying',
  },
};
		
// ============================================================================
// Main Test
// ============================================================================

test('SFLLLv2_0-form-user-interface', async ({ page }, testInfo) => {
  const startTime = new Date();
  const goToForm = safeHelp_GotoForm(testInfo, page);

  try {
    // ---- Step 1: Navigate to Application ----
    await safeHelp_safeGoto(testInfo, page, directPageUrl);
    await safeHelp_clickLink(testInfo, page.getByRole('link', { name: 'Sign in' }));

    // ---- Step 2: Update Application Name ----
    // const { appLinkName, prevYear, quarter, lastDayOfPrevQuarter } = 
	await safeHelp_updateApplicationName(
      testInfo,
      page
    );

    // ---- Step 3: Navigate to Form ----
    await goToForm(ENTITY_DATA.form.name);
    await safeHelp_safeWaitForLoadState(testInfo, page);

    // ---- Step 4: Verify User Interface Elements ----
    await safeHelp_safeStep(testInfo, 'Verify user interface elements', async () => {

// 1. Verify labels and options in "Type of Federal Action" section
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Type of Federal Action"]')).toContainText('1. Type of Federal Action'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-federal_action_type')).toContainText('Type of Federal Action*'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Type of Federal Action"]')).toContainText('Identify the type of covered Federal action for which lobbying activity is and/or has been secured to influence the outcome of a covered Federal action.'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.getByLabel('Type of Federal Action*')).toContainText('- Select -ContractGrantCoopAgreeLoanLoanGuaranteeLoanInsurance'));

// 2. Verify labels and options in "Status of Federal Action" section
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Status of Federal Action"]')).toContainText('2. Status of Federal Action'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-federal_action_status')).toContainText('Status of Federal Action*'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Status of Federal Action"]')).toContainText('Identify the status of the covered Federal action.'));

// 3. Verify labels and fields in "Report Type" section
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Report Type"]')).toContainText('3. Report Type'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-report_type')).toContainText('Report Type*'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Report Type"]')).toContainText('Identify the appropriate classification of this report. If this is a follow up report caused by a material change to the information previously reported, enter the year and quarter in which the change occurred. Enter the date of the previously submitted report by this reporting entity for this covered Federal action.'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.getByLabel('Report Type*')).toContainText('- Select -MaterialChangeInitialFiling'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-material_change_year')).toContainText('Material Change Year'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Report Type"]')).toContainText('If this is a follow up report caused by a material change to the information previously reported, enter the year in which the change occurred.'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-material_change_quarter')).toContainText('Material Change Quarter'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Report Type"]')).toContainText('If this is a follow up report caused by a material change to the information previously reported, enter the quarter in which the change occurred.'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-last_report_date')).toContainText('Material Change Date of Last Report'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Report Type"]')).toContainText('Enter the date of the previously submitted report by this reporting entity for this covered Federal action.'));

// 4. Verify labels and fields in "Name and Address of Reporting Entity" section
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Name and Address of Reporting Entity"]')).toContainText('4. Name and Address of Reporting Entity'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-reporting_entity--entity_type')).toContainText('Entity Type*'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Name and Address of Reporting Entity"]')).toContainText('Check the appropriate classification of the reporting entity that designates if it is, or expects to be, a prime subaward recipient.'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.getByLabel('Entity Type*')).toContainText('- Select -PrimeSubAwardee'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-reporting_entity--tier')).toContainText('Reporting Entity Tier'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Name and Address of Reporting Entity"]')).toContainText('Identify the tier of the subawardee, e.g., the first subawardee of the prime is the 1st tier.'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-reporting_entity--applicant_reporting_entity--organization_name')).toContainText('Organization Name*'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-reporting_entity--applicant_reporting_entity--address--street1')).toContainText('Street 1*'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Name and Address of Reporting Entity"]')).toContainText('Enter the first line of the Street Address.'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-reporting_entity--applicant_reporting_entity--address--street2')).toContainText('Street 2'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Name and Address of Reporting Entity"]')).toContainText('Enter the second line of the Street Address.'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-reporting_entity--applicant_reporting_entity--address--city')).toContainText('City*'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Name and Address of Reporting Entity"]')).toContainText('Enter the city.'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-reporting_entity--applicant_reporting_entity--address--state')).toContainText('State'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Name and Address of Reporting Entity"]')).toContainText('Enter the state.'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#reporting_entity--applicant_reporting_entity--address--state')).toContainText('- Select -AlabamaAlaskaArizonaArkansasCaliforniaColoradoConnecticutDelawareDistrict of ColumbiaFloridaGeorgiaHawaiiIdahoIllinoisIndianaIowaKansasKentuckyLouisianaMaineMarylandMassachusettsMichiganMinnesotaMississippiMissouriMontanaNebraskaNevadaNew HampshireNew JerseyNew MexicoNew YorkNorth CarolinaNorth DakotaOhioOklahomaOregonPennsylvaniaRhode IslandSouth CarolinaSouth DakotaTennesseeTexasUtahVermontVirginiaWashingtonWest VirginiaWisconsinWyomingAmerican SamoaFederated States of MicronesiaGuamMarshall IslandsNorthern Mariana IslandsPalauPuerto RicoVirgin IslandsBaker IslandHowland IslandJarvis IslandJohnston AtollKingman ReefMidway IslandsNavassa IslandPalmyra AtollWake IslandArmed Forces Americas (except Canada)Armed Forces Europe, the Middle East, and CanadaArmed Forces Pacific'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-reporting_entity--applicant_reporting_entity--address--zip_code')).toContainText('Zip / Postal Code'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Name and Address of Reporting Entity"]')).toContainText('Enter the nine-digit Postal Code (e.g., ZIP code).'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-reporting_entity--applicant_reporting_entity--congressional_district')).toContainText('Congressional District'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Name and Address of Reporting Entity"]')).toContainText('Enter the Congressional District in the format: 2 character state Abbreviation - 3 character District Number. Examples: CA-005 for California\'s 5th district, CA-012 for California\'s 12th district.'));
 
// 5. Verify fields in "Name and Address of Prime Reporting Entity" section
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('form')).toContainText('5. If Reporting Entity in No. 4 is Subawardee, Enter Name and Address of Prime'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-reporting_entity--prime_reporting_entity--organization_name')).toContainText('Organization Name'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-reporting_entity--prime_reporting_entity--address--street1')).toContainText('Street 1'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('form')).toContainText('Enter the first line of the Street Address.'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-reporting_entity--prime_reporting_entity--address--street2')).toContainText('Street 2'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('form')).toContainText('Enter the second line of the Street Address.'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-reporting_entity--prime_reporting_entity--address--city')).toContainText('City'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('form')).toContainText('Enter the city.'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-reporting_entity--prime_reporting_entity--address--state')).toContainText('State'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('form')).toContainText('Enter the state.'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-reporting_entity--prime_reporting_entity--address--zip_code')).toContainText('Zip / Postal Code'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('form')).toContainText('Enter the nine-digit Postal Code (e.g., ZIP code).'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-reporting_entity--prime_reporting_entity--congressional_district')).toContainText('Congressional District'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('form')).toContainText('Enter the Congressional District in the format: 2 character state Abbreviation - 3 character District Number. Examples: CA-005 for California\'s 5th district, CA-012 for California\'s 12th district.'));

// 6. Verify labels and fields in "Federal Department/Agency" section
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Federal Department/Agency"]')).toContainText('6. Federal Department/Agency'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-federal_agency_department')).toContainText('Federal Department/Agency*'));
    await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Federal Department/Agency"]')).toContainText('Enter the name of the Federal Department or Agency making the award or loan commitment.'));

// 7. Verify labels and fields in "Federal Program Name/Description" section
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Federal Program Name/Description"]')).toContainText('7. Federal Program Name/Description'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-federal_program_name')).toContainText('Federal Program Name/Description'));// Bug?
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Federal Program Name/Description"]')).toContainText('Federal Program Name/Description: Federal program name or description for the covered Federal action.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-assistance_listing_number')).toContainText('Assistance Listing Number'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Federal Program Name/Description"]')).toContainText('If known, the full Assistance Listing Number for grants, cooperative agreements, loans and loan commitments.'));

// 8. Verify labels and fields in "Federal Action Number" section
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Federal Action Number"]')).toContainText('8. Federal Action Number'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-federal_action_number')).toContainText('Federal Action Number'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Federal Action Number"]')).toContainText('Enter the most appropriate Federal identifying number available for the Federal action, identified in item 1 (e.g., Request for Proposal (RFP) number, invitation for Bid (IFB) number, grant announcement number, the contract, grant, or loan award number, the application/proposal control number assigned by the Federal agency). Include prefixes, e.g., "RFP-DE-90-001".'));

 // 9. Verify labels and fields in "Award Amount" section 
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Award Amount"]')).toContainText('9. Award Amount'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-award_amount')).toContainText('Award Amount'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Award Amount"]')).toContainText('For a covered Federal action where there has been an award or loan commitment by the Federal agency, enter the Federal amount of the award/loan commitment of the prime entity identified in item 4 or 5.'));

// 10a. Verify labels and fields in "Name and Address of Lobbying Registrant" section
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Name and Address of Lobbying Registrant"]')).toContainText('10a. Name and Address of Lobbying Registrant'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-lobbying_registrant--individual--first_name')).toContainText('First Name*'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Name and Address of Lobbying Registrant"]')).toContainText('Enter the First Name.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-lobbying_registrant--individual--middle_name')).toContainText('Middle Name'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Name and Address of Lobbying Registrant"]')).toContainText('Enter the Middle Name.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-lobbying_registrant--individual--last_name')).toContainText('Last Name*'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Name and Address of Lobbying Registrant"]')).toContainText('Enter the Last Name.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-lobbying_registrant--individual--prefix')).toContainText('Prefix'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Name and Address of Lobbying Registrant"]')).toContainText('Enter the Prefix.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-lobbying_registrant--address--street1')).toContainText('Street 1'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Name and Address of Lobbying Registrant"]')).toContainText('Enter the first line of the Street Address.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-lobbying_registrant--address--street2')).toContainText('Street 2'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Name and Address of Lobbying Registrant"]')).toContainText('Enter the second line of the Street Address.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-lobbying_registrant--address--city')).toContainText('City'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Name and Address of Lobbying Registrant"]')).toContainText('Enter the city.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-lobbying_registrant--address--state')).toContainText('State'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Name and Address of Lobbying Registrant"]')).toContainText('Enter the state.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-lobbying_registrant--address--zip_code')).toContainText('Zip / Postal Code'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Name and Address of Lobbying Registrant"]')).toContainText('Enter the nine-digit Postal Code (e.g., ZIP code).'));

// 10b. Verify labels and fields in "Individual Performing Services" section
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Individual Performing Services"]')).toContainText('10b. Individual Performing Services'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-individual_performing_service--individual--first_name')).toContainText('First Name*'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-individual_performing_service--individual--middle_name')).toContainText('Middle Name'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Individual Performing Services"]')).toContainText('Enter the Middle Name.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-individual_performing_service--individual--last_name')).toContainText('Last Name*'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Individual Performing Services"]')).toContainText('Enter the Last Name.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-individual_performing_service--individual--prefix')).toContainText('Prefix'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Individual Performing Services"]')).toContainText('Enter the Prefix.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-individual_performing_service--individual--suffix')).toContainText('Suffix'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Individual Performing Services"]')).toContainText('Enter the Suffix.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-individual_performing_service--address--street1')).toContainText('Street 1'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Individual Performing Services"]')).toContainText('Enter the first line of the Street Address.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-individual_performing_service--address--street2')).toContainText('Street 2'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Individual Performing Services"]')).toContainText('Enter the second line of the Street Address.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-individual_performing_service--address--city')).toContainText('City'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Individual Performing Services"]')).toContainText('Enter the city.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-individual_performing_service--address--state')).toContainText('State'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Individual Performing Services"]')).toContainText('Enter the state.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#individual_performing_service--address--state')).toContainText('- Select -AlabamaAlaskaArizonaArkansasCaliforniaColoradoConnecticutDelawareDistrict of ColumbiaFloridaGeorgiaHawaiiIdahoIllinoisIndianaIowaKansasKentuckyLouisianaMaineMarylandMassachusettsMichiganMinnesotaMississippiMissouriMontanaNebraskaNevadaNew HampshireNew JerseyNew MexicoNew YorkNorth CarolinaNorth DakotaOhioOklahomaOregonPennsylvaniaRhode IslandSouth CarolinaSouth DakotaTennesseeTexasUtahVermontVirginiaWashingtonWest VirginiaWisconsinWyomingAmerican SamoaFederated States of MicronesiaGuamMarshall IslandsNorthern Mariana IslandsPalauPuerto RicoVirgin IslandsBaker IslandHowland IslandJarvis IslandJohnston AtollKingman ReefMidway IslandsNavassa IslandPalmyra AtollWake IslandArmed Forces Americas (except Canada)Armed Forces Europe, the Middle East, and CanadaArmed Forces Pacific'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-individual_performing_service--address--zip_code')).toContainText('Zip / Postal Code'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('[id="form-section-Individual Performing Services"]')).toContainText('Enter the nine-digit Postal Code (e.g., ZIP code).'));

// 11. Verify labels and fields in "Signature" section
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#form-section-Signature')).toContainText('11. Signature'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#form-section-Signature')).toContainText('Information requested through this form is authorized by title 31 U.S.C. section 1352. This disclosure of lobbying activities is a material representation of fact upon which reliance was placed by the tier above when the transaction was made or entered into. This disclosure is required pursuant to 31 U.S.C. 1352. This information will be reported to the Congress semi- annually and will be available for public inspection. Any person who fails to file the required disclosure shall be subject to a civil penalty of not less than $10,000 and not more than $100,000 for each such failure.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-signature_block--signature')).toContainText('Signature'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#form-section-Signature')).toContainText('Completed by Grants.gov upon submission.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-signature_block--name--prefix')).toContainText('Prefix'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#form-section-Signature')).toContainText('Enter the Prefix.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-signature_block--name--first_name')).toContainText('First Name*'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#form-section-Signature')).toContainText('Enter the First Name.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-signature_block--name--middle_name')).toContainText('Middle Name'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#form-section-Signature')).toContainText('Enter the Middle Name.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-signature_block--name--last_name')).toContainText('Last Name*'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#form-section-Signature')).toContainText('Enter the Last Name.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-signature_block--name--suffix')).toContainText('Suffix'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#form-section-Signature')).toContainText('Enter the Suffix.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-signature_block--title')).toContainText('Title'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#form-section-Signature')).toContainText('Enter the title of the Certifying Official.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-signature_block--telephone')).toContainText('Telephone No.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#form-section-Signature')).toContainText('Enter the telephone number of the certifying official.'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#label-for-signature_block--signed_date')).toContainText('Signature Date'));
  await safeHelp_safeExpect(testInfo, async () => expect(page.locator('#form-section-Signature')).toContainText('Completed by Grants.gov upon submission.'));
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
    // console.log(`❌ ${errorMsg}`);
    // Softfail: Do not re-throw error to allow test to pass
  } finally {
    await safeHelp_attachTestSummary(testInfo, 0, startTime);
  }
});
