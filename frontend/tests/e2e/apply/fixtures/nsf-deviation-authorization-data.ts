import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

export const NSF_DEVIATION_AUTHORIZATION_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "6d58e0cb-9b08-5732-b4a5-4df7f8cedfa7",
  opportunityNumber: "E2E-NSFDA-ORG-IND-01",
  formKey: "nsfDeviationAuthorization",
  expectedPrepopulatedFields: {},
  buildTestData: () => ({
    deviationAuthorization:
      "Authorized deviation & scope <A>.\nContact the program officer.",
  }),
};
