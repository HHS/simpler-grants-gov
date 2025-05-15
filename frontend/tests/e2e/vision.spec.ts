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
    .click();

  const newPage = await newTabPromise;
  await expect(newPage).toHaveURL(
    "https://wiki.simpler.grants.gov/design-and-research/user-research/grants.gov-archetypes",
  );
});

test("can navigate to ethnio in new tab", async ({ page, context }) => {
  const newTabPromise = context.waitForEvent("page");
  await page
    .getByRole("link", {
      name: /Sign up to participate in future user studies/i,
    })
    .click();

  const newPage = await newTabPromise;
  await expect(newPage).toHaveURL("https://ethn.io/91822");
});
