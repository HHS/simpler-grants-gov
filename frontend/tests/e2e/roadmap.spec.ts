import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/roadmap");
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle("Roadmap | Simpler.Grants.gov");
});

test("can return to top after scrolling to the bottom", async ({ page }, {
  project: {
    use: { isMobile, defaultBrowserType },
  },
}) => {
  const isMobileSafari = isMobile && defaultBrowserType === "webkit";
  const returnToTopLink = page.getByRole("link", { name: /return to top/i });

  // https://github.com/microsoft/playwright/issues/2179
  if (!isMobileSafari) {
    await returnToTopLink.scrollIntoViewIfNeeded();
  } else {
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
  }

  await returnToTopLink.click();

  await expect(returnToTopLink).not.toBeInViewport();
  await expect(
    page.getByRole("heading", { name: "Product roadmap" }),
  ).toBeInViewport();
});

test("can view the 'View all deliverables on Github'", async ({ page }) => {
  const newTabPromise = page.waitForEvent("popup");

  await page
    .getByRole("link", { name: "View all deliverables on Github" })
    .click();

  // Assert user remains on the roadmap page.
  await expect(page).toHaveTitle(/Roadmap | Simpler.Grants.gov/);

  // Assert that the github issues page for SGG is opened in a new tab.
  const newTab = await newTabPromise;
  await newTab.waitForLoadState();
  await expect(newTab).toHaveURL(
    "https://github.com/orgs/HHS/projects/12/views/8",
  );
});
