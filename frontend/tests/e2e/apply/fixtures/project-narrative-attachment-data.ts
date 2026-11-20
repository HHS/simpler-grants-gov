import { projectNarrativeAttachmentHappyPathTestData } from "tests/e2e/apply/fixtures/project-narrative-attachment-fill-data";
import type { PrintViewFormData } from "tests/e2e/utils/submission/opportunity-print-view.types";

// Both renderers use the existing upload field and the same file fixture.
const buildTestData = (_suffix: number): Record<string, string> => ({
  ...projectNarrativeAttachmentHappyPathTestData,
});

export const PROJECT_NARRATIVE_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "6bdc2df3-6e51-4aea-89af-bade326feba1",
  opportunityNumber: "E2E-PNA-ORG-IND-01",
  formKey: "projectNarrative",
  expectedPrepopulatedFields: {},
  buildTestData,
};

export const PROJECT_NARRATIVE_GENERATED_OPPORTUNITY_DATA: PrintViewFormData = {
  opportunityId: "3b41ad38-a4eb-43e2-b124-7ebf56b05b1a",
  opportunityNumber: "E2E-PNAG-ORG-IND-01",
  formKey: "projectNarrativeGenerated",
  expectedPrepopulatedFields: {},
  buildTestData,
};

export const PROJECT_NARRATIVE_OPPORTUNITIES = [
  {
    formLabel: "Project Narrative Attachment Form",
    opportunityNumber: PROJECT_NARRATIVE_OPPORTUNITY_DATA.opportunityNumber,
    attachmentSectionId: "form-section-projectNarrativeFiles",
  },
  {
    formLabel: "Project Narrative Attachment Form (Generated)",
    opportunityNumber:
      PROJECT_NARRATIVE_GENERATED_OPPORTUNITY_DATA.opportunityNumber,
    attachmentSectionId: "form-section-1-project-narrative-file-s",
  },
] as const;
