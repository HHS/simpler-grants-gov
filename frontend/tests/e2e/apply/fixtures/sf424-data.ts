import path from "path";
import type { fieldDefinitionsSF424 } from "tests/e2e/apply/fixtures/sf424-field-definitions";
import playwrightEnv from "tests/e2e/playwright-env";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";
import { toHappyPathSuffix } from "tests/e2e/utils/submission/print-view-utils";
import {
  xmlCurrency,
  xmlYesNo,
} from "tests/e2e/utils/submission/submission-field-utils";

// Uploaded files validated by section locator in print view.
const TEST_UPLOAD_DIR = path.resolve(__dirname, "../../test-upload-files");
export const SF424_TEST_UPLOAD_FILE = `${TEST_UPLOAD_DIR}/sample-upload-kb.pdf`;

/**
 * Applicant scenarios for SF-424 dual-applicant testing (Organization + Individual).
 * Used to validate workflows across different user types.
 */
export const SF424_APPLICANT_SCENARIOS = [
  {
    scenarioName: "Organization applicant",
    orgLabel: playwrightEnv.testOrgLabel,
  },
  { scenarioName: "Individual applicant", orgLabel: undefined },
] as const;

/**
 * Happy-path test data builder for the SF-424 form.
 * Generates unique values using a numeric suffix to prevent collisions across runs.
 * Short suffixes keep dynamic values within field max lengths.
 */
export const buildSF424HappyPathTestData = (
  suffix: number,
): Record<string, string> => {
  // Keep dynamic data within field max lengths to avoid server-side truncation.
  const shortSuffix = toHappyPathSuffix(suffix);

  return {
    // Section 1 – Submission Type (printTestId: "submission_type")
    submission_type: "Application",
    // Section 2 – Application Type (revision_type/revision_other_specify omitted: N/A for "New")
    application_type: "New",
    // Section 4–5 – Identifiers
    applicant_id: `APPID${shortSuffix}`,
    federal_entity_identifier: `FEI${shortSuffix}`,
    federal_award_identifier: `FAI${shortSuffix}`,
    // Section 6–7 – Org / EIN
    organization_name: `Org ${shortSuffix}`,
    employer_taxpayer_identification_number: "44-4444444",
    // Section 8 – Address
    applicant_street1: `${shortSuffix} Main St`,
    applicant_street2: `Suite ${shortSuffix}`,
    applicant_city: `City ${shortSuffix}`,
    applicant_state: "AL: Alabama",
    applicant_country: "USA: UNITED STATES",
    applicant_zip_code: "12345-6789",
    // Section 8e – Dept / Division
    department_name: `Dept ${shortSuffix}`,
    division_name: `Div ${shortSuffix}`,
    // Section 8f – Contact Person
    contact_person_prefix: `CP${shortSuffix}`,
    contact_person_first_name: `CPFirst${shortSuffix}`,
    contact_person_middle_name: `CPMid${shortSuffix}`,
    contact_person_last_name: `CPLast${shortSuffix}`,
    contact_person_suffix: `CPS${shortSuffix}`,
    contact_person_title: `CPTitle${shortSuffix}`,
    organization_affiliation: `OrgAff${shortSuffix}`,
    phone_number: "8888888888",
    fax: "8888888888",
    email: `test${shortSuffix}@example.com`,
    // Section 9 – Applicant Type (printTestId: "applicant_type_code")
    applicant_type_code__combobox: "C: City or Township Government",
    applicant_type_other_specify: `ApplicantOther${shortSuffix}`,
    // Section 11–12 – Agency / Assistance Listing (pre-populated by system, not user-entered)
    // NOT included: agency_name, assistance_listing_program_title, funding_opportunity_number,
    // funding_opportunity_title, assistance_listing_number, competition_identification_number,
    // competition_identification_title, and sam_uei are all read-only and populated by
    // pre-population rules. The form will auto-fill these after submission creates the application.
    // Section 15 – Project Title
    project_title: `Project ${shortSuffix}`,
    // Section 16 – Congressional Districts
    congressional_district_applicant: "00-000",
    congressional_district_program_project: "MD-000",
    // Section 17 – Project Dates
    project_start_date: "2030-10-01",
    project_end_date: "2036-10-31",
    // Section 18 – Estimated Funding
    federal_estimated_funding: "1000000",
    applicant_estimated_funding: "500000",
    state_estimated_funding: "250000",
    local_estimated_funding: "150000",
    other_estimated_funding: "50000",
    program_income_estimated_funding: "25000",
    // Section 19 – State Review (printTestId: "state_review")
    application_subject_to: "c. Program is not covered by E.O. 12372.",
    state_review_available_date: "2026-12-01",
    // Section 20 – Delinquent Federal Debt (printTestId: "delinquent_federal_debt")
    delinquent_federal_debt: "No",
    // Section 21 – Certification (no printTestId; validated via expectedPrepopulatedFields)
    certification_agree: "true",
    // Section 21 – Authorized Representative
    authorized_representative_prefix: `AR${shortSuffix}`,
    authorized_representative_first_name: `ARFirst${shortSuffix}`,
    authorized_representative_middle_name: `ARMid${shortSuffix}`,
    authorized_representative_last_name: `ARLast${shortSuffix}`,
    authorized_representative_suffix: `ARS${shortSuffix}`,
    authorized_representative_title: `ARTitle${shortSuffix}`,
    authorized_representative_phone_number: "2222222222",
    authorized_representative_fax: "3333333333",
    authorized_representative_email: `aor${shortSuffix}@test.com`,
    areas_affected_attachment: SF424_TEST_UPLOAD_FILE,
    additional_congressional_attachment: SF424_TEST_UPLOAD_FILE,
    additional_project_title_attachment: SF424_TEST_UPLOAD_FILE,
  } satisfies Partial<Record<keyof typeof fieldDefinitionsSF424, string>>;
};

/**
 * Contains opportunity metadata, expected prepopulated field values, and the form-specific test data builder.
 * Imported by load-opportunity-config.ts to build the opportunity registry.
 */
export const SF424_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  opportunityNumber: "E2E-SF424-ORG-IND-01",
  formKey: "sf424",
  expectedPrepopulatedFields: {
    funding_opportunity_number: "E2E-SF424-ORG-IND-01",
    funding_opportunity_title:
      "E2E Application for Federal Assistance (SF-424) ORG IND OT01",
    assistance_listing_number: "10.960",
    agency_name: "Simpler Grants.gov",
    assistance_listing_program_title: "Technical Agricultural Assistance",
    competition_identification_title:
      "E2E Application for Federal Assistance (SF-424) ORG IND CT01",
    certification_agree: "Yes",
  },
  buildTestData: buildSF424HappyPathTestData,
  // What the submission zip spec verifies per field (XML element and/or PDF text).
  // "SF424_4_0:" = root element prefix, "globLib:" = shared name/address elements.
  // aor_signature, date_received and date_signed are system post-populated; the spec supplies their values.
  submissionFields: {
    submission_type: { xmlElement: "SF424_4_0:SubmissionType" },
    application_type: { xmlElement: "SF424_4_0:ApplicationType" },
    applicant_id: { xmlElement: "SF424_4_0:ApplicantID", verifyInPdf: true },
    federal_entity_identifier: {
      xmlElement: "SF424_4_0:FederalEntityIdentifier",
      verifyInPdf: true,
    },
    federal_award_identifier: {
      xmlElement: "SF424_4_0:FederalAwardIdentifier",
      verifyInPdf: true,
    },
    organization_name: {
      xmlElement: "SF424_4_0:OrganizationName",
      verifyInPdf: true,
    },
    employer_taxpayer_identification_number: {
      xmlElement: "SF424_4_0:EmployerTaxpayerIdentificationNumber",
    },
    applicant_street1: { xmlElement: "globLib:Street1", verifyInPdf: true },
    applicant_street2: { xmlElement: "globLib:Street2" },
    applicant_city: { xmlElement: "globLib:City", verifyInPdf: true },
    applicant_state: { xmlElement: "globLib:State" },
    applicant_zip_code: { xmlElement: "globLib:ZipPostalCode" },
    applicant_country: { xmlElement: "globLib:Country" },
    department_name: {
      xmlElement: "SF424_4_0:DepartmentName",
      verifyInPdf: true,
    },
    division_name: { xmlElement: "SF424_4_0:DivisionName", verifyInPdf: true },
    contact_person_prefix: { xmlElement: "globLib:PrefixName" },
    contact_person_first_name: {
      xmlElement: "globLib:FirstName",
      verifyInPdf: true,
    },
    contact_person_middle_name: { xmlElement: "globLib:MiddleName" },
    contact_person_last_name: {
      xmlElement: "globLib:LastName",
      verifyInPdf: true,
    },
    contact_person_suffix: { xmlElement: "globLib:SuffixName" },
    contact_person_title: { xmlElement: "SF424_4_0:Title", verifyInPdf: true },
    organization_affiliation: {
      xmlElement: "SF424_4_0:OrganizationAffiliation",
      verifyInPdf: true,
    },
    phone_number: { xmlElement: "SF424_4_0:PhoneNumber" },
    fax: { xmlElement: "SF424_4_0:Fax" },
    email: { xmlElement: "SF424_4_0:Email", verifyInPdf: true },
    applicant_type_code__combobox: {
      xmlElement: "SF424_4_0:ApplicantTypeCode1",
    },
    applicant_type_other_specify: {
      xmlElement: "SF424_4_0:ApplicantTypeOtherSpecify",
      verifyInPdf: true,
    },
    agency_name: { xmlElement: "SF424_4_0:AgencyName", verifyInPdf: true },
    assistance_listing_number: { xmlElement: "SF424_4_0:CFDANumber" },
    assistance_listing_program_title: {
      xmlElement: "SF424_4_0:CFDAProgramTitle",
    },
    funding_opportunity_number: {
      xmlElement: "SF424_4_0:FundingOpportunityNumber",
      verifyInPdf: true,
    },
    funding_opportunity_title: {
      xmlElement: "SF424_4_0:FundingOpportunityTitle",
    },
    competition_identification_title: {
      xmlElement: "SF424_4_0:CompetitionIdentificationTitle",
    },
    project_title: { xmlElement: "SF424_4_0:ProjectTitle", verifyInPdf: true },
    congressional_district_applicant: {
      xmlElement: "SF424_4_0:CongressionalDistrictApplicant",
    },
    congressional_district_program_project: {
      xmlElement: "SF424_4_0:CongressionalDistrictProgramProject",
    },
    project_start_date: { xmlElement: "SF424_4_0:ProjectStartDate" },
    project_end_date: { xmlElement: "SF424_4_0:ProjectEndDate" },
    federal_estimated_funding: {
      xmlElement: "SF424_4_0:FederalEstimatedFunding",
      xmlTransform: xmlCurrency,
    },
    applicant_estimated_funding: {
      xmlElement: "SF424_4_0:ApplicantEstimatedFunding",
      xmlTransform: xmlCurrency,
    },
    state_estimated_funding: {
      xmlElement: "SF424_4_0:StateEstimatedFunding",
      xmlTransform: xmlCurrency,
    },
    local_estimated_funding: {
      xmlElement: "SF424_4_0:LocalEstimatedFunding",
      xmlTransform: xmlCurrency,
    },
    other_estimated_funding: {
      xmlElement: "SF424_4_0:OtherEstimatedFunding",
      xmlTransform: xmlCurrency,
    },
    program_income_estimated_funding: {
      xmlElement: "SF424_4_0:ProgramIncomeEstimatedFunding",
      xmlTransform: xmlCurrency,
    },
    application_subject_to: { xmlElement: "SF424_4_0:StateReview" },
    state_review_available_date: {
      xmlElement: "SF424_4_0:StateReviewAvailableDate",
    },
    delinquent_federal_debt: {
      xmlElement: "SF424_4_0:DelinquentFederalDebt",
      xmlTransform: xmlYesNo,
    },
    certification_agree: {
      xmlElement: "SF424_4_0:CertificationAgree",
      xmlTransform: xmlYesNo,
    },
    authorized_representative_first_name: {
      xmlElement: "globLib:FirstName",
      verifyInPdf: true,
    },
    authorized_representative_last_name: {
      xmlElement: "globLib:LastName",
      verifyInPdf: true,
    },
    authorized_representative_title: {
      xmlElement: "SF424_4_0:AuthorizedRepresentativeTitle",
      verifyInPdf: true,
    },
    authorized_representative_phone_number: {
      xmlElement: "SF424_4_0:AuthorizedRepresentativePhoneNumber",
    },
    authorized_representative_fax: {
      xmlElement: "SF424_4_0:AuthorizedRepresentativeFax",
    },
    authorized_representative_email: {
      xmlElement: "SF424_4_0:AuthorizedRepresentativeEmail",
      verifyInPdf: true,
    },
    aor_signature: { xmlElement: "SF424_4_0:AORSignature", verifyInPdf: true },
    date_received: { xmlElement: "SF424_4_0:DateReceived" },
    date_signed: { xmlElement: "SF424_4_0:DateSigned" },
  },
};
