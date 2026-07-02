import path from "path";
import type { fieldDefinitionsSF424 } from "tests/e2e/apply/fixtures/sf424-field-definitions";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";
import { toHappyPathSuffix } from "tests/e2e/utils/submission/print-view-utils";

// Uploaded files validated by section locator in print view.
const TEST_UPLOAD_DIR = path.resolve(__dirname, "../../test-upload-files");
const SF424_TEST_UPLOAD_FILE = `${TEST_UPLOAD_DIR}/sample-upload-kb.pdf`;

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
    applicant_zip_code: "12345",
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
    // Section 11–12 – Agency / Assistance Listing
    agency_name: `Agency ${shortSuffix}`,
    assistance_listing_program_title: `Program Title ${shortSuffix}`,
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
    additional_project_title_attachment: SF424_TEST_UPLOAD_FILE,
    additional_congressional_attachment: SF424_TEST_UPLOAD_FILE,
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
};
