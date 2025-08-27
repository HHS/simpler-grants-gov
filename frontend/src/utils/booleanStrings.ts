/** 
 * Type guard: boolean-string literals
 * */
export function isBooleanString(value: unknown): value is "true" | "false" {
  return value === "true" || value === "false";
}

/** 
 * Coerce input into a boolean string when it represents a boolean, else undefined
 * */
export function toBooleanString(
  value: unknown,
): "true" | "false" | undefined {
  if (value === true) return "true";
  if (value === false) return "false";
  if (isBooleanString(value)) return value;

  return undefined;
}

/** 
 * Convert a boolean string back into a boolean, else undefined
 * */
export function fromBooleanString(value: unknown): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;

  return undefined;
}