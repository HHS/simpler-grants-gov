import path from "node:path";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

const buildTestData = (): Record<string, string> => ({
  research_strategy: path.resolve(
    "tests/e2e/test-upload-files/sample-upload-kb.pdf",
  ),
});

export const PHS_RESEARCH_PLAN_GENERATED_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "42e83601-97ac-5980-9fb1-577d2e1735f5",
  opportunityNumber: "E2E-PHSRP-ORG-IND-01",
  formKey: "phsResearchPlanGenerated",
  expectedPrepopulatedFields: {},
  buildTestData,
};
