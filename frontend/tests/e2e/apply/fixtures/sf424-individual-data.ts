import type { fieldDefinitionsSF424Individual } from "tests/e2e/apply/fixtures/sf424-individual-field-definitions";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";
import { toHappyPathSuffix } from "tests/e2e/utils/submission/print-view-utils";

/**
 * Happy-path test data builder for the Application for Federal Domestic Assistance -
 * Individual. Generates unique values using a numeric suffix to prevent collisions across
 * runs. The applicant isn't a U.S. citizen, so the conditional citizenship questions are
 * filled too.
 */
export const buildSF424IndividualHappyPathTestData = (
  suffix: number,
): Record<string, string> => {
  const shortSuffix = toHappyPathSuffix(suffix);

  return {
    prefix: "Dr.",
    firstName: `First${shortSuffix}`,
    middleName: `Mid${shortSuffix}`,
    lastName: `Last${shortSuffix}`,
    suffix: "PhD",
    phone: "4105550100",
    eveningPhone: "4105550101",
    fax: "4105550199",
    email: `applicant${shortSuffix}@example.com`,
    street1: `${shortSuffix} Grant Avenue`,
    street2: `Unit ${shortSuffix}`,
    city: `City ${shortSuffix}`,
    county: "Baltimore City",
    state: "MD: Maryland",
    country: "USA: UNITED STATES",
    zipCode: "21218-1234",
    isUsCitizen: "false",
    alienRegistrationNumber: `A${shortSuffix}`,
    citizenshipCountry: "URY: URUGUAY",
    residencyStartDate: "2025-01-15",
    congressionalDistrict: "MD-007",
    projectTitle: `Project ${shortSuffix}`,
    projectDescription: `Project description ${shortSuffix}`,
    startDate: "2030-10-01",
    endDate: "2031-09-30",
    agree: "true",
  } satisfies Partial<
    Record<keyof typeof fieldDefinitionsSF424Individual, string>
  >;
};

/**
 * Opportunity data for the Application for Federal Domestic Assistance - Individual,
 * generated from forms/specs. Seeded as E2E-SF424INDG by build_automatic_opportunities.py
 * and seed_local_db.py. Imported by load-opportunity-config.ts to build the opportunity
 * registry.
 */
export const SF424_INDIVIDUAL_GENERATED_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "9b289ebf-b283-4f99-8e52-2f5574b5d998",
  opportunityNumber: "E2E-SF424INDG-ORG-IND-01",
  formKey: "sf424IndividualGenerated",
  expectedPrepopulatedFields: {
    "opportunity--number": "E2E-SF424INDG-ORG-IND-01",
    "opportunity--title":
      "E2E Application for Federal Domestic Assistance - Individual (Generated) ORG IND OT01",
    "opportunity--agency_name": "Simpler Grants.gov",
    "opportunity--assistance_listing--number": "10.960",
    "opportunity--assistance_listing--title":
      "Technical Agricultural Assistance",
  },
  buildTestData: buildSF424IndividualHappyPathTestData,
};
