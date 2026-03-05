import { Page, TestType } from "@playwright/test";

// ============================================================================
// TEST LIFECYCLE HELPERS
// ============================================================================

//Ensure the page is closed after each test to prevent resource leaks
// Usage: Call this function at the end of each test file, passing in the test object
// Example:
//   test("My Test", async ({ page }) => {
//     // test code here
//   });
//   ensurePageClosedAfterEach(test);
export async function ensurePageClosed(page: Page): Promise<void> {
  if (page && !page.isClosed()) {
    await page.close();
  }
}
