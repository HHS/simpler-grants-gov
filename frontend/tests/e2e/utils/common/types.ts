/**
 * Shared E2E type contracts used across metadata fixtures and common helpers.
 *
 * Sections in this file:
 * - Field interaction types used by page-fill handlers.
 * - Metadata types used by feature field-definition fixtures.
 * - Form/page config types used by reusable fill utilities.
 */

import { Page } from "@playwright/test";

/** Supported field input types used by E2E form handlers. */
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
  /** Field metadata used by type-specific handlers to locate and fill page fields. */
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
  /**
   * Optional override for the testId used when asserting this field in a
   * read-only/print view context. When present, the loader uses this instead
   * of `testId` to locate the field in the print view output.
   * Example: abstract input has testId "textarea" but prints as "project_abstract".
   */
  printTestId?: string;
  /**
   * Maximum character length for this field, sourced from the form's
   * FORM_JSON_SCHEMA in api/src/form_schema/forms/. Used by happy-path
   * test data builders to ensure generated values stay within field limits.
   */
  maxLength?: number;
  dependsOn?: {
    field: string;
    value: string | boolean;
  };
  /**
   * Explicitly allow checkbox locators that intentionally match a group.
   * When true and multiple checkboxes match, handlers select one option for
   * truthy data instead of throwing an ambiguity error.
   */
  selectFirstInGroup?: boolean;
}

/** Value primitives accepted by metadata-driven fill helpers. */
export type FieldValue = string | boolean;

/**
 * Domain-level metadata shape used by shared page-fill builders.
 * Omits runtime-only props and adds required/value-key semantics.
 */
export type MetadataPageFieldDefinition<TValueKey extends string = string> =
  Omit<FillFieldDefinition, "field" | "label" | "labelExact"> & {
    label: string;
    valueKey: TValueKey;
    exact?: boolean;
    required?: boolean;
  };

/** Validation messages commonly reused across feature metadata definitions. */
export type ValidationMetadata = {
  requiredFieldMessage?: string;
  emailValidationMessage?: string;
  negativeNumberValidationMessage?: string;
  characterLimitValidationMessage?: string;
};

/** Optional duplicate-check pattern for metadata-driven uniqueness assertions. */
export type DuplicateValidationMetadata = {
  duplicateValidationPattern?: string;
};

/** Map of logical field identifiers to their runtime fill definitions. */
export type FormFillFieldDefinitions = {
  [fieldIdentifier: string]: FillFieldDefinition;
};

/** Shared config contract for form-level fill/save helper utilities. */
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

/** Optional behavior flags when filling a page with field metadata. */
export type FillPageFieldsOptions = {
  continueOnError?: boolean;
};

/** Contract implemented by each field-type handler. */
export type FieldHandler = (
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
) => Promise<void>;

/** Returns true when a field dependency is absent or currently satisfied. */
export function shouldFillField(
  field: FillFieldDefinition,
  formData: Record<string, unknown>,
): boolean {
  return (
    !field.dependsOn ||
    String(formData[field.dependsOn.field]) === String(field.dependsOn.value)
  );
}
