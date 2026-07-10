// supported types by DynamicFieldLabel
export type DynamicLabelType = "default" | "hide-helper-text";

// Type guard to check if a value is a valid DynamicLabelType
export const isDynamicLabelType = (value: unknown): value is DynamicLabelType =>
  value === "default" || value === "hide-helper-text";

// returns a valid label type from a user-supplied value (from JSON Schema `options`)
export const getLabelTypeFromOptions = (
  value: unknown,
  fallback: DynamicLabelType = "default",
): DynamicLabelType => (isDynamicLabelType(value) ? value : fallback);
