import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

/**
 * Opportunity data for the Project Abstract Summary form.
 * Contains opportunity metadata and expected prepopulated field values.
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
};
