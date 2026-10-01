import type { GRANTSGOV_LOBBYING_FORM_CONFIG } from "tests/e2e/apply/fixtures/grantsgov-lobbying-field-definitions";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";
import { toHappyPathSuffix } from "tests/e2e/utils/submission/print-view-utils";

/**
 * Happy-path test data builder for the Grants.gov Lobbying Form.
 * Generates unique values using a numeric suffix to prevent collisions across runs.
 * authorized_representative_signature and submitted_date are post-populated automatically
 * and are not user-entered fields.
 */
export const buildGrantsGovLobbyingHappyPathTestData = (
  suffix: number,
): Record<string, string> => {
  const shortSuffix = toHappyPathSuffix(suffix);

  return {
    // Section 2 – Applicant's Organization
    organization_name: `Org ${shortSuffix}`,
    // Section 3 – Authorized Representative
    authorized_representative_name_prefix: `AR${shortSuffix}`,
    authorized_representative_name_first_name: `ARFirst${shortSuffix}`,
    authorized_representative_name_middle_name: `ARMid${shortSuffix}`,
    authorized_representative_name_last_name: `ARLast${shortSuffix}`,
    authorized_representative_name_suffix: `ARS${shortSuffix}`,
    authorized_representative_title: `ARTitle${shortSuffix}`,
  } satisfies Partial<
    Record<keyof typeof GRANTSGOV_LOBBYING_FORM_CONFIG.fields, string>
  >;
};

/**
 * Contains opportunity metadata, expected prepopulated field values, and the form-specific test data builder.
 * Imported by load-opportunity-config.ts to build the opportunity registry.
 */
export const GRANTSGOV_LOBBYING_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "552d5866-501a-40b6-b1ce-2efc7a2d3aa5",
  opportunityNumber: "E2E-GGLOB-ORG-IND-01",
  formKey: "grantsGovLobbying",
  expectedPrepopulatedFields: {},
  buildTestData: buildGrantsGovLobbyingHappyPathTestData,
};
