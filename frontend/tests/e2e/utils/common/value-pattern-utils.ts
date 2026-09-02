/**
 * Currency value pattern matching for form validation.
 * Used across tests to validate currency-formatted values with flexible formatting.
 */

/**
 * Creates a regex pattern that matches currency values with optional formatting.
 *
 * Transforms a numeric string into a regex that matches multiple representations:
 * - "1000" matches: "1000", "$1000", "$1,000", "$1,000.00"
 * - "5670" matches: "5670", "$5,670", "$5,670.00"
 *
 * This is useful for print views that may format currency differently across browsers
 * or CSS frameworks.
 *
 * Pattern is anchored with word boundaries to avoid partial matches.
 *
 * @param value - A numeric string to convert to a flexible pattern
 * @returns A RegExp that matches the value in various currency formats
 *
 * @example
 * const pattern = createFlexibleValuePattern("6300");
 * expect(locator).toContainText(pattern); // Matches "$6,300", "6300", "$6,300.00", etc.
 */
export function createFlexibleValuePattern(value: string): RegExp {
  // Split value into individual digit characters
  const digits = Array.from(value);

  // Join digits with optional comma separator (e.g., "6", "3", "0", "0" → "6,?3,?0,?0")
  // This allows matching "6300" or "6,300" (commas are optional)
  const digitPattern = digits.join(",?");

  // Add optional currency prefix ($), decimal places (.00), and word boundaries
  // Final pattern: \b\$?6,?3,?0,?0(\.\d{2})?\b
  // Matches: "$6300", "$6,300", "$6,300.00", "6300", "6300.00", etc.
  // Word boundaries prevent partial matches (e.g., "190%" won't match pattern for "90")
  return new RegExp(`\\b\\$?${digitPattern}(\\.\\d{2})?\\b`);
}
