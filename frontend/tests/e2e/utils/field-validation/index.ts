// Main orchestrator
export { validateFieldConstraints } from "./validate-field-constraints";

// Types
export type {
  FieldConfig,
  FieldType,
  FieldValidationResult,
  ValidationMode,
  ValidationSummaryReport,
} from "./types/field-config";

// Validators (individually importable for custom composition)
export { validateLengthConstraints } from "./validators/length-validator";
export { validateNumericConstraints } from "./validators/numeric-validator";
export {
  validateRequiredField,
  validateRequiredFieldAcceptsValue,
} from "./validators/required-validator";
export { validatePatternConstraint } from "./validators/pattern-validator";
export { validateTypeInputConstraints } from "./validators/type-input-validator";

// Utilities
export {
  generateStringOfLength,
  generateLengthBoundaryValues,
  generateNumericBoundaryValues,
  detectConstraintsFromDom,
} from "./utils/test-data-generators";
export {
  fillAndBlur,
  clearAndBlur,
  getFieldValue,
  getFieldValueLength,
  waitAndScrollToField,
  getDomMaxLength,
} from "./utils/interaction-helpers";
export {
  assertInlineErrorVisible,
  assertNoInlineError,
  assertFieldValue,
  assertMaxLengthEnforced,
} from "./utils/assertion-helpers";
export {
  printValidationReport,
  attachReportToTest,
  createEmptySummaryReport,
  appendToReport,
} from "./utils/validation-reporter";

// Config builder (derive FieldConfig[] from any FormFillFieldDefinitions)
export {
  buildValidationConfig,
} from "./utils/build-validation-config";
export type { TypeInputProbe } from "./utils/test-data-generators";
export { generateTypeSpecificInvalidValues } from "./utils/test-data-generators";
export type { FieldOverride, FieldConfigOverrides } from "./utils/build-validation-config";
