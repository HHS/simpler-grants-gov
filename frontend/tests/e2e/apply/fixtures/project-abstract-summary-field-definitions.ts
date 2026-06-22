import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
import { FORM_DEFAULTS } from "tests/e2e/utils/forms/form-defaults";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

export const PROJECT_ABSTRACT_SUMMARY_FORM_MATCHER =
  /Project\s+Abstract\s+Summary/i;

// Field ID mapping for API schema to test field IDs
export const PROJECT_ABSTRACT_SUMMARY_FIELD_ID_MAP: Record<string, string> = {
  "applicant_name": "applicant_name",
  "project_title": "project_title",
  "project_abstract": "project_abstract",
};

// maxLength values sourced from:
// api/src/form_schema/forms/project_abstract_summary/1/0/form_json.py
// api/src/form_schema/shared/common_shared.py (organization_name)
export const fieldDefinitionsProjectAbstractSummary: FormFillFieldDefinitions =
  {
    applicantName: {
      testId: "applicant_name",
      type: "text",
      maxLength: 60, // organization_name ref in common_shared.py
      field: "Applicant Name",
    },
    projectTitle: {
      testId: "project_title",
      type: "text",
      maxLength: 250, // FORM_JSON_SCHEMA.properties.project_title
      field: "Project Title",
    },
    abstract: {
      testId: "textarea",
      printTestId: "project_abstract",
      type: "text",
      maxLength: 4000, // FORM_JSON_SCHEMA.properties.project_abstract
      field: "Abstract",
    },
  };

export const PROJECT_ABSTRACT_SUMMARY_FORM_CONFIG = {
  ...FORM_DEFAULTS,
  formName: "Project Abstract Summary",
  fields: fieldDefinitionsProjectAbstractSummary,
} as const;

