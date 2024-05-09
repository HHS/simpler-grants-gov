import { expect, test } from "@playwright/test";

test("should navigate from index to search page", async ({ page }) => {
  // Start from the index page with feature flag set
  await page.goto("/?_ff=showSearchV0:true");

  // Mobile chrome must first click the menu button
  const menuButton = page.locator("button >> text=MENU");
  if (await menuButton.isVisible()) {
    await menuButton.click();
  }
  // Locate the 'Search' link in the navigation bar and click on it
  await page.click("nav >> text=Search");

  // Verify that the new URL is correct
  await expect(page).toHaveURL("/search?status=forecasted,posted");

  // Verify the presence of "Search" content on the page
  await expect(page.locator("h1")).toContainText(
    "Search funding opportunities",
  );

  // Verify that the 'forecasted' checkbox is checked
  const forecastedCheckbox = page.locator("#status-forecasted");
  await expect(forecastedCheckbox).toBeChecked();

  // Verify that correct status checkboxes are checked
  const postedCheckbox = page.locator("#status-posted");
  await expect(postedCheckbox).toBeChecked();
});
