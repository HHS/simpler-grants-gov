/**
 * @feature Opportunity page
 * @featureFile frontend/tests/e2e/opportunity.feature
 * @scenario Show the page title
 * @scenario Show key page content
 * @scenario Expand and collapse the opportunity description
 * @scenario Expand and collapse the close date description
 * @scenario Open Grants.gov in a new tab
 */

import { test as base, expect } from "@playwright/test";
import { VALID_TAGS } from "tests/e2e/tags";

import playwrightEnv from "./playwright-env";

const { GRANTEE, OPPORTUNITY_SEARCH, SMOKE, CORE_REGRESSION, FULL_REGRESSION } =
  VALID_TAGS;
type TestWithOpportunityId = {
  testOpportunityId: string;
};

/*

  each opportunity must have:

  * sufficiently long description to hide
  * sufficiently long close date description to hide

*/

const testOpportunityIdMap: {
  [key: string]: string;
} = {
  staging: "332d9e58-7a4d-4bd0-afc8-70b4458262bc",
  local: "6a483cd8-9169-418a-8dfb-60fa6e6f51e5",
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
test(
  "has title",
  { tag: [SMOKE, GRANTEE, OPPORTUNITY_SEARCH] },
  async ({ page }) => {
    // Then the page title should start with "Opportunity Listing -"
    await expect(page).toHaveTitle(/^Opportunity Listing - */);
  },
);

/** @scenario Show key page content */
test(
  "has page attributes",
  { tag: [SMOKE, CORE_REGRESSION, OPPORTUNITY_SEARCH] },
  async ({ page }) => {
    // Then I should see "Application process" in "Application process section"
    await expect(page.getByText("Application process")).toBeVisible();
  },
);

/** @scenario Expand and collapse the opportunity description */
// a bit tough to target the content display toggles on the page, since they have the same text and there's
// nothing really special about the markup surrounding them
test(
  "can expand and collapse opportunity description",
  { tag: [CORE_REGRESSION, GRANTEE, OPPORTUNITY_SEARCH] },
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

/** @scenario Expand and collapse the close date description */
test(
  "can expand and collapse close date description",
  { tag: [FULL_REGRESSION, GRANTEE, OPPORTUNITY_SEARCH] },
  async ({ page }) => {
    const descriptionExpander = page.locator(
      "div[data-testid='opportunity-status-widget'] div[data-testid='content-display-toggle']",
    );

    // Given I should see "Show full description" in "Opportunity status"
    await expect(
      descriptionExpander.getByText("Show full description"),
    ).toBeVisible();

    // And I should not see "Hide full description" in "Opportunity status"
    await expect(
      descriptionExpander.getByText("Hide full description"),
    ).not.toBeVisible();
    const divCountBeforeExpanding = await page.locator("div:visible").count();

    // When I click "Show full description" in "Opportunity status"
    await descriptionExpander
      .getByRole("button", { name: /^Show full description$/ })
      .click();

    // Then I should see "Hide full description" in "Opportunity status"
    // validate that summary has been expanded
    await expect(
      descriptionExpander.getByText("Show full description"),
    ).not.toBeVisible();

    // And I should not see "Show full description" in "Opportunity status"
    await expect(
      descriptionExpander.getByText("Hide full description"),
    ).toBeVisible();

    // And I should see more visible page content in "Opportunity status"
    const divCountAfterExpanding = await page.locator("div:visible").count();
    expect(divCountBeforeExpanding).toBeLessThan(divCountAfterExpanding);

    // When I click "Hide full description" in "Opportunity status"
    await descriptionExpander
      .getByRole("button", { name: /^Hide full description$/ })
      .click();

    // Then I should see "Show full description" in "Opportunity status"
    // validate that summary has been collapsed
    await expect(
      descriptionExpander.getByText("Show full description"),
    ).toBeVisible();

    // And I should not see "Hide full description" in "Opportunity status"
    await expect(
      descriptionExpander.getByText("Hide full description"),
    ).not.toBeVisible();

    // And I should see less visible page content in "Opportunity status"
    const divCountAfterCollapsing = await page.locator("div:visible").count();
    expect(divCountAfterExpanding).toBeGreaterThan(divCountAfterCollapsing);
  },
);

/** @scenario Open Grants.gov in a new tab */
test(
  "can navigate to grants.gov",
  { tag: [CORE_REGRESSION, GRANTEE, OPPORTUNITY_SEARCH] },
  async ({ page, context }) => {
    // Given I should see "View on Grants.gov"
    const newTabPromise = context.waitForEvent("page");

    // When I click "View on Grants.gov"
    await page.getByRole("button", { name: "View on Grants.gov" }).click();

    // Then a new tab should open
    const newPage = await newTabPromise;

    // And the new tab URL should contain "grants.gov/search-results-detail/"
    expect(newPage.url()).toContain(
      "https://test.grants.gov/search-results-detail/",
    );
  },
);
