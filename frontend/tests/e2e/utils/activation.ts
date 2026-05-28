// activation.ts
// Shared activation logic for boolean-like values used by radio and checkbox handlers.
// Usage: import { shouldActivateField } from './activation';

/**
 * Determines whether a radio button or checkbox field should be activated (checked/selected).
 * Returns true if the data is boolean true, or a string that is not undefined and not equal to "false" (case-insensitive).
 * Returns false for boolean false, undefined, or the string "false".
 */
export function shouldActivateField(
  data: string | boolean | undefined,
): boolean {
  if (typeof data === "boolean") {
    return data;
  }
  return data !== undefined && data.toLowerCase() !== "false";
}
