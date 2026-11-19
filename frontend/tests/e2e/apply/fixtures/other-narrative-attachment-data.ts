import { otherNarrativeAttachmentHappyPathTestData } from "tests/e2e/apply/fixtures/other-narrative-attachment-fill-data";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

const buildTestData = (): Record<string, string> => ({
  ...otherNarrativeAttachmentHappyPathTestData,
});

export const OTHER_NARRATIVE_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "717b7f78-52f2-49f9-b1b8-5d7118313d2a",
  opportunityNumber: "E2E-ONA-ORG-IND-01",
  formKey: "otherNarrative",
  expectedPrepopulatedFields: {},
  buildTestData,
};

export const OTHER_NARRATIVE_GENERATED_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "3675dfde-0c28-44aa-a733-b3ce88b29b3a",
  opportunityNumber: "E2E-ONAG-ORG-IND-01",
  formKey: "otherNarrativeGenerated",
  expectedPrepopulatedFields: {},
  buildTestData,
};
