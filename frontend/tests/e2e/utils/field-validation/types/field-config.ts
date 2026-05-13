/**
 * Defines the validation mode for a form field.
 *
 * - `truncate`      — The UI enforces maxlength via HTML attribute; no error shown.
 * - `inline-error`  — An error element appears inline on the field after blur.
 * - `submit-error`  — Errors only surface after the form is submitted.
 */
export type ValidationMode = "truncate" | "inline-error" | "submit-error";

/**
 * Supported field input types for validation purposes.
 */
export type FieldType = "text" | "number" | "textarea" | "email" | "tel";

/**
 * Configuration for a single form field to be validated.
 */
export interface FieldConfig {
  /** Human-readable label for reporting */
  label: string;
  /** Playwright locator string (CSS selector, test ID, aria label, etc.) */
  locator: string;
  /** Input type — drives which validation rules apply */
  type: FieldType;
  /** Whether the field is required */
  required?: boolean;
  /** Minimum string character length */
  minLength?: number;
  /** Maximum string character length */
  maxLength?: number;
  /** Exact required string character length */
  exactLength?: number;
  /** Minimum numeric value (for number inputs) */
  min?: number;
  /** Maximum numeric value (for number inputs) */
  max?: number;
  /** Optional regex pattern the value must match */
  pattern?: RegExp;
  /** Locator for the inline error element tied to this field */
  errorLocator?: string;
  /** How the field surfaces validation feedback */
  validationMode?: ValidationMode;
  /**
   * If true, auto-detect maxlength / min / max from DOM attributes at runtime.
   * Values detected from DOM supplement (and take precedence over) config values.
   */
  autoDetectConstraints?: boolean;
}

/**
 * Validated result for a single rule check against a field.
 */
export interface FieldValidationResult {
  fieldLabel: string;
  validationType: string;
  inputValue: string;
  expectedBehavior: string;
  actualBehavior: string;
  passed: boolean;
}

/**
 * Aggregated summary report for all validated fields.
 */
export interface ValidationSummaryReport {
  totalChecks: number;
  passed: number;
  failed: number;
  results: FieldValidationResult[];
}
