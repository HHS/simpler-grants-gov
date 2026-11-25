import path from "node:path";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

const buildTestData = (): Record<string, string> => ({
  is_us_citizen_or_national: "Yes",
  research_strategy: path.resolve(
    "tests/e2e/test-upload-files/sample-upload-kb.pdf",
  ),
});

export const PHS_CAREER_DEVELOPMENT_GENERATED_OPPORTUNITY_DATA: PrintViewFormData =
  {
    opportunityId: "a0338d21-e63b-4b66-a40a-cc5a95a1e055",
    opportunityNumber: "E2E-PCDG-ORG-IND-01",
    formKey: "phsCareerDevelopmentGenerated",
    expectedPrepopulatedFields: {},
    buildTestData,
  };
