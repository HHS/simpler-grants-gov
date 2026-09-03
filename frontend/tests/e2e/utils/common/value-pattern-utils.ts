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
 * Pattern uses word boundaries and negative lookbehind to avoid partial matches.
 * Only allows ".00" as a decimal suffix to prevent matching different cent amounts.
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

  // Use negative lookbehind (?<![,\d]) to prevent matching when digits or commas precede the pattern
  // This prevents "700" from matching the "700" in "1,700.00"
  // Use negative lookahead (?![.\d]) to prevent matching if followed by a period or digit
  // This prevents "$6300" from matching inside "$6300.50" (even though ".00" is optional)
  // Only allow ".00" as decimal suffix - other decimals will fail the lookahead
  // Final pattern: (?<![,\d])\b\$?6,?3,?0,?0(?:\.00)?(?![.\d])\b
  // Matches: "$6300", "$6,300", "$6,300.00", "6300", etc.
  // Does NOT match: "16300" (part of larger number), "$6300.50" (lookahead fails on "."), "1,700.00" for pattern "700"
  return new RegExp(`(?<![,\\d])\\b\\$?${digitPattern}(?:\\.00)?(?![.\\d])\\b`);
}
