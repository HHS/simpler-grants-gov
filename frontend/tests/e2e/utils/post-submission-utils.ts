import { expect, Page } from "@playwright/test";
import { openForm } from "tests/e2e/utils/forms/form-navigation-utils";

/**
 * Expected application history entries in display order (index 0 = most recent).
 * Pass entries matching the actions taken in your specific test scenario.
 */
export type HistoryEntry = string;

export type ReadonlyFieldCheck = {
  fieldId: string;
  expectedValue: string;
};

/**
 * Verifies the application status card shows "Submitted" and the
 * Application History section is visible with the expected history entries.
 *
 * History entries are verified in order from most recent (index 0) to oldest
 * (last index), matching the responsive-data-{index}-1 test IDs.
 * Also asserts there are no unexpected extra entries beyond the expected set.
 *
 * @param page Playwright Page object
 * @param expectedHistoryEntries History entries in order from most recent to oldest
 */
export async function verifyPostSubmission(
  page: Page,
  expectedHistoryEntries: HistoryEntry[],
): Promise<void> {
  // Verify application status card shows "Submitted"
  await expect(page.getByTestId("information-card")).toContainText(
    "Status:Submitted",
  );

  // Verify Application History section is visible
  await expect(
    page.getByRole("heading", { name: "Application History" }),
  ).toBeVisible();
  await expect(page.locator("#main-content")).toContainText(
    "Application History",
  );

  // Verify each history entry in order (index 0 = most recent)
  for (let i = 0; i < expectedHistoryEntries.length; i++) {
    const entryLocator = page.getByTestId(`responsive-data-${i}-1`);
    await expect(entryLocator).toBeVisible();
    await expect(entryLocator).toContainText(expectedHistoryEntries[i]);
  }

  // Ensure there are no unexpected extra entries beyond the expected set.
  await expect(
    page.getByTestId(`responsive-data-${expectedHistoryEntries.length}-1`),
  ).toHaveCount(0);
}

/**
 * Opens a form and verifies its fields are disabled (read-only) with expected
 * values after application submission.
 *
 * @param page Playwright Page object
 * @param formMatcher Regex to match the form link on the application page
 * @param formName Human-readable form name used in the error message
 * @param fields Array of field IDs and their expected values to verify
 */
export async function verifyFormFieldsAreReadonlyAfterSubmission(
  page: Page,
  formMatcher: string,
  formName: string,
  fields: ReadonlyFieldCheck[],
): Promise<void> {
  if (!(await openForm(page, formMatcher))) {
    throw new Error(
      `Could not find or open ${formName} form link after submission`,
    );
  }

  for (const { fieldId, expectedValue } of fields) {
    const field = page.getByTestId(fieldId);
    await expect(field).toBeVisible();
    await expect(field).toHaveValue(expectedValue);
    await expect(field).toBeDisabled();
  }
}
