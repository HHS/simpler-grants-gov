import { Page, TestType } from "@playwright/test";

// ============================================================================
// TEST LIFECYCLE HELPERS
// ============================================================================

/**
 * Ensures that the page is closed after each test to prevent resource leaks.
 * Call this helper at the top of your test files: ensurePageClosedAfterEach(test);
 *
 * @param test - Playwright test object
 *
 * @example
 * ensurePageClosedAfterEach(test);
 */
export function ensurePageClosedAfterEach(
  test: TestType<{ page: Page }, object>,
) {
  test.afterEach(async ({ page }) => {
    if (typeof page.isClosed === "function" && !page.isClosed()) {
      await page.close();
    }
  });
}
