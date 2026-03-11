// ============================================================================
// TEST LIFECYCLE HELPERS
// ============================================================================
// This file contains helper functions for managing the lifecycle of Playwright pages and contexts.
// It includes functions to ensure pages are closed and to clear page state to prevent caching issues.
// These utilities help maintain a clean testing environment across different browsers, especially WebKit.

import { BrowserContext, Page } from "@playwright/test";

export async function ensurePageClosed(page: Page): Promise<void> {
  if (page && !page.isClosed()) {
    await page.close();
  }
}

export async function clearPageState(context: BrowserContext): Promise<void> {
  try {
    // Clear all storage to prevent WebKit caching issues
    await context.clearCookies();
    const pages = context.pages();
    for (const page of pages) {
      // Check if page is still valid before evaluating
      if (!page.isClosed()) {
        try {
          await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
          });
        } catch (error) {
          // Ignore errors from closed/destroyed pages
          console.warn("Could not clear page storage:", error);
        }
      }
    }
  } catch (error) {
    // Context already closed - ignore
    console.warn("Could not clear context state:", error);
  }
}
