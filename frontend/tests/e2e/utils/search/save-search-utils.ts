// =========================
// Saved Search Test Helper Functions
// =========================

import { expect, Locator, Page } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { waitForSearchResultsInitialLoad } from "tests/e2e/utils/search/searchSpecUtil";

const { targetEnv } = playwrightEnv;

const GOTO_TIMEOUT = targetEnv !== "local" ? 300000 : 60000;

/**
 * Opens the "Save search" modal, names and saves the current search, and waits
 * for the confirmation modal to appear. Returns the confirmation modal's
 * "Workspace" link so callers can decide when/whether to follow it.
 *
 * Note: the confirmation modal's "Workspace" link and the header nav's
 * "Saved search queries" link both point at the same href, so this is
 * intentionally scoped by accessible role+name rather than href to avoid a
 * Playwright strict-mode violation (two elements resolved for the same
 * `a[href="..."]` selector).
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
 * Re-runs a saved search from the Saved Search Queries workspace list. In the
 * current UI, the saved search's name is itself the "Run" affordance - there
 * is no separate "Run" button (see SavedSearchesList.tsx). Does not assert
 * that the link is visible/present first - callers that need to verify the
 * saved search is listed (e.g. for an AC around that) should assert on the
 * locator separately before calling this.
 */
export async function runSavedSearch(
  page: Page,
  searchName: string,
): Promise<void> {
  await page.getByRole("link", { name: searchName, exact: true }).click();
  await page.waitForURL(/\/search\?/, { timeout: GOTO_TIMEOUT });
  await waitForSearchResultsInitialLoad(page);
}
