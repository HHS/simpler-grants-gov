import { BrowserContext, Locator, Page, expect, test } from "@playwright/test";

test("should navigate from index to search page", async ({ page }) => {
  // Start from the index page with feature flag set
  await page.goto("/?_ff=showSearchV0:true");

  // Mobile chrome must first click the menu button
  if (await hasMobileMenu(page)) {
    const menuButton = getMobileMenuButton(page);
    await clickMobileNavMenu(menuButton);
  }

  await clickSearchNavLink(page);

  // Verify that the new URL is correct
  expectURLContainsQueryParam(page, "status", "forecasted,posted");

  // Verify the presence of "Search" content on the page
  await expect(page.locator("h1")).toContainText(
    "Search funding opportunities",
  );

  // Verify that the 'forecasted' and 'posted' are checked
  await expectIDIsChecked(page, "#status-forecasted");
  await expectIDIsChecked(page, "#status-posted");
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

    await fillSearchInputAndSubmit(searchTerm, page);

    expectURLContainsQueryParam(page, "query", searchTerm);

    const resultsHeading = page.getByRole("heading", {
      name: /0 Opportunities/i,
    });
    await expect(resultsHeading).toBeVisible();

    await expect(page.locator("div.usa-prose h2")).toHaveText(
      "Your search did not return any results.",
    );
  });

  test("should show and hide loading state", async ({ page }) => {
    const searchTerm = "advanced";
    await fillSearchInputAndSubmit(searchTerm, page);

    const loadingIndicator = page.locator("text='Loading results...'");
    await expect(loadingIndicator).toBeVisible();
    await expect(loadingIndicator).toBeHidden();

    const searchTerm2 = "agency";
    await fillSearchInputAndSubmit(searchTerm2, page);
    await expect(loadingIndicator).toBeVisible();
    await expect(loadingIndicator).toBeHidden();
  });

  test("should retain filters in a new tab", async ({ page, context }) => {
    const searchTerm = "education";
    const checkboxIDs = ["#status-forecasted", "#status-posted"];

    // await waitForSearchResultsLoaded(page);

    await fillSearchInputAndSubmit(searchTerm, page);

    for (const checkboxId of checkboxIDs) {
      await toggleCheckbox(page, checkboxId, true);
    }
    // Ensure URL contains all query parameters
    expectURLContainsQueryParam(page, "query", searchTerm);
    expectURLContainsQueryParam(page, "status", checkboxIDs.join(","));

    const newPage = await goToNewPageUsingCurrentURL(page, context);

    // Ensure search term and checkboxes are retained in the new tab
    const searchInput = getSearchInput(page);
    await expect(searchInput).toHaveValue(searchTerm);

    for (const checkboxID of checkboxIDs) {
      await expectIDIsChecked(newPage, checkboxID);
    }

    // Close the new tab
    await newPage.close();
  });
});

// =========================
// Test Helper Functions
// =========================

function getSearchInput(page: Page) {
  return page.locator("#query");
}

async function fillSearchInputAndSubmit(term: string, page: Page) {
  const searchInput = getSearchInput(page);
  await searchInput.fill(term);
  await page.click(".usa-search >> button[type='submit']");
}

function expectURLContainsQueryParam(
  page: Page,
  queryParamName: string,
  queryParamValue: string,
) {
  const currentURL = page.url();
  expect(currentURL).toContain(`${queryParamName}=${queryParamValue}`);
}

async function clickSearchNavLink(page: Page) {
  await page.click("nav >> text=Search");
}

function getMobileMenuButton(page: Page) {
  return page.locator("button >> text=MENU");
}

async function hasMobileMenu(page: Page) {
  const menuButton = getMobileMenuButton(page);
  return await menuButton.isVisible();
}

async function clickMobileNavMenu(menuButton: Locator) {
  await menuButton.click();
}

async function expectIDIsChecked(page: Page, idWithHash: string) {
  const checkbox: Locator = page.locator(idWithHash);
  await expect(checkbox).toBeChecked();
}

async function toggleCheckbox(
  page: Page,
  idWithHash: string,
  shouldBeChecked: boolean,
) {
  const checkbox: Locator = page.locator(idWithHash);
  // Wait for the checkbox to be enabled and then scroll into view
  await checkbox.isEnabled();
  await checkbox.scrollIntoViewIfNeeded();

  const isChecked = await checkbox.isChecked();
  if (isChecked !== shouldBeChecked) {
    await checkbox.click({ timeout: 5000 });
    await checkbox.dispatchEvent("click");
  }
}

async function goToNewPageUsingCurrentURL(page: Page, context: BrowserContext) {
  // Copy the current URL
  const currentURL = page.url();

  // Open a new tab with the copied URL
  const newPage = await context.newPage();
  await newPage.goto(currentURL);

  return newPage;
}

// async function waitForSearchResultsLoaded(page: Page) {
//   // Wait specifically for the heading indicating the number of opportunities
//   //   await page
//   //     .locator("div.usa-prose h2:has-text('Opportunities')")
//   //     .waitFor({ state: "visible" });
//   await page
//     .locator("ul.usa-list--unstyled")
//     .first()
//     .waitFor({ state: "visible", timeout: 60000 });
// }
