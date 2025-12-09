import { test as base, expect } from "@playwright/test";

type TestWithOpportunityId = {
  testOpportunityId: string;
};

const testOpportunityIdMap: { [key: string]: string } = {
  staging: "fa5703d3-a358-4969-9c1e-c5cc0ce21f63",
  local: "c3c59562-a54f-4203-b0f6-98f2f0383481",
};

const targetEnv = process.env.TEST_TARGET_ENV || "local";

// either a statically seeded id or an id that exists in staging pointing to a fully populated opportunity
// note that this staging id may be subject to change
const testOpportunityId = testOpportunityIdMap[targetEnv];

const test = base.extend<TestWithOpportunityId>({
  testOpportunityId,
});

test.beforeEach(async ({ page, testOpportunityId }) => {
  await page.goto(`/opportunity/${testOpportunityId}`);
});

test.afterEach(async ({ context }) => {
  await context.close();
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle(/^Opportunity Listing - */);
});

test("has page attributes", async ({ page }) => {
  await expect(page.getByText("Application process")).toBeVisible();
});

// a bit tough to target the content display toggles on the page, since they have the same text and there's
// nothing really special about the markup surrounding them
test("can expand and collapse opportunity description", async ({ page }) => {
  const descriptionExpander = page.locator(
    "div[data-testid='opportunity-description'] div[data-testid='content-display-toggle']",
  );

  await expect(
    descriptionExpander.getByText("Show full description"),
  ).toBeVisible();
  await expect(
    descriptionExpander.getByText("Hide full description"),
  ).not.toBeVisible();
  const divCountBeforeExpanding = await page.locator("div:visible").count();

  await descriptionExpander
    .getByRole("button", { name: /^Show full description$/ })
    .click();

  // validate that summary has been expanded
  await expect(
    descriptionExpander.getByText("Show full description"),
  ).not.toBeVisible();
  await expect(
    descriptionExpander.getByText("Hide full description"),
  ).toBeVisible();
  const divCountAfterExpanding = await page.locator("div:visible").count();
  expect(divCountBeforeExpanding).toBeLessThan(divCountAfterExpanding);

  await descriptionExpander
    .getByRole("button", { name: /^Hide full description$/ })
    .click();

  // validate that summary has been collapsed
  await expect(
    descriptionExpander.getByText("Show full description"),
  ).toBeVisible();
  await expect(
    descriptionExpander.getByText("Hide full description"),
  ).not.toBeVisible();
  const divCountAfterCollapsing = await page.locator("div:visible").count();
  expect(divCountAfterExpanding).toBeGreaterThan(divCountAfterCollapsing);
});

test("can expand and collapse close date description", async ({ page }) => {
  const descriptionExpander = page.locator(
    "div[data-testid='opportunity-status-widget'] div[data-testid='content-display-toggle']",
  );

  await expect(
    descriptionExpander.getByText("Show full description"),
  ).toBeVisible();
  await expect(
    descriptionExpander.getByText("Hide full description"),
  ).not.toBeVisible();
  const divCountBeforeExpanding = await page.locator("div:visible").count();

  await descriptionExpander
    .getByRole("button", { name: /^Show full description$/ })
    .click();

  // validate that summary has been expanded
  await expect(
    descriptionExpander.getByText("Show full description"),
  ).not.toBeVisible();
  await expect(
    descriptionExpander.getByText("Hide full description"),
  ).toBeVisible();
  const divCountAfterExpanding = await page.locator("div:visible").count();
  expect(divCountBeforeExpanding).toBeLessThan(divCountAfterExpanding);

  await descriptionExpander
    .getByRole("button", { name: /^Hide full description$/ })
    .click();

  // validate that summary has been collapsed
  await expect(
    descriptionExpander.getByText("Show full description"),
  ).toBeVisible();
  await expect(
    descriptionExpander.getByText("Hide full description"),
  ).not.toBeVisible();
  const divCountAfterCollapsing = await page.locator("div:visible").count();
  expect(divCountAfterExpanding).toBeGreaterThan(divCountAfterCollapsing);
});

test("can navigate to grants.gov", async ({ page, context }) => {
  const newTabPromise = context.waitForEvent("page");
  await page.getByRole("button", { name: "View on Grants.gov" }).click();

  const newPage = await newTabPromise;
  // await waitForURLChange(page, (url) => !!url.match(/grants\.gov/));
  await expect(newPage).toHaveURL(
    "https://test.grants.gov/search-results-detail/33",
  );
});
