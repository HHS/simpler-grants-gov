// types.ts
// Shared handler contract types for E2E field handlers.
// Usage: Import these types in all field handler files and the dispatcher.

import { Page, TestInfo } from "@playwright/test";

export type FieldType =
  | "text"
  | "dropdown"
  | "file"
  | "radiobutton"
  | "checkbox"
  | "combo-box-input";

export interface FillFieldDefinition {
  field: string;
  type: FieldType;
  testId?: string;
  selector?: string;
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
   * Optional form-specific hook called before the save button is clicked.
   * Use for pre-save interactions that cannot be expressed as a field definition.
   * e.g. SF-424A confirmation checkbox that only appears in this form.
   */
  beforeSave?: (page: Page) => Promise<void>;
}

export type FieldHandler = (
  testInfo: TestInfo,
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
