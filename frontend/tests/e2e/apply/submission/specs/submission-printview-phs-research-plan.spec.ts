import { PHS_RESEARCH_PLAN_GENERATED_OPPORTUNITY_DATA } from "tests/e2e/apply/fixtures/phs-research-plan-form-data";
import { testAttachmentSubmissionAndPrint } from "tests/e2e/utils/submission/attachment-submission-utils";

testAttachmentSubmissionAndPrint({
  formLabel: "PHS 398 Research Plan",
  opportunityNumber:
    PHS_RESEARCH_PLAN_GENERATED_OPPORTUNITY_DATA.opportunityNumber,
  attachmentField: "research_strategy",
  attachmentSectionId: "form-section-research-plan-section",
});
