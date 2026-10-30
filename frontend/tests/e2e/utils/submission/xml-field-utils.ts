/**
 * Builds expected XML field values for submission ZIP tests.
 * Form data files define xmlFields alongside opportunity metadata.
 * Kept independent of ZIP/PDF utilities to avoid circular imports.
 */

export interface XmlFieldMapping {
  /** Qualified element name in GrantApplication.xml, e.g. "SF424B:RepresentativeTitle". */
  element: string;
  /** Converts the fill/print value to the XML value (e.g. "No" -> "N: No"). Default: as-is. */
  transform?: (value: string) => string;
}

export type XmlFieldMap = Record<string, XmlFieldMapping>;

/** Converts Yes/true to "Y: Yes"; all other values to "N: No". */
export const xmlYesNo = (value: string): string =>
  value === "Yes" || value === "true" ? "Y: Yes" : "N: No";

/** Formats a currency value to two decimal places. */
export const xmlCurrency = (value: string): string => Number(value).toFixed(2);

/**
 * Builds expected XML fields using prepopulated, test, then system values.
 * Throws if a mapped field has no value.
 */

export function buildExpectedXmlFields(
  form: {
    xmlFields?: XmlFieldMap;
    expectedPrepopulatedFields: Record<string, string | RegExp>;
  },
  testData: Record<string, string>,
  systemValues: Record<string, string> = {},
): Record<string, { element: string; value: string }> {
  if (!form.xmlFields) {
    throw new Error("Form has no xmlFields mapping defined");
  }

  const prepopulated = Object.fromEntries(
    Object.entries(form.expectedPrepopulatedFields).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
  const values = { ...prepopulated, ...testData, ...systemValues };

  return Object.fromEntries(
    Object.entries(form.xmlFields).map(([key, { element, transform }]) => {
      const raw = values[key];
      if (raw === undefined) {
        throw new Error(`No value available for XML field "${key}"`);
      }
      return [key, { element, value: transform ? transform(raw) : raw }];
    }),
  );
}
