import type { SUPP_COVER_SHEET_NEH_FORM_CONFIG } from "tests/e2e/apply/fixtures/supp-cover-sheet-neh-grantsprogram-field-definitions";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";
import { toHappyPathSuffix } from "tests/e2e/utils/submission/print-view-utils";

/**
 * Happy-path test data builder for the Supplementary Cover Sheet for NEH Grant Programs form.
 * Generates unique values using a numeric suffix to prevent collisions across runs.
 * Most fields are dropdowns or monetary amounts and remain static; only free-text
 * identifier fields use the suffix.
 */
export const buildSuppCoverSheetNEHHappyPathTestData = (
  suffix: number,
): Record<string, string> => {
  const shortSuffix = toHappyPathSuffix(suffix);

  return {
    // Section 1 - Project Director
    major_field: "Arts: General",

    // Section 2 - Institution Information
    organization_type: "1326: Center For Advanced Study/Research Institute",

    // Section 3 - Project Funding
    "funding_group--outright_funds": "1",
    "funding_group--federal_match": "1",
    "funding_group--cost_sharing": "1",

    // Section 4 - Application Information
    // Radio: No — additional_funding = false
    "application_info--additional_funding": "false",
    application_type: "New",
    supplemental_grant_numbers: `Grant ${shortSuffix}`,
    primary_project_discipline: "Arts: General",
    secondary_project_discipline: "Arts: General",
    tertiary_project_discipline: "Arts: General",
  } satisfies Partial<
    Record<keyof typeof SUPP_COVER_SHEET_NEH_FORM_CONFIG.fields, string>
  >;
};

/**
 * Contains opportunity metadata, expected prepopulated field values, and the form-specific test data builder.
 * Imported by load-opportunity-config.ts to build the opportunity registry.
 */
export const SUPP_COVER_SHEET_NEH_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "b88287e2-7e2a-4c99-8ffe-30ab50c388ef",
  opportunityNumber: "E2E-NEHCS-ORG-IND-01",
  formKey: "suppCoverSheetNEH",
  expectedPrepopulatedFields: {},
  buildTestData: buildSuppCoverSheetNEHHappyPathTestData,
};
