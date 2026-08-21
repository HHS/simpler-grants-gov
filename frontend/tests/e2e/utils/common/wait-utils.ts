/**
 * Shared wait helpers for E2E tests.
 *
 * Reviewer guide:
 * - These helpers are intended for common page wait patterns that are used by
 *   multiple tests and helper modules.
 * - Keep this file small and focused on reusable, page-state polling helpers.
 * - If a helper becomes specific to a single feature, move it to the feature's
 *   own utility module instead.
 *
 * Common update points:
 * - waitForAnyVisible: waits for any provided locator to become visible.
 */
import { type Locator, type Page } from "@playwright/test";

/**
 * Wait until any of the provided locators becomes visible.
 *
 * This helper polls the provided locators until one is present and visible or
 * the timeout elapses.
 */
export async function waitForAnyVisible(
  page: Page,
  locators: Locator[],
  timeoutMs = 30000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    for (const locator of locators) {
      if ((await locator.count()) > 0 && (await locator.isVisible())) {
        return;
      }
    }

    await page.waitForTimeout(250);
  }

  throw new Error(
    "Expected at least one of the provided locators to become visible within the timeout.",
  );
}
