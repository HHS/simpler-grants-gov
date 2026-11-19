import {
  PROJECT_ABSTRACT_GENERATED_OPPORTUNITY_DATA,
  PROJECT_ABSTRACT_OPPORTUNITY_DATA,
} from "tests/e2e/apply/fixtures/project-abstract-data";
import { testAttachmentSubmissionAndPrint } from "tests/e2e/utils/submission/attachment-submission-utils";

testAttachmentSubmissionAndPrint({
  formLabel: "Project Abstract (Handwritten)",
  opportunityNumber: PROJECT_ABSTRACT_OPPORTUNITY_DATA.opportunityNumber,
  attachmentField: "attachment",
  attachmentSectionId: "form-section-projectAbstract",
});
testAttachmentSubmissionAndPrint({
  formLabel: "Project Abstract (Generated)",
  opportunityNumber:
    PROJECT_ABSTRACT_GENERATED_OPPORTUNITY_DATA.opportunityNumber,
  attachmentField: "attachment",
  attachmentSectionId: "form-section-project-abstract-file",
});
