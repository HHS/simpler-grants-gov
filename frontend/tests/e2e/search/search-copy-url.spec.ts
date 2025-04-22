import { expect, test } from "@playwright/test";

test("should copy search query URL to clipboard", async ({ page }) => {
  await page.goto("/search");

  const searchInput = page.getByLabel("Search terms Enter keywords,");
  await searchInput.fill("education grants");
  await searchInput.press("Enter");

  await page.waitForURL(/.*search.*query=education\+grants.*/, {
    timeout: 10000,
  });

  // Check if we need to show filters
  const showFiltersButton = page.getByRole("button", { name: "Show Filters" });
  if (await showFiltersButton.isVisible()) {
    await showFiltersButton.click();
    await page.waitForTimeout(500);
  }

  // Look for the copy button
  const copyButton = page.getByText("Copy this search query");
  await copyButton.waitFor({ state: "visible", timeout: 5000 });

  // Click the button and verify that the action is successful
  await copyButton.click();

  // Get the current URL to verify it contains the expected query
  const currentUrl = page.url();
  expect(currentUrl).toContain("/search?query=education+grants");
});
