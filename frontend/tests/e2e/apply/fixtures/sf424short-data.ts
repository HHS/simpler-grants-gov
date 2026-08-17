import type { fieldDefinitionsSF424Short } from "tests/e2e/apply/fixtures/sf424short-field-definitions";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";
import { toHappyPathSuffix } from "tests/e2e/utils/submission/print-view-utils";

/**
 * Happy-path test data builder for the SF-424 Short (Organizational) form.
 * Generates unique values using a numeric suffix to prevent collisions across runs.
 * Short suffixes keep dynamic values within field max lengths.
 *
 * Unlike SF-424 (long), this form has no attachment fields and no
 * competition_identification / delinquent-federal-debt / state-review sections.
 */
export const buildSF424ShortHappyPathTestData = (
  suffix: number,
): Record<string, string> => {
  const shortSuffix = toHappyPathSuffix(suffix);

  return {
    // Section 5 - Applicant Information
    organization_name: `Org ${shortSuffix}`,
    applicant_street1: `${shortSuffix} Main St`,
    applicant_street2: `Suite ${shortSuffix}`,
    applicant_city: `City ${shortSuffix}`,
    applicant_state: "AL: Alabama",
    applicant_country: "USA: UNITED STATES",
    applicant_zip_code: "12345",
    applicant_web_address: `https://example${shortSuffix}.org`,
    // TODO: value shape depends on the MultiSelect widget implementation - see the
    // applicant_type_code__multiselect TODO in sf424-short-field-definitions.ts.
    applicant_type_code__multiselect: "C: City or Township Government",
    employer_taxpayer_identification_number: "44-4444444",
    congressional_district_applicant: "00-000",

    // Section 6 - Project Information
    project_title: `Project ${shortSuffix}`,
    project_description: `Project description ${shortSuffix}`,
    project_start_date: "2030-10-01",
    project_end_date: "2036-10-31",

    // Section 7 - Project Director
    project_director_prefix: `PD${shortSuffix}`,
    project_director_first_name: `PDFirst${shortSuffix}`,
    project_director_middle_name: `PDMid${shortSuffix}`,
    project_director_last_name: `PDLast${shortSuffix}`,
    project_director_suffix: `PDS${shortSuffix}`,
    project_director_title: `PDTitle${shortSuffix}`,
    project_director_email: `pd${shortSuffix}@example.com`,
    project_director_phone_number: "8888888888",
    project_director_fax: "8888888888",
    project_director_street1: `${shortSuffix} Director Ave`,
    project_director_street2: `Suite ${shortSuffix}`,
    project_director_city: `City ${shortSuffix}`,
    project_director_state: "AL: Alabama",
    project_director_country: "USA: UNITED STATES",
    project_director_zip_code: "12345",

    // Section 8 - Primary Contact/Grants Administrator
    // Filled independently rather than via "Same as Project Director" -
    // see the note on same_as_project_director in the field definitions.
    contact_person_prefix: `CP${shortSuffix}`,
    contact_person_first_name: `CPFirst${shortSuffix}`,
    contact_person_middle_name: `CPMid${shortSuffix}`,
    contact_person_last_name: `CPLast${shortSuffix}`,
    contact_person_suffix: `CPS${shortSuffix}`,
    contact_person_title: `CPTitle${shortSuffix}`,
    contact_person_email: `cp${shortSuffix}@example.com`,
    contact_person_phone_number: "8888888888",
    contact_person_fax: "8888888888",
    contact_person_street1: `${shortSuffix} Contact Ave`,
    contact_person_street2: `Suite ${shortSuffix}`,
    contact_person_city: `City ${shortSuffix}`,
    contact_person_state: "AL: Alabama",
    contact_person_country: "USA: UNITED STATES",
    contact_person_zip_code: "12345",

    // Section 9 - Authorized Representative
    application_certification: "true",
    authorized_representative_prefix: `AR${shortSuffix}`,
    authorized_representative_first_name: `ARFirst${shortSuffix}`,
    authorized_representative_middle_name: `ARMid${shortSuffix}`,
    authorized_representative_last_name: `ARLast${shortSuffix}`,
    authorized_representative_suffix: `ARS${shortSuffix}`,
    authorized_representative_title: `ARTitle${shortSuffix}`,
    authorized_representative_phone_number: "2222222222",
    authorized_representative_fax: "3333333333",
    authorized_representative_email: `aor${shortSuffix}@test.com`,
  } satisfies Partial<Record<keyof typeof fieldDefinitionsSF424Short, string>>;
};

/**
 * Contains opportunity metadata, expected prepopulated field values, and the form-specific
 * test data builder. Imported by load-opportunity-config.ts to build the opportunity registry.
 *
 * TODO: this opportunity ID/number is a placeholder - an actual SF-424 Short opportunity
 * needs to be seeded (see the SF424 pattern in build_automatic_opportunities.py) and
 * registered in load-opportunity-config.ts before this fixture can run.
 */
export const SF424_SHORT_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "425c2ffe-6fbd-4852-ab72-b64467fe3df0",
  opportunityNumber: "E2E-SF424SHORT-ORG-IND-01",
  formKey: "sf424short",
  expectedPrepopulatedFields: {
    funding_opportunity_number: "E2E-SF424SHORT-ORG-IND-01",
    funding_opportunity_title: "E2E SF-424 Short Organizational ORG IND OT01",
    assistance_listing_number: "10.960",
    agency_name: "Simpler Grants.gov",
    assistance_listing_program_title: "Technical Agricultural Assistance",
  },
  buildTestData: buildSF424ShortHappyPathTestData,
};
