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

export type FieldHandler = (
  testInfo: TestInfo,
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
) => Promise<void>;

// Helper function to check if a field depends on another field
export function fieldDependsOn(
  field: FillFieldDefinition,
  formData: Record<string, unknown>,
): boolean {
  return (
    !field.dependsOn ||
    String(formData[field.dependsOn.field]) === String(field.dependsOn.value)
  );
}
