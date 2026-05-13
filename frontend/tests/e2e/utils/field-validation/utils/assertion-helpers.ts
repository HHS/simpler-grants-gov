import { expect, Page } from "@playwright/test";

/**
 * Asserts that an inline error element is visible and contains the
 * expected message fragment.
 *
 * Uses `expect.soft()` so that a single failure does not abort the entire
 * validation run — all fields are always checked.
 *
 * @param page          - Playwright Page
 * @param errorLocator  - CSS selector / locator for the inline error element
 * @param expectedText  - Substring expected to appear in the error element
 */
export async function assertInlineErrorVisible(
  page: Page,
  errorLocator: string,
  expectedText: string,
): Promise<void> {
  const el = page.locator(errorLocator).first();
  await expect.soft(el).toBeVisible();
  await expect.soft(el).toContainText(expectedText, { ignoreCase: true });
}

/**
 * Asserts that an inline error element is NOT visible.
 *
 * @param page         - Playwright Page
 * @param errorLocator - CSS selector / locator for the inline error element
 */
export async function assertNoInlineError(
  page: Page,
  errorLocator: string,
): Promise<void> {
  const el = page.locator(errorLocator).first();
  await expect.soft(el).not.toBeVisible();
}

/**
 * Asserts that a field's current DOM value equals the expected string
 * (useful for verifying that HTML maxlength truncation is in effect).
 *
 * @param page          - Playwright Page
 * @param locatorString - CSS selector / locator for the input
 * @param expectedValue - Expected string value after truncation
 */
export async function assertFieldValue(
  page: Page,
  locatorString: string,
  expectedValue: string,
): Promise<void> {
  await expect
    .soft(page.locator(locatorString).first())
    .toHaveValue(expectedValue);
}

/**
 * Asserts that a field's value length does not exceed `maxLength`.
 *
 * @param page          - Playwright Page
 * @param locatorString - CSS selector / locator for the input
 * @param maxLength     - Maximum allowed character count
 */
export async function assertMaxLengthEnforced(
  page: Page,
  locatorString: string,
  maxLength: number,
): Promise<void> {
  const value = await page.locator(locatorString).first().inputValue();
  expect.soft(value.length).toBeLessThanOrEqual(maxLength);
}
