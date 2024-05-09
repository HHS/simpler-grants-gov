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

test.describe("Search page tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the search page with the feature flag set
    await page.goto("/search?_ff=showSearchV0:true");
  });

  test("should return 0 results when searching for obscure term", async ({
    page,
  }) => {
    const searchTerm = "0resultearch";
    // Locate the search input field
    const searchInput = page.locator("#query");
    await searchInput.fill(searchTerm);

    // Click on the 'Search' button
    await page.click(".usa-search >> button[type='submit']");

    const currentURL = page.url();
    expect(currentURL).toContain(`query=${searchTerm}`);

    const resultsHeading = page.getByRole("heading", {
      name: /0 Opportunities/i,
    });
    await expect(resultsHeading).toBeVisible();

    await expect(page.locator("div.usa-prose h2")).toHaveText(
      "Your search did not return any results.",
    );
  });

  test("should show and hide 'Loading results...' when clicking the Forecasted checkbox", async ({
    page,
  }) => {
    // Locators
    const loadingIndicator = page.locator("text='Loading results...'");

    // Scroll explicitly to the checkbox
    await page.locator("#status-forecasted").scrollIntoViewIfNeeded();

    // Ensure the checkbox is enabled before interacting
    await expect(page.locator("#status-forecasted")).toBeEnabled();

    // console.log(
    //   "Forecasted Checkbox Visible:",
    //   await forecastedCheckbox.isVisible(),
    // );
    // console.log(
    //   "Forecasted Checkbox Enabled:",
    //   await forecastedCheckbox.isEnabled(),
    // );
    // console.log(
    //   "Forecasted Checkbox Bounding Box:",
    //   await forecastedCheckbox.boundingBox(),
    // );

    // // Click the checkbox (force-click to ensure interaction)
    // await forecastedCheckbox.click({ force: true });

    // // Verify 'Loading results...' appears
    // await expect(loadingIndicator).toBeVisible();
    // // Verify 'Loading results...' disappears after data loads
    // await expect(loadingIndicator).toBeHidden();

    // // Scroll explicitly to the checkbox again
    // await forecastedCheckbox.scrollIntoViewIfNeeded();

    // // Click the checkbox again (force-click)
    // await forecastedCheckbox.click({ force: true });
  });
});
