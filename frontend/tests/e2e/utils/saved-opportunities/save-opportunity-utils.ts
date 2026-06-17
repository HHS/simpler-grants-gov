import { expect, type Page } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { waitForURLChange } from "tests/e2e/playwrightUtils";

const { targetEnv } = playwrightEnv;

/**
 * Asserts that the Saved Opportunities page is fully rendered and the
 * opportunity link is visible. Called after the "newly saved" path to
 * confirm the page has settled before returning to the caller.
 *
 * @param page  - Playwright Page instance
 * @param title - Exact opportunity title expected to be visible
 */

async function assertSavedOpportunitiesPageReady(
  page: Page,

  title: string,
): Promise<void> {
  const timeout = targetEnv === "staging" ? 30000 : 5000;

  await expect(page).toHaveTitle("Saved opportunities | Simpler.Grants.gov", {
    timeout,
  });

  await expect(page.getByRole("link", { name: title })).toBeVisible({
    timeout,
  });
}

/**
* Navigates to the Search page, searches for an opportunity by title,
* opens its detail page, and saves it via the save button.
* Waits for the save button to confirm the save completed before navigating.
* Returns to the Saved Opportunities page on completion.
*
* @param page  - Playwright Page instance
* @param title - Exact opportunity title to search for (e.g. "TEST-APPLY-ORG-IND-OT01")

*/

export async function saveOpportunityViaSearch(
  page: Page,

  title: string,
): Promise<void> {
  // Navigate directly to Search - avoids mobile hamburger nav state

  await page.goto("/search");
  await waitForURLChange(page, (url) => !!url.match(/\/search/));

  // Search for the opportunity by title
  const searchBox = page.getByRole("searchbox", {
    name: /Tip: Use a minus sign to/,
  });

  await searchBox.click();

  await searchBox.fill(title);

  await page.getByRole("button", { name: "Search", exact: true }).click();

  // Open the opportunity detail page from search results
  await page.getByRole("link", { name: title }).first().click();

  await waitForURLChange(
    page,

    (url) => !!url.match(/opportunity|opportunities/),
  );

  // Save the opportunity via the save button
  await page.getByTestId("simpler-save-button").click();

  // Wait for the UI to confirm the save completed before navigating away.
  await expect(page.getByTestId("simpler-save-button")).toContainText(/saved/i);

  // Return to Saved Opportunities via direct navigation - avoids mobile nav state
  await page.goto("/saved-opportunities");
  await waitForURLChange(page, (url) => !!url.match(/saved-opportunities/));

  // Confirm the page has settled and the opportunity link is visible
  await assertSavedOpportunitiesPageReady(page, title);
}

/**
 * Ensures an opportunity is saved in the user's workspace before assertions run.
 * - If already saved: verifies the page is settled and ready
 * - If not saved: searches for it, saves it, then returns to Saved Opportunities
 *
 * Precondition: page must already be on the Saved Opportunities URL.
 *
 * @param page  - Playwright Page instance
 * @param title - Exact opportunity title to check/save
 */

export async function ensureOpportunityIsSaved(
  page: Page,

  title: string,
): Promise<void> {
  
  const timeout = targetEnv === "staging" ? 30000 : 5000;

  await expect(page).toHaveTitle("Saved opportunities | Simpler.Grants.gov", {
    timeout,
  });

  let isAlreadySaved = false;
  try {
    await expect(
      page.getByRole("link", { name: title, exact: true }),
    ).toBeVisible({ timeout: 3000 });
    isAlreadySaved = true;
  } catch {
    isAlreadySaved = false;
  }

  if (!isAlreadySaved) {
    await saveOpportunityViaSearch(page, title);
  } else {
    await assertSavedOpportunitiesPageReady(page, title);
  }
}
