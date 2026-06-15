// search-opportunity-utils.ts
// Navigates to Search and verifies a published opportunity row by title, number, and status.
// Usage: import { verifyOpportunityInSearchByTitleAndNumber } from "tests/e2e/opportunity/search-opportunity-utils";

import { expect, type Page } from "@playwright/test";

/**
 * Navigates to Search, runs a title query, and asserts the matching row
 * contains the expected title, opportunity number, and status.
 */
export async function verifyOpportunityInSearchByTitleAndNumber(
  page: Page,
  opportunityTitle: string,
  opportunityNumber: string,
  expectedStatus: string = "Open",
): Promise<void> {
  await page.goto("/search");
  await expect(page).toHaveURL(/\/search/);

  const searchInput = page.locator("#query");
  await expect(searchInput).toBeVisible();
  await searchInput.fill(opportunityTitle);
  await page
    .getByRole("search")
    .getByRole("button", { name: "Search", exact: true })
    .click();

  const matchingSearchRow = page
    .locator("tr", {
      has: page.getByRole("link", { name: opportunityTitle }),
    })
    .first();

  await expect(matchingSearchRow).toBeVisible();
  await expect(matchingSearchRow).toContainText(opportunityTitle);
  await expect(matchingSearchRow).toContainText(opportunityNumber);
  await expect(matchingSearchRow).toContainText(expectedStatus);
}
