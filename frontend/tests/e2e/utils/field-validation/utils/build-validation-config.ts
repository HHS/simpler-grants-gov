import {
  FillFieldDefinition,
  FormFillFieldDefinitions,
} from "tests/e2e/utils/forms/general-forms-filling";
import { FieldConfig, FieldType, ValidationMode } from "../types/field-config";

/**
 * Per-field override for things the DOM cannot communicate automatically:
 *
 * - `errorLocator`    CSS selector for the inline error element (required by the
 *                     required-validator and inline-error length/pattern validators)
 * - `validationMode`  How the field surfaces errors. Defaults to "truncate".
 *                     Use "inline-error" when going over max shows an error element
 *                     instead of silently capping the value.
 * - `type`            Refined HTML input type ("tel", "email", "textarea").
 *                     FillFieldDefinition only distinguishes "text" vs non-text;
 *                     use this to inform validators of a more specific type.
 * - `pattern`         Explicit regex override (e.g. monetary format strings).
 * - `skip`            Set true to exclude a field that is typed as "text" in the
 *                     form definitions but is not boundary-testable (e.g. date
 *                     pickers, conditional / hidden fields).
 */
export interface FieldOverride {
  errorLocator?: string;
  validationMode?: ValidationMode;
  type?: FieldType;
  pattern?: RegExp;
  skip?: boolean;
}

/** Keyed by the field identifier used in FormFillFieldDefinitions */
export type FieldConfigOverrides = Record<string, FieldOverride>;

/**
 * Input types from FillFieldDefinition that are never boundary-testable.
 * These are filtered out automatically — no need to mark them with skip: true.
 */
const NON_TEXT_TYPES = new Set([
  "dropdown",
  "file",
  "radiobutton",
  "checkbox",
  "combo-box-input",
]);

/**
 * Builds a FieldConfig[] for validateFieldConstraints() from any existing
 * FormFillFieldDefinitions object.
 *
 * This is the recommended approach for adding field boundary validation to a
 * form. Instead of writing a separate config file that duplicates all the
 * locators, call this function with the form's existing field definitions and
 * supply only a thin overrides map for things the DOM cannot tell us.
 *
 * Locators and labels come from the field definitions (single source of truth).
 * Constraints (maxLength, minLength, min, max, required, pattern) are read from
 * the live DOM at test runtime via autoDetectConstraints — no manual duplication
 * of the API schema values is needed.
 *
 * Fields with non-text types (dropdown, file, radiobutton, checkbox,
 * combo-box-input) are automatically excluded. Date pickers and other special
 * cases that are typed as "text" in the definitions should be listed in the
 * overrides with { skip: true }.
 *
 * @example
 * // In a form-specific config file:
 * import { buildValidationConfig, FieldConfigOverrides } from "tests/e2e/utils/field-validation/utils/build-validation-config";
 * import { fieldDefinitionsMyForm } from "tests/e2e/apply/fixtures/my-form-field-definitions";
 *
 * const MY_FORM_OVERRIDES: FieldConfigOverrides = {
 *   project_start_date:  { skip: true },  // date picker
 *   email:               { type: "email", validationMode: "inline-error", errorLocator: "#error-for-email" },
 *   phone_number:        { type: "tel",   errorLocator: "#error-for-phone_number" },
 *   required_text_field: { errorLocator:  "#error-for-required_text_field" },
 * };
 *
 * export const MY_FORM_VALIDATION_CONFIG = buildValidationConfig(
 *   fieldDefinitionsMyForm,
 *   MY_FORM_OVERRIDES,
 * );
 *
 * @param formDefinitions The FormFillFieldDefinitions object from a *-field-definitions.ts file
 * @param overrides       Optional per-field overrides keyed by field definition key
 * @returns               FieldConfig[] ready for validateFieldConstraints()
 */
export function buildValidationConfig(
  formDefinitions: FormFillFieldDefinitions,
  overrides: FieldConfigOverrides = {},
): FieldConfig[] {
  const configs: FieldConfig[] = [];

  for (const [key, def] of Object.entries(formDefinitions)) {
    // Automatically skip non-text input types
    if (NON_TEXT_TYPES.has(def.type)) continue;

    // Skip fields explicitly excluded by the caller (date pickers, hidden conditional fields, etc.)
    if (overrides[key]?.skip) continue;

    const locator = buildLocator(def);
    if (!locator) continue; // no testId or selector — nothing to target

    const override = overrides[key] ?? {};

    configs.push({
      label: def.field,
      locator,
      type: override.type ?? "text",
      validationMode: override.validationMode ?? "truncate",
      errorLocator: override.errorLocator,
      pattern: override.pattern,
      // Always auto-detect so DOM maxlength/min/max/required are read at runtime.
      // This keeps the config in sync with the UI without any manual updates.
      autoDetectConstraints: true,
    });
  }

  return configs;
}

function buildLocator(def: FillFieldDefinition): string | null {
  if (def.testId) return `[data-testid="${def.testId}"]`;
  if (def.selector) return def.selector;
  return null;
}
