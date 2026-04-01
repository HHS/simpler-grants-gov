import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";

export const fieldDefinitionsProjectAbstractSummary: FormFillFieldDefinitions =
  {
    applicantName: {
      testId: "applicant_name",
      type: "text",
      field: "Applicant Name",
    },
    projectTitle: {
      testId: "project_title",
      type: "text",
      field: "Project Title",
    },
    abstract: {
      testId: "textarea",
      type: "text",
      field: "Abstract",
    },
  };

export const PROJECT_ABSTRACT_SUMMARY_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "Project Abstract Summary",
  fields: fieldDefinitionsProjectAbstractSummary,
} as const;
