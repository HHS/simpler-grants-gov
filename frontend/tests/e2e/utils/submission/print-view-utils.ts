import { expect, type Page } from "@playwright/test";
import type { FillFormConfig } from "tests/e2e/utils/common/types";

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
 * Truncates a suffix to its last 6 digits, keeping dynamic values within
 * field max lengths defined in the form JSON schema.
 * Use this in form builders for fields that have tight character limits.
 */
export function toHappyPathSuffix(suffix: number): string {
  return String(suffix).slice(-6);
}

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
 * @param builder    - The form's test data builder function.
 * @param suffix     - A numeric suffix appended to each value (e.g. Date.now()).
 * @param formConfig - The form's FillFormConfig, used for completeness + maxLength checks.
 */
export function buildHappyPathTestData(
  builder: (suffix: number) => Record<string, string>,
  suffix: number,
  formConfig: FillFormConfig,
): Record<string, string> {
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
      `Happy-path test data builder is missing values for: ${missingKeys.join(", ")}.`,
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

/**
 * Validates that a form field on the print view contains the expected value.
 * Handles both input elements (checks value attribute) and other elements (checks visible text).
 *
 * For input elements: Uses toHaveValue() to check the value attribute
 * For other elements (divs, spans, etc.): Uses toContainText() to check visible text
 *
 * @param page          - The Playwright page object.
 * @param testId        - The test ID of the field to validate.
 * @param expectedValue - The expected value to find.
 */
export async function validatePrintViewField(
  page: Page,
  testId: string,
  expectedValue: string,
): Promise<void> {
  const locator = page.getByTestId(testId);
  await expect(locator).toBeVisible();

  // For input elements, check the value attribute; for other elements, check visible text
  const elementType = await locator.evaluate((el) => el.tagName.toLowerCase());
  if (elementType === "input") {
    await expect(locator).toHaveValue(expectedValue);
  } else {
    await expect(locator).toContainText(expectedValue);
  }
}

/**
 * Validates that an uploaded attachment filename appears in a print view section.
 * Used for file upload fields where filenames render inside a section locator
 * rather than a testId element.
 *
 * Shared across specs that include file attachment fields (e.g. Attachment Form, SF-424).
 *
 * @param page - Playwright page
 * @param sectionId - The HTML id of the section element (e.g. "form-section-attachment1")
 * @param filePath - The full file path from testData; the filename is extracted and asserted
 */
export async function validateAttachmentPrintViewSection(
  page: Page,
  sectionId: string,
  filePath: string,
): Promise<void> {
  const fileName = filePath.split(/[/\\]/).pop() ?? filePath;
  const section = page.locator(`#${sectionId}`);

  await expect(section).toBeVisible();
  await expect(section.getByRole("listitem")).toBeVisible({ timeout: 15000 });
  await expect(section).toContainText(fileName);
}
