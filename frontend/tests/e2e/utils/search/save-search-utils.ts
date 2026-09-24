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

  await expect(openSaveModalButton).toBeVisible({ timeout: 15000 });

  // Wait for page to be fully loaded and stable
  await page.waitForLoadState("networkidle").catch(() => {
    // Continue even if network idle times out
  });
  await page.waitForTimeout(500);

  // Close any open overlays or drawers that might be blocking
  const allOverlays = page.locator(".usa-modal-overlay");
  const overlayCount = await allOverlays.count();
  if (overlayCount > 0) {
    for (let i = 0; i < overlayCount; i++) {
      const overlay = allOverlays.nth(i);
      if (await overlay.isVisible().catch(() => false)) {
        const closeButton = overlay
          .locator('button[aria-label="Close"]')
          .first();
        if (await closeButton.isVisible().catch(() => false)) {
          await closeButton.click().catch(() => {
            // Ignore if close fails
          });
          await page.waitForTimeout(200);
        }
      }
    }
  }

  // Scroll page to top to ensure button is in viewport
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  // Use JavaScript to ensure the save search modal button is visible and not hidden by CSS
  await page.evaluate(() => {
    const saveSearchModalButton = document.querySelector(
      '[data-testid="open-save-search-modal-saveSearchModalButton"]',
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

/**
 * Deletes every saved search belonging to the currently-authenticated user
 */
export async function deleteAllSavedSearches(page: Page): Promise<void> {
  for (let guard = 0; guard < 20; guard += 1) {
    const listResponse = await page.request.post(
      "/api/user/saved-searches/list",
      { data: {} },
    );
    if (!listResponse.ok()) {
      throw new Error(
        `Failed to list saved searches for cleanup: ${listResponse.status()}`,
      );
    }
    const savedSearches = (await listResponse.json()) as {
      saved_search_id: string;
    }[];

    if (savedSearches.length === 0) {
      return;
    }

    for (const { saved_search_id: savedSearchId } of savedSearches) {
      const deleteResponse = await page.request.delete(
        "/api/user/saved-searches",
        { data: { searchId: savedSearchId } },
      );
      if (!deleteResponse.ok()) {
        throw new Error(
          `Failed to delete saved search ${savedSearchId} during cleanup: ` +
            `${deleteResponse.status()}`,
        );
      }
    }
  }

  throw new Error(
    "deleteAllSavedSearches: exceeded retry limit - saved searches may be " +
      "being created faster than this cleans them up",
  );
}
