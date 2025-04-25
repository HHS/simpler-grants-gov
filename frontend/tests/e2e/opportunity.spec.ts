/* eslint-disable testing-library/prefer-screen-queries */
import { expect, test } from "@playwright/test";

// import { waitForURLChange } from "./playwrightUtils";

test.beforeEach(async ({ page }) => {
  await page.goto("/opportunity/32");
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

test("can expand and collapse summary", async ({ page }) => {
  await expect(page.getByText("Show full summary")).toBeVisible();
  await expect(page.getByText("Hide full description")).not.toBeVisible();
  const divCountBeforeExpanding = await page.locator("div:visible").count();

  await page.getByRole("button", { name: /^Show full summary$/ }).click();

  // validate that summary has been expanded
  await expect(page.getByText("Show full summary")).not.toBeVisible();
  await expect(page.getByText("Hide full description")).toBeVisible();
  const divCountAfterExpanding = await page.locator("div:visible").count();
  expect(divCountBeforeExpanding).toBeLessThan(divCountAfterExpanding);

  await page.getByRole("button", { name: /^Hide full description$/ }).click();

  // validate that summary has been collapsed
  await expect(page.getByText("Show full summary")).toBeVisible();
  await expect(page.getByText("Hide full description")).not.toBeVisible();
  const divCountAfterCollapsing = await page.locator("div:visible").count();
  expect(divCountAfterExpanding).toBeGreaterThan(divCountAfterCollapsing);
});

test("can expand and collapse description", async ({ page }) => {
  await expect(page.getByText("Show full description")).toBeVisible();
  await expect(page.getByText("Hide full description")).not.toBeVisible();
  const divCountBeforeExpanding = await page.locator("div:visible").count();

  await page.getByRole("button", { name: /^Show full description$/ }).click();

  // validate that description has been expanded
  await expect(page.getByText("Show full description")).not.toBeVisible();
  await expect(page.getByText("Hide full description")).toBeVisible();
  const divCountAfterExpanding = await page.locator("div:visible").count();
  expect(divCountBeforeExpanding).toBeLessThan(divCountAfterExpanding);

  await page.getByRole("button", { name: /^Hide full description$/ }).click();

  // validate that description has been collapsed
  await expect(page.getByText("Show full description")).toBeVisible();
  await expect(page.getByText("Hide full description")).not.toBeVisible();
  const divCountAfterCollapsing = await page.locator("div:visible").count();
  expect(divCountAfterExpanding).toBeGreaterThan(divCountAfterCollapsing);
});

test("can navigate to grants.gov", async ({ page, context }) => {
  const newTabPromise = context.waitForEvent("page");
  await page.getByRole("button", { name: "View on Grants.gov" }).click();

  const newPage = await newTabPromise;
  // await waitForURLChange(page, (url) => !!url.match(/grants\.gov/));
  await expect(newPage).toHaveTitle("Search Results Detail | Grants.gov");
});
