/* eslint-disable testing-library/prefer-screen-queries */
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/vision");
});

test.afterEach(async ({ context }) => {
  await context.close();
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle("Vision | Simpler.Grants.gov");
});

test("can navigate to wiki in new tab", async ({ page, context }) => {
  const newTabPromise = context.waitForEvent("page");
  await page
    .getByRole("link", {
      name: /Read more about the research on our public wiki/i,
    })
    .getByTestId("button")
    .click();

  const newPage = await newTabPromise;
  await expect(newPage).toHaveURL(/wiki\.simpler\.grants\.gov/g);
});

test("can navigate to ethnio in new tab", async ({ page, context }) => {
  const newTabPromise = context.waitForEvent("page");
  await page
    .getByRole("link", {
      name: /Sign up to participate in future user studies/i,
    })
    .getByTestId("button")
    .click();

  const newPage = await newTabPromise;
  await expect(newPage).toHaveURL(/ethn\.io/g);
});
