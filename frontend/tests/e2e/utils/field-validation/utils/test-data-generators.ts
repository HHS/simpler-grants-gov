import { FieldConfig, FieldType } from "../types/field-config";

/**
 * Generates a string of a specific character length composed of a repeated character.
 *
 * @param length - Number of characters to generate
 * @param char   - Character to fill with (defaults to 'a')
 */
export function generateStringOfLength(length: number, char = "a"): string {
  return char.repeat(length);
}

/**
 * Generates boundary string values for a given min/max length range.
 *
 * Returns values one below min, at min, at max, and one above max for
 * thorough boundary condition testing.
 */
export function generateLengthBoundaryValues(
  minLength: number,
  maxLength: number,
): { belowMin: string; atMin: string; atMax: string; aboveMax: string } {
  return {
    belowMin: generateStringOfLength(Math.max(0, minLength - 1)),
    atMin: generateStringOfLength(minLength),
    atMax: generateStringOfLength(maxLength),
    aboveMax: generateStringOfLength(maxLength + 1),
  };
}

/**
 * Generates boundary numeric values for a given min/max numeric range.
 *
 * Returns values one below min, at min, at max, and one above max.
 */
export function generateNumericBoundaryValues(
  min: number,
  max: number,
): { belowMin: number; atMin: number; atMax: number; aboveMax: number } {
  return {
    belowMin: min - 1,
    atMin: min,
    atMax: max,
    aboveMax: max + 1,
  };
}

/**
 * A single probe used by validateTypeInputConstraints.
 */
export interface TypeInputProbe {
  /** The string to type into the field. */
  value: string;
  /** Human-readable description used in the report. */
  description: string;
  /**
   * When true  → the field should reject this input (show an error / mark invalid).
   * When false → the field should accept and preserve this input exactly as typed.
   */
  expectRejection: boolean;
}

/**
 * Returns a set of type-specific probe values for a given field type.
 *
 * - `email` / `tel` / `number`: invalid-for-that-type strings that should be rejected.
 * - `text` / `textarea`: special character and injection payloads that should be
 *   accepted and stored verbatim (verifies no client-side sanitization strips them).
 */
export function generateTypeSpecificInvalidValues(
  type: FieldType,
): TypeInputProbe[] {
  switch (type) {
    case "email":
      return [
        {
          value: "notanemail",
          description: "no @ symbol",
          expectRejection: true,
        },
        {
          value: "bad @format.com",
          description: "space before @",
          expectRejection: true,
        },
        {
          value: "@nodomain",
          description: "no local part before @",
          expectRejection: true,
        },
        {
          value: "missing-domain@",
          description: "no domain after @",
          expectRejection: true,
        },
      ];

    case "tel":
      return [
        {
          value: "abcdefgh",
          description: "letters only",
          expectRejection: true,
        },
        {
          value: "hello world",
          description: "letters and spaces",
          expectRejection: true,
        },
        {
          value: "!@#$%^&*",
          description: "symbols only",
          expectRejection: true,
        },
      ];

    case "number":
      return [
        {
          value: "abc",
          description: "alphabetic string",
          expectRejection: true,
        },
        {
          value: "twelve",
          description: "number written as word",
          expectRejection: true,
        },
      ];

    case "text":
    case "textarea":
    default:
      // Plain text fields intentionally accept all characters.
      // These probes verify that special characters are stored verbatim —
      // i.e., no client-side sanitization silently strips or mutates them.
      return [
        {
          value: "<script>alert(1)</script>",
          description: "XSS script tag payload",
          expectRejection: false,
        },
        {
          value: "'; DROP TABLE users; --",
          description: "SQL injection payload",
          expectRejection: false,
        },
        {
          value: "café naïve résumé",
          description: "accented Unicode characters",
          expectRejection: false,
        },
      ];
  }
}

/**
 * Detects `maxlength`, `min`, and `max` DOM attributes from the element
 * matched by `locatorString` and merges them into the given FieldConfig.
 * Detected DOM values take precedence to keep the config in sync with the UI.
 *
 * @param page          - Playwright Page
 * @param locatorString - CSS/locator string for the input element
 * @param config        - Existing FieldConfig to augment
 */
export async function detectConstraintsFromDom(
  page: import("@playwright/test").Page,
  locatorString: string,
  config: FieldConfig,
): Promise<FieldConfig> {
  try {
    const el = page.locator(locatorString).first();
    const attrs = await el.evaluate((node) => {
      const input = node as HTMLInputElement;
      return {
        maxlength: input.getAttribute("maxlength"),
        min: input.getAttribute("min"),
        max: input.getAttribute("max"),
        pattern: input.getAttribute("pattern"),
        required: input.hasAttribute("required"),
      };
    });

    const merged: FieldConfig = { ...config };
    if (attrs.maxlength !== null) merged.maxLength = parseInt(attrs.maxlength, 10);
    if (attrs.min !== null) merged.min = parseFloat(attrs.min);
    if (attrs.max !== null) merged.max = parseFloat(attrs.max);
    if (attrs.required) merged.required = true;
    if (attrs.pattern !== null && !merged.pattern) {
      merged.pattern = new RegExp(attrs.pattern);
    }
    return merged;
  } catch {
    // Element may not be present; return config unchanged
    return config;
  }
}
