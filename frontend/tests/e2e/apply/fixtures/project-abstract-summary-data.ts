import type { fieldDefinitionsProjectAbstractSummary } from "tests/e2e/apply/fixtures/project-abstract-summary-field-definitions";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

/**
 * Happy-path test data builder for the Project Abstract Summary form.
 * Generates unique values using a numeric suffix to prevent collisions across runs.
 */
export const buildProjectAbstractSummaryHappyPathTestData = (
  suffix: number,
): Record<string, string> =>
  ({
    applicantName: `TESTER BR ${suffix}`,
    projectTitle: `TESTING ${suffix}`,
    abstract: `This is a print view automation test ${suffix}`,
  }) satisfies Partial<
    Record<keyof typeof fieldDefinitionsProjectAbstractSummary, string>
  >;

/**
 * Opportunity data for the Project Abstract Summary form.
 * Contains opportunity metadata, expected prepopulated field values,
 * and the form-specific test data builder.
 * Imported by load-opportunity-config.ts to build the opportunity registry.
 */
export const PROJECT_ABSTRACT_SUMMARY_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "f21dc67e-84d8-4e2b-ae3e-2d68f83957db",
  opportunityNumber: "TEST-PRINT-ORG-IND-ON01",
  formKey: "projectAbstractSummary",
  expectedPrepopulatedFields: {
    funding_opportunity_number: "TEST-PRINT-ORG-IND-ON01",
    assistance_listing_number: /\d{2}\.[A-Z0-9]{3}/i,
  },
  buildTestData: buildProjectAbstractSummaryHappyPathTestData,
};
