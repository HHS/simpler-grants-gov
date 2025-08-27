import type { EnumOptionsType, StrictRJSFSchema } from "@rjsf/utils";

/**
 * Convert any value to a string, treating null/undefined as empty.
 * Use for stable equality checks (e.g., comparing against JSON Schema const).
 */
export function stringifyOrEmpty(value: unknown): string {
  return value == null ? "" : String(value);
}

/** Convert "true"/"false" to boolean, else undefined. */
export function fromBooleanString(value: unknown): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

/** Type guard for "true" | "false". */
export function isBooleanString(value: unknown): value is "true" | "false" {
  return value === "true" || value === "false";
}

/** Convert an input value to "true" | "false" | "" for DOM binding. */
export function toBooleanString(value: unknown): "" | "true" | "false" {
  if (value === true || value === "true") return "true";
  if (value === false || value === "false") return "false";
  return "";
}

/**
 * Coerce the current value so it can be compared to an option value.
 * Special-cases radios whose options are "true"/"false".
 */
export function normalizeForCompare(
  optionValue: unknown,
  current: unknown,
): unknown {
  if (isBooleanString(optionValue)) {
    if (current === true) return "true";
    if (current === false) return "false";
    if (isBooleanString(current)) return current;
    return undefined;
  }
  return current;
}

/**
 * Parse a radio's string value back into the expected type.
 * - If options contain "true"/"false", return a boolean.
 * - Otherwise, if we can find the option by stringifying its value, return the *original* value
 *   (preserves numbers, etc.). As a fallback, return the raw string.
 */
export function parseFromInputValue<S extends StrictRJSFSchema>(
  raw: string,
  enumOptions: ReadonlyArray<EnumOptionsType<S>>,
): boolean | string | number {
  const usesBooleanStrings = enumOptions.some((opt) =>
    isBooleanString(opt.value),
  );
  if (usesBooleanStrings) return raw === "true";

  const hit = enumOptions.find((opt) => String(opt.value) === raw);
  return hit ? (hit.value as boolean | string | number) : raw;
}
