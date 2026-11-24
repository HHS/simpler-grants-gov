import path from "node:path";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

const buildTestData = (): Record<string, string> => ({
  attachment: path.resolve("tests/e2e/test-upload-files/sample-upload-kb.pdf"),
});

export const ED_ABSTRACT_GENERATED_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "ea981400-e64a-4d17-a337-5b26b15f43cd",
  opportunityNumber: "E2E-EDAG-ORG-IND-01",
  formKey: "edAbstractGenerated",
  expectedPrepopulatedFields: {},
  buildTestData,
};
