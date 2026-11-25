import { PHS_CAREER_DEVELOPMENT_GENERATED_OPPORTUNITY_DATA } from "tests/e2e/apply/fixtures/phs-career-development-data";
import { testAttachmentSubmissionAndPrint } from "tests/e2e/utils/submission/attachment-submission-utils";

testAttachmentSubmissionAndPrint({
  formLabel: "PHS 398 Career Development Award Supplemental Form",
  opportunityNumber:
    PHS_CAREER_DEVELOPMENT_GENERATED_OPPORTUNITY_DATA.opportunityNumber,
  attachmentField: "research_strategy",
  attachmentSectionId: "form-section-research-plan-section",
});
