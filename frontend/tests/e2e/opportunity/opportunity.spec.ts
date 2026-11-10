/**
 * @feature Opportunity page
 * @scenario Show the page title
 * @scenario Show key page content
 * @scenario Expand and collapse the opportunity description
 * @scenario Show the important dates section
 */

import { test as base, expect } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";

const { DISCOVERY, SMOKE, FULL_REGRESSION } = VALID_TAGS;
type TestWithOpportunityId = {
  testOpportunityId: string;
};

/*

  each opportunity must have:

  * sufficiently long description to hide

*/

const testOpportunityIdMap: {
  [key: string]: string;
} = {
  staging: "332d9e58-7a4d-4bd0-afc8-70b4458262bc",
  local: "6a483cd8-9169-418a-8dfb-60fa6e6f51e5",
  grantor1: "332d9e58-7a4d-4bd0-afc8-70b4458262bc",
  grantor2: "332d9e58-7a4d-4bd0-afc8-70b4458262bc",
};

// either a statically seeded id or an id that exists in staging pointing to a fully populated opportunity
// note that this staging id may be subject to change
const testOpportunityId = testOpportunityIdMap[playwrightEnv.targetEnv];

const test = base.extend<TestWithOpportunityId>({
  testOpportunityId,
});

// Background: Given I open the Opportunity page with a valid opportunity ID
test.beforeEach(async ({ page, testOpportunityId }) => {
  await page.goto(`/opportunity/${testOpportunityId}`);
});

/** @scenario Show the page title */
test("has title", { tag: [DISCOVERY, SMOKE] }, async ({ page }) => {
  // Then the page title should start with "Opportunity Listing -"
  await expect(page).toHaveTitle(/^Opportunity Listing - */);
});

/** @scenario Show key page content */
test("has page attributes", { tag: [DISCOVERY, SMOKE] }, async ({ page }) => {
  // Then I should see the main section headings
  for (const name of [
    "Summary",
    "Eligibility",
    "Agency contact information",
    "Link to additional information",
  ]) {
    await expect(
      page.getByRole("heading", { level: 2, name, exact: true }),
    ).toBeVisible();
  }
});

/** @scenario Expand and collapse the opportunity description */
// a bit tough to target the content display toggles on the page, since they have the same text and there's
// nothing really special about the markup surrounding them
test(
  "can expand and collapse opportunity description",
  { tag: [DISCOVERY, FULL_REGRESSION] },
  async ({ page }) => {
    const descriptionExpander = page.locator(
      "div[data-testid='opportunity-description'] div[data-testid='content-display-toggle']",
    );

    // Given I should see "Show full description" in "Opportunity description"
    await expect(
      descriptionExpander.getByText("Show full description"),
    ).toBeVisible();

    // And I should not see "Hide full description" in "Opportunity description"
    await expect(
      descriptionExpander.getByText("Hide full description"),
    ).not.toBeVisible();
    const divCountBeforeExpanding = await page.locator("div:visible").count();

    // When I click "Show full description" in "Opportunity description"
    await descriptionExpander
      .getByRole("button", { name: /^Show full description$/ })
      .click();

    // And I should not see "Show full description" in "Opportunity description"
    // validate that summary has been expanded
    await expect(
      descriptionExpander.getByText("Show full description"),
    ).not.toBeVisible();

    // Then I should see "Hide full description" in "Opportunity description"
    await expect(
      descriptionExpander.getByText("Hide full description"),
    ).toBeVisible();

    // And I should see more visible page content in "Opportunity description"
    const divCountAfterExpanding = await page.locator("div:visible").count();
    expect(divCountBeforeExpanding).toBeLessThan(divCountAfterExpanding);

    // When I click "Hide full description" in "Opportunity description"
    await descriptionExpander
      .getByRole("button", { name: /^Hide full description$/ })
      .click();

    // Then I should see "Show full description" in "Opportunity description"
    // validate that summary has been collapsed
    await expect(
      descriptionExpander.getByText("Show full description"),
    ).toBeVisible();

    // And I should not see "Hide full description" in "Opportunity description"
    await expect(
      descriptionExpander.getByText("Hide full description"),
    ).not.toBeVisible();

    // And I should see less visible page content in "Opportunity description"
    const divCountAfterCollapsing = await page.locator("div:visible").count();
    expect(divCountAfterExpanding).toBeGreaterThan(divCountAfterCollapsing);
  },
);

/** @scenario Show the important dates section */
test(
  "has important dates",
  { tag: [DISCOVERY, FULL_REGRESSION] },
  async ({ page }) => {
    // Then I should see the "Important dates", "Award details" and "History" sections
    for (const name of ["Important dates", "Award details", "History"]) {
      await expect(
        page.getByRole("heading", { level: 2, name, exact: true }),
      ).toBeVisible();
    }
  },
);
