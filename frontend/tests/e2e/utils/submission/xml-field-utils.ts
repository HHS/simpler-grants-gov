/**
 * Helpers for verifying GrantApplication.xml content in the submission zip.
 *
 * Each form's data file declares `xmlFields` (field key → XML element) next to
 * its opportunity metadata. buildExpectedXmlFields() combines that mapping with
 * the generated happy-path test data, so specs don't hand-write expectations.
 *
 * Kept free of zip/pdf imports because form data files import from here.
 */

export interface XmlFieldMapping {
  /** Qualified element name in GrantApplication.xml, e.g. "SF424B:RepresentativeTitle". */
  element: string;
  /** Converts the fill/print value to the XML value (e.g. "No" → "N: No"). Default: as-is. */
  transform?: (value: string) => string;
  /**
   * Also assert the raw (untransformed) value appears in the form's PDF.
   * Opt-in: only for fields rendered as-is in the PDF (not dates, currency, yes/no).
   */
  pdf?: boolean;
}

export type XmlFieldMap = Record<string, XmlFieldMapping>;

/** "Yes"/"true" → "Y: Yes", anything else → "N: No" (API boolean_to_yes_no transform). */
export const xmlYesNo = (value: string): string =>
  value === "Yes" || value === "true" ? "Y: Yes" : "N: No";

/** "1000000" → "1000000.00" (API currency_format transform). */
export const xmlCurrency = (value: string): string => Number(value).toFixed(2);

/** Merges prepopulated < testData < systemValues, string values only. */
const mergeValues = (
  form: { expectedPrepopulatedFields: Record<string, string | RegExp> },
  testData: Record<string, string>,
  systemValues: Record<string, string>,
): Record<string, string> => {
  const prepopulated = Object.fromEntries(
    Object.entries(form.expectedPrepopulatedFields).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
  return { ...prepopulated, ...testData, ...systemValues };
};

/**
 * Builds the { element, value } pairs for assertXmlContainsFields.
 *
 * Values come from, in increasing priority:
 *   1. expectedPrepopulatedFields (string values only; API-injected)
 *   2. testData (what the test typed into the form)
 *   3. systemValues (set at submission time, e.g. signature and dates)
 *
 * Throws if a mapped field has no value, so mapping drift is caught
 * instead of silently skipped.
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

  const values = mergeValues(form, testData, systemValues);

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

/**
 * Builds the strings expected in the form's PDF: the raw value of every field
 * flagged `pdf: true` in xmlFields. Same value sources and throw-on-missing
 * behavior as buildExpectedXmlFields, so one mapping drives both checks.
 */
export function buildExpectedPdfText(
  form: {
    xmlFields?: XmlFieldMap;
    expectedPrepopulatedFields: Record<string, string | RegExp>;
  },
  testData: Record<string, string>,
  systemValues: Record<string, string> = {},
): string[] {
  if (!form.xmlFields) {
    throw new Error("Form has no xmlFields mapping defined");
  }

  const values = mergeValues(form, testData, systemValues);

  return Object.entries(form.xmlFields)
    .filter(([, { pdf }]) => pdf)
    .map(([key]) => {
      const raw = values[key];
      if (raw === undefined) {
        throw new Error(`No value available for PDF field "${key}"`);
      }
      return raw;
    });
}
