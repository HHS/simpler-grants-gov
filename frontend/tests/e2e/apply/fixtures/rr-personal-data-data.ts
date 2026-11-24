import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

export const RR_PERSONAL_DATA_GENERATED_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "34f51b1c-f338-569e-8df0-db9121de06b5",
  opportunityNumber: "E2E-RRPD-ORG-IND-01",
  formKey: "rrPersonalDataGenerated",
  expectedPrepopulatedFields: {},
  buildTestData: (suffix) => ({
    firstName: "Avery",
    lastName: `Example ${suffix}`,
  }),
};
