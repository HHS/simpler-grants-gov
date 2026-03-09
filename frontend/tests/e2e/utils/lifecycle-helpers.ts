// ============================================================================
// TEST LIFECYCLE HELPERS
// ============================================================================
// This file contains helper functions for managing the lifecycle of Playwright pages and contexts.
// It includes functions to ensure pages are closed and to clear page state to prevent caching issues.
// These utilities help maintain a clean testing environment across different browsers, especially WebKit.

import { Page, BrowserContext } from "@playwright/test";

export async function ensurePageClosed(page: Page): Promise<void> {
  if (page && !page.isClosed()) {
    await page.close();
  }
}

export async function clearPageState(context: BrowserContext): Promise<void> {
  // Clear all storage to prevent WebKit caching issues
  await context.clearCookies();
  const pages = context.pages();
  for (const page of pages) {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}
