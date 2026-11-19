import {
  OTHER_NARRATIVE_GENERATED_OPPORTUNITY_DATA,
  OTHER_NARRATIVE_OPPORTUNITY_DATA,
} from "tests/e2e/apply/fixtures/other-narrative-attachment-data";
import { testAttachmentSubmissionAndPrint } from "tests/e2e/utils/submission/attachment-submission-utils";

testAttachmentSubmissionAndPrint({
  formLabel: "Other Narrative Attachments (Handwritten)",
  opportunityNumber: OTHER_NARRATIVE_OPPORTUNITY_DATA.opportunityNumber,
  attachmentField: "attachments",
  attachmentSectionId: "form-section-otherNarrativeFiles",
});
testAttachmentSubmissionAndPrint({
  formLabel: "Other Narrative Attachments (Generated)",
  opportunityNumber:
    OTHER_NARRATIVE_GENERATED_OPPORTUNITY_DATA.opportunityNumber,
  attachmentField: "attachments",
  attachmentSectionId: "form-section-1-other-narrative-file-s",
});
