import path from "node:path";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

const buildTestData = (): Record<string, string> => ({
  program_plan: path.resolve(
    "tests/e2e/test-upload-files/sample-upload-kb.pdf",
  ),
});

export const PHS_RESEARCH_TRAINING_GENERATED_OPPORTUNITY_DATA: PrintViewFormData =
  {
    opportunityId: "1809b683-2b2f-4419-878f-ade5be1b9334",
    opportunityNumber: "E2E-PRTG-ORG-IND-01",
    formKey: "phsResearchTrainingGenerated",
    expectedPrepopulatedFields: {},
    buildTestData,
  };
