/**
 * Helpers for verifying the submission zip contents (GrantApplication.xml and form PDFs).
 *
 * Each form's data file declares `submissionFields` next to its opportunity metadata.
 * The build* functions combine that mapping with the generated happy-path test data,
 * so specs don't hand-write expectations.
 *
 * Kept free of zip/pdf imports because form data files import from here.
 */

export interface SubmissionFieldMapping {
  /** Qualified element in GrantApplication.xml, e.g. "SF424B:RepresentativeTitle". Omit to skip the XML check. */
  xmlElement?: string;
  /** Converts the fill/print value to the XML value (e.g. "No" → "N: No"). Default: as-is. */
  xmlTransform?: (value: string) => string;
  /**
   * Assert the raw value appears in the form's PDF. This is an existence check on
   * the text (not tied to a field id), so only enable it for fields rendered as-is.
   */
  verifyInPdf?: boolean;
}

/** Keyed by form field key (same keys as the fill data / expectedPrepopulatedFields). */
export type SubmissionFieldMap = Record<string, SubmissionFieldMapping>;

/**
 * Today's date as YYYY-MM-DD in US Eastern time. The API's post-population
 * `current_date` rule uses the US Eastern date (get_now_us_eastern_date), which
 * differs from the UTC date for part of every evening, so never use UTC here.
 */
export const getUsEasternDateString = (date: Date = new Date()): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

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
    submissionFields?: SubmissionFieldMap;
    expectedPrepopulatedFields: Record<string, string | RegExp>;
  },
  testData: Record<string, string>,
  systemValues: Record<string, string> = {},
): Record<string, { element: string; value: string }> {
  if (!form.submissionFields) {
    throw new Error("Form has no submissionFields mapping defined");
  }

  const values = mergeValues(form, testData, systemValues);

  return Object.fromEntries(
    Object.entries(form.submissionFields).flatMap(
      ([key, { xmlElement, xmlTransform }]) => {
        if (!xmlElement) return [];
        const raw = values[key];
        if (raw === undefined) {
          throw new Error(`No value available for XML field "${key}"`);
        }
        return [
          [
            key,
            {
              element: xmlElement,
              value: xmlTransform ? xmlTransform(raw) : raw,
            },
          ],
        ];
      },
    ),
  );
}

/**
 * Builds the strings expected in the form's PDF: the raw value of every field
 * flagged `verifyInPdf` in submissionFields. Same value sources and throw-on-missing
 * behavior as buildExpectedXmlFields.
 */
export function buildExpectedPdfText(
  form: {
    submissionFields?: SubmissionFieldMap;
    expectedPrepopulatedFields: Record<string, string | RegExp>;
  },
  testData: Record<string, string>,
  systemValues: Record<string, string> = {},
): string[] {
  if (!form.submissionFields) {
    throw new Error("Form has no submissionFields mapping defined");
  }

  const values = mergeValues(form, testData, systemValues);

  return Object.entries(form.submissionFields)
    .filter(([, { verifyInPdf }]) => verifyInPdf)
    .map(([key]) => {
      const raw = values[key];
      if (raw === undefined) {
        throw new Error(`No value available for PDF field "${key}"`);
      }
      return raw;
    });
}
