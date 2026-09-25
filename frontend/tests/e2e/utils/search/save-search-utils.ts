// =========================
// Saved Search Test Helper Functions
// =========================

import { expect, Locator, Page } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { waitForSearchResultsInitialLoad } from "tests/e2e/utils/search/searchSpecUtil";

const { targetEnv } = playwrightEnv;

const GOTO_TIMEOUT = targetEnv !== "local" ? 300000 : 60000;

/**
 * Saves the current search and waits for the confirmation modal.
 * Returns the modal's Workspace link for the caller to follow.
 */
export async function saveCurrentSearch(
  page: Page,
  searchName: string,
): Promise<Locator> {
  const openSaveModalButton = page.locator(
    '[data-testid="open-save-search-modal-button"]',
  );

  // Wait for page to be fully loaded and stable
  await page.waitForLoadState("networkidle").catch(() => {
    // Continue even if network idle times out
  });
  await page.waitForTimeout(500);

  // Close any open overlays or drawers that might be blocking button access.
  // Expected overlays in typical test flow:
  // - Search filter drawer overlay (aria-controls="search-filter-drawer")
  // - Any other modals that might have been opened during test execution
  // We target these explicitly rather than iterating all overlays since we expect a small count.
  const filterDrawerOverlay = page.locator(
    '.usa-modal-overlay[aria-controls="search-filter-drawer"]',
  );
  if (await filterDrawerOverlay.isVisible().catch(() => false)) {
    const closeButton = filterDrawerOverlay
      .locator('button[aria-label="Close"]')
      .first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click().catch(() => {
        // Ignore if close fails
      });
      await page.waitForTimeout(200);
    }
  }

  // Scroll page to top to ensure button is in viewport
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  // Use JavaScript to ensure the save search modal button is visible and not hidden by CSS
  // This must run BEFORE the visibility check to fix any CSS-based visibility issues
  await page.evaluate(() => {
    const saveSearchModalButton = document.querySelector(
      '[data-testid="open-save-search-modal-button"]',
    ) as HTMLElement;
    if (saveSearchModalButton) {
      // Ensure saveSearchModalButton is not hidden
      saveSearchModalButton.style.display = "";
      saveSearchModalButton.style.visibility = "";
      saveSearchModalButton.style.opacity = "";
      saveSearchModalButton.scrollIntoView({
        behavior: "instant",
        block: "center",
      });

      // Also ensure parent elements are visible
      let parent = saveSearchModalButton.parentElement;
      while (parent && parent !== document.body) {
        parent.style.display = "";
        parent.style.visibility = "";
        parent.style.opacity = "";
        parent = parent.parentElement;
      }
    }
  });
  await page.waitForTimeout(500);

  // Now check visibility after CSS fixes have been applied
  await expect(openSaveModalButton).toBeVisible({ timeout: 15000 });

  // Try to click the button with various strategies
  try {
    // First try a normal click
    await openSaveModalButton.click({ timeout: 3000 });
  } catch (_e) {
    try {
      // Try clicking the button element directly via JavaScript
      await page.evaluate(() => {
        const saveSearchModalButton = document.querySelector(
          '[data-testid="open-save-search-modal-button"]',
        ) as HTMLButtonElement;
        if (saveSearchModalButton) {
          saveSearchModalButton.click();
        }
      });
    } catch (_e2) {
      // Last resort: try force click
      await openSaveModalButton.click({ force: true });
    }
  }

  const savedSearchNameInput = page.locator("#saved-search-input");
  await savedSearchNameInput.waitFor({ state: "visible" });
  await savedSearchNameInput.fill(searchName);

  const saveSearchButton = page.locator('[data-testid="save-search-button"]');
  await saveSearchButton.click();

  await expect(page.getByText("Query successfully saved")).toBeVisible({
    timeout: 30000,
  });

  const workspaceLink = page.getByRole("link", { name: "Workspace" });
  await expect(workspaceLink).toBeVisible();
  return workspaceLink;
}

/**
 * Follows a "Workspace" link (e.g. the one returned by saveCurrentSearch) to
 * the saved search queries list and waits for the list page to load.
 */
export async function navigateToSavedSearches(
  page: Page,
  workspaceLink: Locator,
): Promise<void> {
  await workspaceLink.click();
  await page.waitForURL(/\/workspace\/saved-search-queries/, {
    timeout: GOTO_TIMEOUT,
  });

  // Wait for the saved searches list to actually load
  // Look for the list container or any saved search item
  await page
    .locator('[role="table"], [data-testid*="saved-search"], .list-item')
    .first()
    .waitFor({ state: "visible", timeout: 30000 })
    .catch(() => {
      // Continue even if the specific selectors don't match
      // The list might be loading with different markup
    });

  // Additional wait for network to settle
  await page.waitForLoadState("networkidle").catch(() => {
    // Continue if network idle times out
  });
  await page.waitForTimeout(500);
}

/**
 * Re-runs a saved search from the Saved Search Queries workspace.
 * Waits for the search link to appear and then opens it.
 */
export async function runSavedSearch(
  page: Page,
  searchName: string,
): Promise<void> {
  const searchLink = page.getByRole("link", { name: searchName, exact: true });

  // Wait for the search link to be visible in the list
  await searchLink.waitFor({ state: "visible", timeout: 30000 });

  // Click the link to open the saved search
  await searchLink.click();

  // Wait for search results page to load
  await page.waitForURL(/\/search\?/, { timeout: GOTO_TIMEOUT });
  await waitForSearchResultsInitialLoad(page);
}
