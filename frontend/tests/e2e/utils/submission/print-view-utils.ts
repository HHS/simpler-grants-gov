import type { Page } from "@playwright/test";
import type { fieldDefinitionsProjectAbstractSummary } from "tests/e2e/apply/fixtures/project-abstract-summary-field-definitions";
import type { FillFormConfig } from "tests/e2e/utils/forms/general-forms-filling";

/**
 * Converts a workspace application form URL to its corresponding print view URL.
 *
 * Workspace URL format:  /workspace/applications/{applicationId}/form/{appFormId}
 * Print URL format:      /print/application/{applicationId}/form/{appFormId}
 */
export function buildPrintUrl(formUrl: string): string {
  return formUrl.replace(/\/workspace\/applications\//, "/print/application/");
}

/**
 * Navigates to a pre-built print view URL and waits for the page to settle.
 *
 * Call `buildPrintUrl(formUrl)` first to derive the print URL from a workspace
 * form URL captured before submission.
 *
 * @param page     - The Playwright page object.
 * @param printUrl - The print view URL (already transformed via buildPrintUrl).
 * @param waitMs   - Extra ms to wait after load for client-side rendering. Defaults to 3000.
 */
export async function navigateToPrintView(
  page: Page,
  printUrl: string,
  waitMs = 3000,
): Promise<void> {
  await page.goto(printUrl);
  await page.waitForLoadState("domcontentloaded");
  if (waitMs > 0) {
    await page.waitForTimeout(waitMs);
  }
}

/**
 * Happy-path test data builders, keyed by formKey.
 *
 * Each builder generates valid values within field length limits using a numeric
 * suffix to ensure uniqueness across concurrent test runs.
 * Values are automatically truncated to respect each field's maxLength.
 *
 * Add a new entry here when a new form is introduced.
 * For failure-scenario data, add a separate buildFailPathTestData builder.
 */
const HAPPY_PATH_TEST_DATA_BUILDERS: Record<
  string,
  (suffix: number) => Record<string, string>
> = {
  projectAbstractSummary: (suffix) =>
    ({
      applicantName: `TESTER BR ${suffix}`,
      projectTitle: `TESTING ${suffix}`,
      abstract: `This is a print view automation test ${suffix}`,
    }) satisfies Partial<
      Record<keyof typeof fieldDefinitionsProjectAbstractSummary, string>
    >,
};

/**
 * Truncates a string to fit within a field's maxLength, preserving the suffix.
 * If the full value fits, it is returned unchanged.
 */
function truncateToMaxLength(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : value.slice(0, maxLength);
}

/**
 * Builds unique happy-path test data for the given form's user-entered fields.
 * Each generated value is truncated to respect the field's maxLength if defined.
 * The timestamp suffix prevents collisions across concurrent test runs.
 *
 * Keys in the returned Record match the fill-data field keys
 * so the spec can resolve print testIds generically.
 *
 * @param formKey - The form key (e.g. "projectAbstractSummary").
 * @param suffix  - A numeric suffix appended to each value (e.g. Date.now()).
 * @param formConfig - The form's FillFormConfig, used for completeness + maxLength checks.
 * @throws if no builder is registered for the given formKey.
 */
export function buildHappyPathTestData(
  formKey: string,
  suffix: number,
  formConfig: FillFormConfig,
): Record<string, string> {
  const builder = HAPPY_PATH_TEST_DATA_BUILDERS[formKey];
  if (!builder) {
    throw new Error(
      `No happy-path test data builder registered for formKey: "${formKey}". ` +
        `Add it to HAPPY_PATH_TEST_DATA_BUILDERS in print-view-utils.ts.`,
    );
  }
  const rawData = builder(suffix);

  // Completeness check: every non-attachment, non-conditional field in the form
  // definition must have a value in the test data. This ensures the builder stays
  // in sync with field definition changes automatically — no manual list to maintain.
  const missingKeys = Object.entries(formConfig.fields)
    .filter(
      ([key, def]) =>
        def.type !== "file" && !def.dependsOn && rawData[key] === undefined,
    )
    .map(([key, def]) => `${key} (${def.field})`);

  if (missingKeys.length > 0) {
    throw new Error(
      `Happy-path test data builder for "${formKey}" is missing values for: ${missingKeys.join(", ")}. ` +
        `Add them to HAPPY_PATH_TEST_DATA_BUILDERS["${formKey}"] in print-view-utils.ts.`,
    );
  }

  // Truncate each value to its field's maxLength to prevent validation failures.
  return Object.fromEntries(
    Object.entries(rawData).map(([key, value]) => {
      const maxLength = formConfig.fields[key]?.maxLength;
      return [
        key,
        maxLength !== undefined ? truncateToMaxLength(value, maxLength) : value,
      ];
    }),
  );
}
