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
  await openSaveModalButton.click();

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
  workspaceLink?: Locator,
): Promise<void> {
  const link = workspaceLink ?? page.getByRole("link", { name: "Workspace" });
  await link.click();
  await page.waitForURL(/\/workspace\/saved-search-queries/, {
    timeout: GOTO_TIMEOUT,
  });
}

/**
 * Re-runs a saved search from the Saved Search Queries workspace.
 */
export async function runSavedSearch(
  page: Page,
  searchName: string,
): Promise<void> {
  await page.getByRole("link", { name: searchName, exact: true }).click();
  await page.waitForURL(/\/search\?/, { timeout: GOTO_TIMEOUT });
  await waitForSearchResultsInitialLoad(page);
}
