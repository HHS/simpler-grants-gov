import { Page } from "@playwright/test";

/**
 * Waits for a specific element to be visible on the page, with a customizable timeout.
 * This is a reusable utility for global E2E use to ensure the page is fully loaded or a key element is ready.
 *
 * @param page Playwright Page object
 * @param selectorOrLocator CSS selector string or Playwright Locator
 * @param timeout Timeout in milliseconds (default: 30000)
 */
export async function waitForElementVisible(
  page: Page,
  selectorOrLocator: string | ReturnType<Page["locator"]>,
  timeout = 1000 // Lower default timeout for speed
): Promise<void> {
  const locator = typeof selectorOrLocator === "string"
    ? page.locator(selectorOrLocator)
    : selectorOrLocator;

  // If already visible, return immediately
  if (await locator.first().isVisible()) return;

  // Otherwise, wait for it to become visible
  await locator.first().waitFor({ state: "visible", timeout });
}
