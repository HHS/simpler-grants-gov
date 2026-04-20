import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FormFillFieldDefinitions } from "tests/e2e/utils/forms/general-forms-filling";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

export const PROJECT_ABSTRACT_SUMMARY_FORM_MATCHER =
  /Project\s+Abstract\s+Summary/i;

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

export const PROJECT_ABSTRACT_SUMMARY_REQUIRED_FIELD_ERRORS: FieldError[] = [
  {
    fieldId: "applicant_name",
    message: "Applicant Name is required",
  },
  {
    fieldId: "project_title",
    message: "Descriptive Title of Applicants Project is required",
  },
  {
    fieldId: "project_abstract",
    message: "Project Abstract is required",
  },
];
