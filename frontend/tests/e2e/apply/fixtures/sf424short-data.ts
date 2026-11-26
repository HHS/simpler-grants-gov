import type {
  fieldDefinitionsSF424Short,
  fieldDefinitionsSF424ShortGenerated,
} from "tests/e2e/apply/fixtures/sf424short-field-definitions";
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
    applicant_zip_code: "12345-6789",
    applicant_web_address: `https://example${shortSuffix}.org`,
    // applicant_type_code is an array field (type: array, minItems: 1, maxItems: 3)
    // Backend schema has MultiSelect widget - test passes array of selected codes
    applicant_type_code: "C: City or Township Government",
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
    project_director_zip_code: "12345-6789",

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
    contact_person_zip_code: "12345-6789",

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
 **/
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

/**
 * Happy-path test data builder for the SF-424 Short generated from forms/specs.
 */
export const buildSF424ShortGeneratedHappyPathTestData = (
  suffix: number,
): Record<string, string> => {
  const shortSuffix = toHappyPathSuffix(suffix);

  return {
    organizationName: `Org ${shortSuffix}`,
    applicantStreet1: `${shortSuffix} Main St`,
    applicantStreet2: `Suite ${shortSuffix}`,
    applicantCity: `City ${shortSuffix}`,
    applicantState: "AL: Alabama",
    applicantCountry: "USA: UNITED STATES",
    applicantZipCode: "12345-6789",
    webAddress: `https://example${shortSuffix}.org`,
    applicantTypeCodes: "C: City or Township Government",
    ein: "44-4444444",
    congressionalDistrict: "00-000",
    projectTitle: `Project ${shortSuffix}`,
    projectDescription: `Project description ${shortSuffix}`,
    projectStartDate: "2030-10-01",
    projectEndDate: "2036-10-31",
    projectDirectorPrefix: "Dr.",
    projectDirectorFirstName: `PDFirst${shortSuffix}`,
    projectDirectorMiddleName: `PDMid${shortSuffix}`,
    projectDirectorLastName: `PDLast${shortSuffix}`,
    projectDirectorSuffix: "Jr.",
    projectDirectorTitle: `PDTitle${shortSuffix}`,
    projectDirectorStreet1: `${shortSuffix} Director Ave`,
    projectDirectorStreet2: `Suite ${shortSuffix}`,
    projectDirectorCity: `City ${shortSuffix}`,
    projectDirectorState: "AL: Alabama",
    projectDirectorCountry: "USA: UNITED STATES",
    projectDirectorZipCode: "12345-6789",
    projectDirectorPhone: "8888888888",
    projectDirectorFax: "8888888888",
    projectDirectorEmail: `pd${shortSuffix}@example.com`,
    pointOfContactPrefix: "Ms.",
    pointOfContactFirstName: `CPFirst${shortSuffix}`,
    pointOfContactMiddleName: `CPMid${shortSuffix}`,
    pointOfContactLastName: `CPLast${shortSuffix}`,
    pointOfContactSuffix: "Sr.",
    pointOfContactTitle: `CPTitle${shortSuffix}`,
    pointOfContactStreet1: `${shortSuffix} Contact Ave`,
    pointOfContactStreet2: `Suite ${shortSuffix}`,
    pointOfContactCity: `City ${shortSuffix}`,
    pointOfContactState: "AL: Alabama",
    pointOfContactCountry: "USA: UNITED STATES",
    pointOfContactZipCode: "12345-6789",
    pointOfContactPhone: "8888888888",
    pointOfContactFax: "8888888888",
    pointOfContactEmail: `cp${shortSuffix}@example.com`,
    agree: "true",
    authorizedRepresentativePrefix: "Mr.",
    authorizedRepresentativeFirstName: `ARFirst${shortSuffix}`,
    authorizedRepresentativeMiddleName: `ARMid${shortSuffix}`,
    authorizedRepresentativeLastName: `ARLast${shortSuffix}`,
    authorizedRepresentativeSuffix: "III",
    authorizedRepresentativeTitle: `ARTitle${shortSuffix}`,
    authorizedRepresentativeEmail: `aor${shortSuffix}@test.com`,
    authorizedRepresentativePhone: "2222222222",
    authorizedRepresentativeFax: "3333333333",
  } satisfies Partial<
    Record<keyof typeof fieldDefinitionsSF424ShortGenerated, string>
  >;
};

/**
 * Opportunity data for the SF-424 Short generated from forms/specs. Seeded as
 * E2E-SF424SHORTG by build_automatic_opportunities.py and seed_local_db.py.
 */
export const SF424_SHORT_GENERATED_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "349938c3-85b2-44ab-bd38-2c6ffc3d9b91",
  opportunityNumber: "E2E-SF424SHORTG-ORG-IND-01",
  formKey: "sf424shortGenerated",
  expectedPrepopulatedFields: {
    "opportunity--number": "E2E-SF424SHORTG-ORG-IND-01",
    "opportunity--title":
      "E2E SF-424 Short Organizational (Generated) ORG IND OT01",
    "opportunity--assistance_listing--number": "10.960",
    "opportunity--agency_name": "Simpler Grants.gov",
    "opportunity--assistance_listing--title":
      "Technical Agricultural Assistance",
  },
  buildTestData: buildSF424ShortGeneratedHappyPathTestData,
};

/**
 * Each SF-424 Short form the SF-424 Short specs run against, with the test IDs of the
 * fields Grants.gov fills on submission.
 */
export const SF424_SHORT_OPPORTUNITIES = [
  {
    formLabel: "SF-424 Short",
    opportunityNumber: SF424_SHORT_OPPORTUNITY_DATA.opportunityNumber,
    formKey: SF424_SHORT_OPPORTUNITY_DATA.formKey,
    postPopulatedTestIds: [
      "aor_signature",
      "authorized_representative_date_signed",
    ],
  },
  {
    formLabel: "SF-424 Short (Generated)",
    opportunityNumber: SF424_SHORT_GENERATED_OPPORTUNITY_DATA.opportunityNumber,
    formKey: SF424_SHORT_GENERATED_OPPORTUNITY_DATA.formKey,
    postPopulatedTestIds: [
      "certification--signature",
      "certification--date_signed",
    ],
  },
] as const;
