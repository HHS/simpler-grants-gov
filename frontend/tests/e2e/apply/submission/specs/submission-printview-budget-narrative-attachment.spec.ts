import {
  BUDGET_NARRATIVE_GENERATED_OPPORTUNITY_DATA,
  BUDGET_NARRATIVE_OPPORTUNITY_DATA,
} from "tests/e2e/apply/fixtures/budget-narrative-attachment-data";
import { testAttachmentSubmissionAndPrint } from "tests/e2e/utils/submission/attachment-submission-utils";

testAttachmentSubmissionAndPrint({
  formLabel: "Budget Narrative Attachment Form (Handwritten)",
  opportunityNumber: BUDGET_NARRATIVE_OPPORTUNITY_DATA.opportunityNumber,
  attachmentField: "attachments",
  attachmentSectionId: "form-section-budgetNarrativeFiles",
});
testAttachmentSubmissionAndPrint({
  formLabel: "Budget Narrative Attachment Form (Generated)",
  opportunityNumber:
    BUDGET_NARRATIVE_GENERATED_OPPORTUNITY_DATA.opportunityNumber,
  attachmentField: "attachments",
  attachmentSectionId: "form-section-1-budget-narrative-file-s",
});
