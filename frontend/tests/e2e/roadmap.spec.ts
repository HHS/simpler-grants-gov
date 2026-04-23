/**
* @feature Roadmap page
* @featureFile frontend/tests/e2e/roadmap.feature
* @scenario Show the page title
* @scenario Return to top link works
* @scenario View all deliverables on Github
*/

import { expect, test } from "@playwright/test";
import { VALID_TAGS } from "tests/e2e/tags";

const { STATIC, EXTENDED, FULL_REGRESSION } = VALID_TAGS;

test.beforeEach(async ({ page }) => {
  // Background: Given I open "/roadmap"
  await page.goto("/roadmap");
});

/**
* @scenario Show the page title
*/
test("has title", { tag: [STATIC, FULL_REGRESSION] }, async ({ page }) => {
  // Then the page title should be "Roadmap | Simpler.Grants.gov"
  await expect(page).toHaveTitle("Roadmap | Simpler.Grants.gov");
});

/**
* @scenario Return to top link works
*/
test(
  "can return to top after scrolling to the bottom",
  { tag: [STATIC, FULL_REGRESSION] },
  async (
    { page },
    {
      project: {
        use: { isMobile, defaultBrowserType },
      },
    },
  ) => {
    const isMobileSafari = isMobile && defaultBrowserType === "webkit";
    const returnToTopLink = page.getByRole("link", { name: /return to top/i });

    // When I scroll to the bottom of the page
    // https://github.com/microsoft/playwright/issues/2179
    if (!isMobileSafari) {
      await returnToTopLink.scrollIntoViewIfNeeded();
    } else {
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight),
      );
    }

    // And I click "Return to top"
    await returnToTopLink.click();

    // Then I should be back at the top
    await expect(returnToTopLink).not.toBeInViewport();

    // And I should see "Product roadmap" heading in view
    await expect(
      page.getByRole("heading", { name: "Product roadmap" }),
    ).toBeInViewport();
  },
);

/**
* @scenario View all deliverables on Github
*/
test(
  "can view the 'View all deliverables on Github'",
  { tag: [STATIC, EXTENDED] },
  async ({ page }) => {
    const newTabPromise = page.waitForEvent("popup");

    // When I click "View all deliverables on Github"
    await page
      .getByRole("link", { name: "View all deliverables on Github" })
      .click();

    // Then I should stay on the roadmap page
    // Assert user remains on the roadmap page.
    await expect(page).toHaveTitle(/Roadmap | Simpler.Grants.gov/);

    // And a new tab should open
    // Assert that the github issues page for SGG is opened in a new tab.
    const newTab = await newTabPromise;
    await newTab.waitForLoadState();

    // And the new tab URL should be "https://github.com/orgs/HHS/projects/12/views/8"
    await expect(newTab).toHaveURL(
      "https://github.com/orgs/HHS/projects/12/views/8",
    );
  },
);
