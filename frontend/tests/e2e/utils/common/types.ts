// types.ts
// Shared contracts for E2E field definitions, handlers, and form fill config.
// Usage: import { FormFillFieldDefinitions } from "tests/e2e/utils/common/types";
// Usage: import { type FillFormConfig } from "tests/e2e/utils/common/types";

import { Page, TestInfo } from "@playwright/test";

export type FieldType =
  | "text"
  | "checkbox"
  | "textarea"
  | "email"
  | "select"
  | "date"
  | "dropdown"
  | "file"
  | "radiobutton"
  | "combo-box-input";

export interface FillFieldDefinition {
  // Field metadata used by type-specific handlers to locate and fill page fields.
  field: string;
  type: FieldType;
  testId?: string;
  selector?: string;
  label?: string;
  labelExact?: boolean;
  optionTestIdPrefix?: string;
  hasTextRegex?: string;
  getByText?: string;
  useDataAsText?: boolean;
  textExact?: boolean;
  section?: string;
  dependsOn?: {
    field: string;
    value: string | boolean;
  };
}

export type FormFillFieldDefinitions = {
  [fieldIdentifier: string]: FillFieldDefinition;
};

export interface FillFormConfig {
  formName: string | RegExp;
  fields: FormFillFieldDefinitions;
  saveButtonTestId: string;
  noErrorsText?: string;
  /**
   * Optional page-specific hook called before the save button is clicked.
   * Use for pre-save interactions that cannot be expressed as a field definition.
   * e.g. SF-424A confirmation checkbox that only appears on this page.
   */
  beforeSave?: (page: Page) => Promise<void>;
}

export type FillPageFieldsOptions = {
  continueOnError?: boolean;
};

export type FieldHandler = (
  testInfo: TestInfo | undefined,
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
) => Promise<void>;

// Returns true if the field has no dependency, or if its dependency is satisfied.
export function shouldFillField(
  field: FillFieldDefinition,
  formData: Record<string, unknown>,
): boolean {
  return (
    !field.dependsOn ||
    String(formData[field.dependsOn.field]) === String(field.dependsOn.value)
  );
}
