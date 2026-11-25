import { PHS_RESEARCH_TRAINING_GENERATED_OPPORTUNITY_DATA } from "tests/e2e/apply/fixtures/phs-research-training-data";
import { testAttachmentSubmissionAndPrint } from "tests/e2e/utils/submission/attachment-submission-utils";

testAttachmentSubmissionAndPrint({
  formLabel: "PHS 398 Research Training Program Plan",
  opportunityNumber:
    PHS_RESEARCH_TRAINING_GENERATED_OPPORTUNITY_DATA.opportunityNumber,
  attachmentField: "program_plan",
  attachmentSectionId: "form-section-training-program-section",
});
