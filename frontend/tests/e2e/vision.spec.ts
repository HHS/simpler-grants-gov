import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // the waitUntil change here is to work around a temporary bug with some staging assets
  await page.goto("/vision", { waitUntil: "domcontentloaded" });
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle("Vision | Simpler.Grants.gov");
});

test("can navigate to wiki in new tab", async ({ page, context }, testInfo) => {
  const wikiLink = page.getByRole("link", {
    name: /Read more about the research on our public wiki/i,
  });

  await wikiLink.scrollIntoViewIfNeeded();
  await expect(wikiLink).toHaveAttribute(
    "href",
    "https://wiki.simpler.grants.gov/design-and-research/user-research/grants.gov-archetypes",
  );

  const isMobile = testInfo.project.name.match(/[Mm]obile/);
  if (isMobile) {
    return;
  }

  const newTabPromise = context.waitForEvent("page");
  await wikiLink.click();

  const newPage = await newTabPromise;
  await expect(newPage).toHaveURL(
    "https://wiki.simpler.grants.gov/design-and-research/user-research/grants.gov-archetypes",
  );
});

test("can navigate to ethnio in new tab", async ({
  page,
  context,
}, testInfo) => {
  const ethnioLink = page.getByRole("link", {
    name: /Sign up to participate in future user studies/i,
  });

  await ethnioLink.scrollIntoViewIfNeeded();
  await expect(ethnioLink).toHaveAttribute("href", "https://ethn.io/91822");

  const isMobile = testInfo.project.name.match(/[Mm]obile/);
  if (isMobile) {
    return;
  }

  const newTabPromise = context.waitForEvent("page");
  await ethnioLink.click();

  const newPage = await newTabPromise;
  await expect(newPage).toHaveURL("https://ethn.io/91822");
});
