import { budgetNarrativeAttachmentHappyPathTestData } from "tests/e2e/apply/fixtures/budget-narrative-attachment-fill-data";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

const buildTestData = (): Record<string, string> => ({
  ...budgetNarrativeAttachmentHappyPathTestData,
});

export const BUDGET_NARRATIVE_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "caea0f33-b356-4fcd-aae3-c0244e11da1e",
  opportunityNumber: "E2E-BNA-ORG-IND-01",
  formKey: "budgetNarrative",
  expectedPrepopulatedFields: {},
  buildTestData,
};

export const BUDGET_NARRATIVE_GENERATED_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "c45674bf-a5e8-4f90-b098-ff5158f08c5e",
  opportunityNumber: "E2E-BNAG-ORG-IND-01",
  formKey: "budgetNarrativeGenerated",
  expectedPrepopulatedFields: {},
  buildTestData,
};
