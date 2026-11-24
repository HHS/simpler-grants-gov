import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

export const NSF_SUGGESTED_REVIEWERS_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "97621d95-418a-4c00-96ab-3817c7dc7fe2",
  opportunityNumber: "E2E-NSFSR-ORG-IND-01",
  formKey: "nsfSuggestedReviewers",
  expectedPrepopulatedFields: {},
  buildTestData: () => ({
    suggestedReviewers:
      "Dr. Ada Example, Example University; microbial ecology & <soils>.",
    reviewersNotToInclude: "Dr. Ben Example; recent collaborator.",
  }),
};
