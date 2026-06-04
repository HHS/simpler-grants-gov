// ============================================================================
// TEST LIFECYCLE UTILS
// ============================================================================
// This file contains utility functions for managing the lifecycle of Playwright pages and contexts.
// It includes functions to ensure pages are closed, clear page state, and retry navigation.
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

// Retry config for transient network errors (e.g. net::ERR_NETWORK_CHANGED)
// which are common in Codespaces when navigating to staging URLs.
const NAVIGATION_RETRIES = 3;
const NAVIGATION_RETRY_DELAY_MS = 3000;

/**
 * Navigates to a URL with retry logic to handle transient network errors.
 */
export async function gotoWithRetry(
  page: Page,
  url: string,
  options?: Parameters<Page["goto"]>[1],
): Promise<void> {
  let lastError: Error = new Error(
    `gotoWithRetry: all ${NAVIGATION_RETRIES} attempts failed for ${url}`,
  );
  for (let attempt = 1; attempt <= NAVIGATION_RETRIES; attempt++) {
    try {
      await page.goto(url, options);
      return;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.warn(
        `gotoWithRetry: attempt ${attempt}/${NAVIGATION_RETRIES} failed for ${url} — ${lastError.message}`,
      );
      if (attempt < NAVIGATION_RETRIES) {
        await page.waitForTimeout(NAVIGATION_RETRY_DELAY_MS);
      }
    }
  }
  throw lastError;
}
