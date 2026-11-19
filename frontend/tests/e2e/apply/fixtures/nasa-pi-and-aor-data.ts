import type { fieldDefinitionsNasaPIAndAOR } from "tests/e2e/apply/fixtures/nasa-pi-and-aor-field-definitions";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

/**
 * Happy-path test data builder for the NASA - PI and AOR Supplemental Data Sheet.
 * Generates unique values using a numeric suffix to prevent collisions across runs.
 */
export const buildNasaPIAndAORHappyPathTestData = (
  suffix: number,
): Record<string, string> =>
  ({
    aorPrefix: "Ms.",
    aorFirstName: `AOR FIRST ${suffix}`,
    aorMiddleName: "M",
    aorLastName: `AOR LAST ${suffix}`,
    aorSuffix: "Jr.",
    aorNspiresUsername: `aor-${suffix}`,
    piPrefix: "Dr.",
    piFirstName: `PI FIRST ${suffix}`,
    piLastName: `PI LAST ${suffix}`,
    piUsGovernmentParticipation: "Yes",
    piFederalAgency:
      "141: National Oceanic and Atmospheric Administration (NOAA)",
    piFederalAgencyDollar: "125000.00",
    piInternationalParticipation: "Yes",
  }) satisfies Partial<
    Record<keyof typeof fieldDefinitionsNasaPIAndAOR, string>
  >;

/**
 * Opportunity data for the NASA - PI and AOR Supplemental Data Sheet, generated from
 * forms/specs. Seeded as E2E-NASAPIAORG by build_automatic_opportunities.py and
 * seed_local_db.py. Imported by load-opportunity-config.ts to build the opportunity registry.
 */
export const NASA_PI_AND_AOR_GENERATED_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "17281277-7149-4a77-b13e-89fe7e2f344a",
  opportunityNumber: "E2E-NASAPIAORG-ORG-IND-01",
  formKey: "nasaPIAndAORGenerated",
  expectedPrepopulatedFields: {},
  buildTestData: buildNasaPIAndAORHappyPathTestData,
};
