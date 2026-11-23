import { ED_ABSTRACT_GENERATED_OPPORTUNITY_DATA } from "tests/e2e/apply/fixtures/ed-abstract-form-data";
import { testAttachmentSubmissionAndPrint } from "tests/e2e/utils/submission/attachment-submission-utils";

testAttachmentSubmissionAndPrint({
  formLabel: "ED Abstract Form",
  opportunityNumber: ED_ABSTRACT_GENERATED_OPPORTUNITY_DATA.opportunityNumber,
  attachmentField: "attachment",
  attachmentSectionId: "form-section-abstract",
});
