import { Page, TestInfo } from "@playwright/test";
import {
  UIFieldDefinition,
  verifyUIField,
} from "tests/e2e/utils/test-verify-ui-utils";

// Test data for filling the form - modify as needed for different test scenarios
export const ENTITY_DATA = {
  form: {
    name: "Disclosure of Lobbying Activities (SF-LLL)",
  },
};

// Definition of field labels and section titles for validation
export interface FieldDefinition {
  [key: string]: string | FieldDefinition;
}

// Definition of section labels and their expected text content
export interface SectionLabels {
  [key: string]: string;
}

// Expected labels and text content for each section of the SF-LLL form
export const LABELS_CONTAIN: { [key: string]: SectionLabels } = {
  typeOfFederalAction: {
    title: "1. Type of Federal Action",
    label: "Type of Federal Action*",
    description:
      "Identify the type of covered Federal action for which lobbying activity is and/or has been secured to influence the outcome of a covered Federal action.",
    options: "- Select -ContractGrantCoopAgreeLoanLoanGuaranteeLoanInsurance",
  },
  statusOfFederalAction: {
    title: "2. Status of Federal Action",
    label: "Status of Federal Action*",
    description: "Identify the status of the covered Federal action.",
  },
  reportType: {
    title: "3. Report Type",
    label: "Report Type*",
    description:
      "Identify the appropriate classification of this report. If this is a follow up report caused by a material change to the information previously reported, enter the year and quarter in which the change occurred. Enter the date of the previously submitted report by this reporting entity for this covered Federal action.",
    options: "- Select -MaterialChangeInitialFiling",
    materialChangeYear: "Material Change Year",
    materialChangeYearDesc:
      "If this is a follow up report caused by a material change to the information previously reported, enter the year in which the change occurred.",
    materialChangeQuarter: "Material Change Quarter",
    materialChangeQuarterDesc:
      "If this is a follow up report caused by a material change to the information previously reported, enter the quarter in which the change occurred.",
    lastReportDate: "Material Change Date of Last Report",
    lastReportDateDesc:
      "Enter the date of the previously submitted report by this reporting entity for this covered Federal action.",
  },
  reportingEntity: {
    title: "4. Name and Address of Reporting Entity",
    entityType: "Entity Type*",
    entityTypeDesc:
      "Check the appropriate classification of the reporting entity that designates if it is, or expects to be, a prime subaward recipient.",
    entityTypeOptions: "- Select -PrimeSubAwardee",
    tier: "Reporting Entity Tier",
    tierDesc:
      "Identify the tier of the subawardee, e.g., the first subawardee of the prime is the 1st tier.",
    orgName: "Organization Name*",
    street1: "Street 1*",
    street1Desc: "Enter the first line of the Street Address.",
    street2: "Street 2",
    street2Desc: "Enter the second line of the Street Address.",
    city: "City*",
    cityDesc: "Enter the city.",
    state: "State",
    stateDesc: "Enter the state.",
    stateOptions:
      "- Select -AlabamaAlaskaArizonaArkansasCaliforniaColoradoConnecticutDelawareDistrict of ColumbiaFloridaGeorgiaHawaiiIdahoIllinoisIndianaIowaKansasKentuckyLouisianaMaineMarylandMassachusettsMichiganMinnesotaMississippiMissouriMontanaNebraskaNevadaNew HampshireNew JerseyNew MexicoNew YorkNorth CarolinaNorth DakotaOhioOklahomaOregonPennsylvaniaRhode IslandSouth CarolinaSouth DakotaTennesseeTexasUtahVermontVirginiaWashingtonWest VirginiaWisconsinWyomingAmerican SamoaFederated States of MicronesiaGuamMarshall IslandsNorthern Mariana IslandsPalauPuerto RicoVirgin IslandsBaker IslandHowland IslandJarvis IslandJohnston AtollKingman ReefMidway IslandsNavassa IslandPalmyra AtollWake IslandArmed Forces Americas (except Canada)Armed Forces Europe, the Middle East, and CanadaArmed Forces Pacific",
    zip: "Zip / Postal Code",
    zipDesc: "Enter the nine-digit Postal Code (e.g., ZIP code).",
    district: "Congressional District",
    districtDesc:
      "Enter the Congressional District in the format: 2 character state Abbreviation - 3 character District Number. Examples: CA-005 for California's 5th district, CA-012 for California's 12th district.",
  },
  primeReportingEntity: {
    title:
      "5. If Reporting Entity in No. 4 is Subawardee, Enter Name and Address of Prime",
    orgName: "Organization Name",
    street1: "Street 1",
    street1Desc: "Enter the first line of the Street Address.",
    street2: "Street 2",
    street2Desc: "Enter the second line of the Street Address.",
    city: "City",
    cityDesc: "Enter the city.",
    state: "State",
    stateDesc: "Enter the state.",
    zip: "Zip / Postal Code",
    zipDesc: "Enter the nine-digit Postal Code (e.g., ZIP code).",
    district: "Congressional District",
    districtDesc:
      "Enter the Congressional District in the format: 2 character state Abbreviation - 3 character District Number. Examples: CA-005 for California's 5th district, CA-012 for California's 12th district.",
  },
  federalDepartment: {
    title: "6. Federal Department/Agency",
    label: "Federal Department/Agency*",
    description:
      "Enter the name of the Federal Department or Agency making the award or loan commitment.",
  },
  federalProgram: {
    title: "7. Federal Program Name/Description",
    label: "Federal Program Name/Description",
    description:
      "Federal Program Name/Description: Federal program name or description for the covered Federal action.",
    assistanceNumber: "Assistance Listing Number",
    assistanceNumberDesc:
      "If known, the full Assistance Listing Number for grants, cooperative agreements, loans and loan commitments.",
  },
  federalActionNumber: {
    title: "8. Federal Action Number",
    label: "Federal Action Number",
    description:
      'Enter the most appropriate Federal identifying number available for the Federal action, identified in item 1 (e.g., Request for Proposal (RFP) number, invitation for Bid (IFB) number, grant announcement number, the contract, grant, or loan award number, the application/proposal control number assigned by the Federal agency). Include prefixes, e.g., "RFP-DE-90-001".',
  },
  awardAmount: {
    title: "9. Award Amount",
    label: "Award Amount",
    description:
      "For a covered Federal action where there has been an award or loan commitment by the Federal agency, enter the Federal amount of the award/loan commitment of the prime entity identified in item 4 or 5.",
  },
  lobbyingRegistrant: {
    title: "10a. Name and Address of Lobbying Registrant",
    firstName: "First Name*",
    firstNameDesc: "Enter the First Name.",
    middleName: "Middle Name",
    middleNameDesc: "Enter the Middle Name.",
    lastName: "Last Name*",
    lastNameDesc: "Enter the Last Name.",
    prefix: "Prefix",
    prefixDesc: "Enter the Prefix.",
    street1: "Street 1",
    street1Desc: "Enter the first line of the Street Address.",
    street2: "Street 2",
    street2Desc: "Enter the second line of the Street Address.",
    city: "City",
    cityDesc: "Enter the city.",
    state: "State",
    stateDesc: "Enter the state.",
    zip: "Zip / Postal Code",
    zipDesc: "Enter the nine-digit Postal Code (e.g., ZIP code).",
  },
  individualsPerformingService: {
    title: "10b. Individual Performing Services",
    firstName: "First Name*",
    middleName: "Middle Name",
    middleNameDesc: "Enter the Middle Name.",
    lastName: "Last Name*",
    lastNameDesc: "Enter the Last Name.",
    prefix: "Prefix",
    prefixDesc: "Enter the Prefix.",
    suffix: "Suffix",
    suffixDesc: "Enter the Suffix.",
    street1: "Street 1",
    street1Desc: "Enter the first line of the Street Address.",
    street2: "Street 2",
    street2Desc: "Enter the second line of the Street Address.",
    city: "City",
    cityDesc: "Enter the city.",
    state: "State",
    stateDesc: "Enter the state.",
    stateOptions:
      "- Select -AlabamaAlaskaArizonaArkansasCaliforniaColoradoConnecticutDelawareDistrict of ColumbiaFloridaGeorgiaHawaiiIdahoIllinoisIndianaIowaKansasKentuckyLouisianaMaineMarylandMassachusettsMichiganMinnesotaMississippiMissouriMontanaNebraskaNevadaNew HampshireNew JerseyNew MexicoNew YorkNorth CarolinaNorth DakotaOhioOklahomaOregonPennsylvaniaRhode IslandSouth CarolinaSouth DakotaTennesseeTexasUtahVermontVirginiaWashingtonWest VirginiaWisconsinWyomingAmerican SamoaFederated States of MicronesiaGuamMarshall IslandsNorthern Mariana IslandsPalauPuerto RicoVirgin IslandsBaker IslandHowland IslandJarvis IslandJohnston AtollKingman ReefMidway IslandsNavassa IslandPalmyra AtollWake IslandArmed Forces Americas (except Canada)Armed Forces Europe, the Middle East, and CanadaArmed Forces Pacific",
    zip: "Zip / Postal Code",
    zipDesc: "Enter the nine-digit Postal Code (e.g., ZIP code).",
  },
  signature: {
    title: "11. Signature",
    description:
      "Information requested through this form is authorized by title 31 U.S.C. section 1352. This disclosure of lobbying activities is a material representation of fact upon which reliance was placed by the tier above when the transaction was made or entered into. This disclosure is required pursuant to 31 U.S.C. 1352. This information will be reported to the Congress semi- annually and will be available for public inspection. Any person who fails to file the required disclosure shall be subject to a civil penalty of not less than $10,000 and not more than $100,000 for each such failure.",
    label: "Signature",
    completedBy: "Completed by Grants.gov upon submission.",
    prefix: "Prefix",
    prefixDesc: "Enter the Prefix.",
    firstName: "First Name*",
    firstNameDesc: "Enter the First Name.",
    middleName: "Middle Name",
    middleNameDesc: "Enter the Middle Name.",
    lastName: "Last Name*",
    lastNameDesc: "Enter the Last Name.",
    suffix: "Suffix",
    suffixDesc: "Enter the Suffix.",
    titleField: "Title",
    titleDesc: "Enter the title of the Certifying Official.",
    telephone: "Telephone No.",
    telephoneDesc: "Enter the telephone number of the certifying official.",
    signatureDate: "Signature Date",
  },
};

// ============================================================================
// List of UI Fields to Verify on the SF-LLL Form
// ============================================================================

const UI_VERIFICATION_FIELDS: UIFieldDefinition[] = [
  // Section 1: Type of Federal Action
  {
    locator: '[id="form-section-Type of Federal Action"]',
    expectedText: LABELS_CONTAIN.typeOfFederalAction.title,
    section: "Section 1: Title",
  },
  {
    locator: '[id="form-section-Type of Federal Action"]',
    expectedText: LABELS_CONTAIN.typeOfFederalAction.description,
    section: "Section 1: Description",
  },
  {
    locator: "#label-for-federal_action_type",
    expectedText: LABELS_CONTAIN.typeOfFederalAction.label,
    section: "Section 1: Label",
  },

  // Section 2: Status of Federal Action
  {
    locator: '[id="form-section-Status of Federal Action"]',
    expectedText: LABELS_CONTAIN.statusOfFederalAction.title,
    section: "Section 2: Title",
  },
  {
    locator: '[id="form-section-Status of Federal Action"]',
    expectedText: LABELS_CONTAIN.statusOfFederalAction.description,
    section: "Section 2: Description",
  },
  {
    locator: "#label-for-federal_action_status",
    expectedText: LABELS_CONTAIN.statusOfFederalAction.label,
    section: "Section 2: Label",
  },

  // Section 3: Report Type
  {
    locator: '[id="form-section-Report Type"]',
    expectedText: LABELS_CONTAIN.reportType.title,
    section: "Section 3: Title",
  },
  {
    locator: '[id="form-section-Report Type"]',
    expectedText: LABELS_CONTAIN.reportType.description,
    section: "Section 3: Description",
  },
  {
    locator: "#label-for-report_type",
    expectedText: LABELS_CONTAIN.reportType.label,
    section: "Section 3: Label",
  },

  // Section 4: Name and Address of Reporting Entity
  {
    locator: '[id="form-section-Name and Address of Reporting Entity"]',
    expectedText: LABELS_CONTAIN.reportingEntity.title,
    section: "Section 4: Title",
  },
  {
    locator: "#label-for-reporting_entity--entity_type",
    expectedText: LABELS_CONTAIN.reportingEntity.entityType,
    section: "Section 4: Entity Type",
  },
  {
    locator:
      "#label-for-reporting_entity--applicant_reporting_entity--organization_name",
    expectedText: LABELS_CONTAIN.reportingEntity.orgName,
    section: "Section 4: Organization Name",
  },

  // Section 5: Prime Reporting Entity
  {
    locator: "form",
    expectedText: LABELS_CONTAIN.primeReportingEntity.title,
    section: "Section 5: Title",
  },
  {
    locator:
      "#label-for-reporting_entity--prime_reporting_entity--organization_name",
    expectedText: LABELS_CONTAIN.primeReportingEntity.orgName,
    section: "Section 5: Organization Name",
  },

  // Section 6: Federal Department/Agency
  {
    locator: '[id="form-section-Federal Department/Agency"]',
    expectedText: LABELS_CONTAIN.federalDepartment.title,
    section: "Section 6: Title",
  },
  {
    locator: "#label-for-federal_agency_department",
    expectedText: LABELS_CONTAIN.federalDepartment.label,
    section: "Section 6: Label",
  },
  {
    locator: '[id="form-section-Federal Department/Agency"]',
    expectedText: LABELS_CONTAIN.federalDepartment.description,
    section: "Section 6: Description",
  },

  // Section 7: Federal Program Name/Description
  {
    locator: '[id="form-section-Federal Program Name/Description"]',
    expectedText: LABELS_CONTAIN.federalProgram.title,
    section: "Section 7: Title",
  },
  {
    locator: "#label-for-federal_program_name",
    expectedText: LABELS_CONTAIN.federalProgram.label,
    section: "Section 7: Label",
  },
  {
    locator: '[id="form-section-Federal Program Name/Description"]',
    expectedText: LABELS_CONTAIN.federalProgram.description,
    section: "Section 7: Description",
  },

  // Section 8: Federal Action Number
  {
    locator: '[id="form-section-Federal Action Number"]',
    expectedText: LABELS_CONTAIN.federalActionNumber.title,
    section: "Section 8: Title",
  },
  {
    locator: "#label-for-federal_action_number",
    expectedText: LABELS_CONTAIN.federalActionNumber.label,
    section: "Section 8: Label",
  },
  {
    locator: '[id="form-section-Federal Action Number"]',
    expectedText: LABELS_CONTAIN.federalActionNumber.description,
    section: "Section 8: Description",
  },

  // Section 9: Award Amount
  {
    locator: '[id="form-section-Award Amount"]',
    expectedText: LABELS_CONTAIN.awardAmount.title,
    section: "Section 9: Title",
  },
  {
    locator: "#label-for-award_amount",
    expectedText: LABELS_CONTAIN.awardAmount.label,
    section: "Section 9: Label",
  },
  {
    locator: '[id="form-section-Award Amount"]',
    expectedText: LABELS_CONTAIN.awardAmount.description,
    section: "Section 9: Description",
  },

  // Section 10a: Name and Address of Lobbying Registrant
  {
    locator: '[id="form-section-Name and Address of Lobbying Registrant"]',
    expectedText: LABELS_CONTAIN.lobbyingRegistrant.title,
    section: "Section 10a: Title",
  },
  {
    locator: "#label-for-lobbying_registrant--individual--first_name",
    expectedText: LABELS_CONTAIN.lobbyingRegistrant.firstName,
    section: "Section 10a: First Name",
  },
  {
    locator: '[id="form-section-Name and Address of Lobbying Registrant"]',
    expectedText: LABELS_CONTAIN.lobbyingRegistrant.firstNameDesc,
    section: "Section 10a: First Name Description",
  },

  // Section 10b: Individual Performing Services
  {
    locator: '[id="form-section-Individual Performing Services"]',
    expectedText: LABELS_CONTAIN.individualsPerformingService.title,
    section: "Section 10b: Title",
  },
  {
    locator: "#label-for-individual_performing_service--individual--first_name",
    expectedText: LABELS_CONTAIN.individualsPerformingService.firstName,
    section: "Section 10b: First Name",
  },

  // Section 11: Signature
  {
    locator: "#form-section-Signature",
    expectedText: LABELS_CONTAIN.signature.title,
    section: "Section 11: Title",
  },
  {
    locator: "#form-section-Signature",
    expectedText: LABELS_CONTAIN.signature.description,
    section: "Section 11: Description",
  },
  {
    locator: "#label-for-signature_block--signature",
    expectedText: LABELS_CONTAIN.signature.label,
    section: "Section 11: Signature Label",
  },
];

// ============================================================================
// Main Function to Verify UI Elements on SF-LLL Form
// ============================================================================

export async function userInterfaceSflllFormUtils(
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

    // Iterate through each UI field definition to verify
    for (const field of UI_VERIFICATION_FIELDS) {
      await verifyUIField(testInfo, page, field);
    }

    // Navigate back to application overview using applicationURL
    await page.goto(applicationURL);

    // Attach final success info to test report
    await testInfo.attach("userInterfaceSflllFormUtils-success", {
      body: "Successfully verified all UI elements on the SF-LLL form.",
      contentType: "text/plain",
    });
  } catch (error) {
    // Attach unexpected error info to test report
    const errorMsg = String(error);
    testInfo.annotations.push({
      type: "test-error",
      description: errorMsg,
    });
    await testInfo.attach("userInterfaceSflllFormUtils-error", {
      body: error instanceof Error ? error.message : String(error),
      contentType: "text/plain",
    });
    // Rethrow the error to fail the test
    throw error;
  }
}
