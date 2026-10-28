/**
 * The value transforms `$transform` can name, by the name the API's `TRANSFORMATION_REGISTRY`
 * gives them, with the same behavior. `params` are passed by name, as the API passes them as
 * keyword arguments, so a name a transform doesn't take, or a missing required one, is an
 * error.
 */
export type ValueTransform = (
  value: unknown,
  params: Record<string, unknown>,
) => unknown;

export const VALUE_TRANSFORMS: Record<string, ValueTransform> = {
  /** `true` → `Y: Yes`, `false` → `N: No`, and the strings the API reads as either. */
  boolean_to_yes_no: (value, params) => {
    takes("boolean_to_yes_no", params);
    if (typeof value === "boolean") return value ? YES : NO;
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (["true", "yes", "1", "y"].includes(lower)) return YES;
      if (["false", "no", "0", "n"].includes(lower)) return NO;
    }
    throw new Error(`boolean_to_yes_no expects a boolean, got ${value}`);
  },

  /** A currency string with exactly two decimal places: `"1"` → `"1.00"`. */
  currency_format: (value, params) => {
    takes("currency_format", params);
    if (typeof value !== "string")
      throw new Error(`currency_format expects a string, got ${value}`);
    const match = CURRENCY.exec(value);
    if (!match) throw new Error(`invalid currency format: '${value}'`);
    const [, sign = "", whole, cents] = match;
    if (!whole && cents === undefined)
      throw new Error(`cannot convert currency value to decimal: '${value}'`);
    return `${sign}${whole.replace(/^0+(?=\d)/, "") || "0"}.${cents ?? "00"}`;
  },

  /** The string in `case_type` case: `upper`, `lower` or `title`. */
  string_case: (value, params) => {
    takes("string_case", params, ["case_type"]);
    if (typeof value !== "string")
      throw new Error(`string_case expects a string, got ${value}`);
    switch (params.case_type) {
      case "upper":
        return value.toUpperCase();
      case "lower":
        return value.toLowerCase();
      case "title":
        // As Python's `str.title`: each run of letters capitalized.
        return value.replace(
          /\p{L}+/gu,
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        );
      default:
        throw new Error(`unsupported case type: ${params.case_type}`);
    }
  },

  /** The string's first `max_length` characters. */
  truncate_string: (value, params) => {
    takes("truncate_string", params, ["max_length"]);
    if (typeof value !== "string")
      throw new Error(`truncate_string expects a string, got ${value}`);
    const max = params.max_length;
    if (!Number.isInteger(max))
      throw new Error(`max_length must be an integer, got ${max}`);
    if ((max as number) < 0)
      throw new Error(`max length must be non-negative, got ${max}`);
    // By code point, as Python slices a string.
    return Array.from(value)
      .slice(0, max as number)
      .join("");
  },

  /**
   * The `mappings` entry for the value, keyed as Python's `str` writes it (`true` as
   * `"True"`), else `default`, else the value itself with `passthrough_unknown`.
   */
  map_values: (value, params) => {
    takes(
      "map_values",
      params,
      ["mappings"],
      ["default", "passthrough_unknown"],
    );
    const mappings = params.mappings as Record<string, unknown>;
    const key = pythonStr(value);
    if (Object.hasOwn(mappings, key)) return mappings[key];
    if (params.default !== undefined && params.default !== null)
      return params.default;
    if (params.passthrough_unknown) return value;
    throw new Error(`value '${key}' not found in mappings`);
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const YES = "Y: Yes";
const NO = "N: No";

/** The API's `CURRENCY_REGEX`, with the whole and cents parts captured. */
const CURRENCY = /^(-)?(\d*)(?:[.](\d{2}))?$/;

/** Reject a parameter `name` doesn't take, or a missing `required` one. */
function takes(
  name: string,
  params: Record<string, unknown>,
  required: string[] = [],
  optional: string[] = [],
) {
  for (const param of Object.keys(params))
    if (!required.includes(param) && !optional.includes(param))
      throw new Error(`${name} takes no parameter ${param}`);
  for (const param of required)
    if (!(param in params))
      throw new Error(`${name} requires the parameter ${param}`);
}

/** A string, number or boolean as Python's `str` writes it. */
function pythonStr(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "number") return String(value);
  throw new Error(
    `map_values only keys a string, number or boolean, got ${JSON.stringify(value)}`,
  );
}
