/**
 * The value transforms `$transform` can name, by the name the API's `TRANSFORMATION_REGISTRY`
 * gives them. Only the ones the form library's mappings use are ported.
 */
export const VALUE_TRANSFORMS: Record<string, (value: unknown) => unknown> = {
  boolean_to_yes_no: (value) => {
    if (typeof value !== "boolean")
      throw new Error(`boolean_to_yes_no expects a boolean, got ${value}`);
    return value ? "Y: Yes" : "N: No";
  },
};
