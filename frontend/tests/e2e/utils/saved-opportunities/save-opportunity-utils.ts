import { expect, type Page } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { waitForURLChange } from "tests/e2e/playwrightUtils";

const { targetEnv } = playwrightEnv;

/**
 * Asserts that the Saved Opportunities page is fully rendered.
 * Called after both the "already saved" and "newly saved" paths
 * to guarantee a consistent state before assertions.
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
 * Returns to the Saved Opportunities page on completion.
 *
 * @param page  - Playwright Page instance
 * @param title - Exact opportunity title to search for (e.g. "TEST-APPLY-ORG-IND-OT01")
 */

export async function saveOpportunityViaSearch(
  page: Page,
  title: string,
): Promise<void> {
  // Navigate to Search via the header link
  await page
    .getByTestId("header")
    .getByRole("link", { name: "Search", exact: true })
    .click();
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

  // Return to Saved Opportunities via Workspace dropdown
  // When the user clicks the "Workspace" dropdown button
  // find the Workspace nav dropdown item and open it
  const dropDownButton = page.locator("#nav-dropdown-button-4");
  await expect(dropDownButton).toBeInViewport();
  await dropDownButton.click();

  // And the user clicks the "Saved opportunities" item in the Workspace dropdown
  // the fourth item in the dropdown should be the saved opportunities link
  const savedOpportunitiesNavItem = page.locator(
    "ul#Workspace li:nth-child(4)",
  );
  await expect(savedOpportunitiesNavItem).toHaveText("Saved opportunities");
  await savedOpportunitiesNavItem.click();

  await waitForURLChange(page, (url) => !!url.match(/saved-opportunities/));
}

/**
 * Ensures an opportunity is saved in the user's workspace before assertions run.
 * - If already saved: verifies the page is settled and ready
 * - If not saved: searches for it, saves it, then returns to Saved Opportunities
 *
 * In both cases assertSavedOpportunitiesPageReady() is called to guarantee:
 *   - The page title is "Saved opportunities | Simpler.Grants.gov"
 *   - The opportunity link is visible and the page is ready for assertions
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
  const isAlreadySaved = await page
    .getByRole("link", { name: title, exact: true })
    .isVisible();

  if (!isAlreadySaved) {
    // Opportunity not found in saved list - navigate to Search, find it, and save it
    await saveOpportunityViaSearch(page, title);
  }

  // Called in both paths - guarantees page title and opportunity link are ready
  await assertSavedOpportunitiesPageReady(page, title);
}
