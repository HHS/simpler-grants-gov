/**
 * @feature Vision page
 * @featureFile frontend/tests/e2e/vision.feature
 * @scenario Show the page title
 * @scenario Open the public wiki link in a new tab
 * @scenario Open the user studies sign-up link in a new tab
 */

import { expect, test } from "@playwright/test";
import { VALID_TAGS } from "tests/e2e/tags";

const { STATIC, EXTENDED, FULL_REGRESSION } = VALID_TAGS;
test.beforeEach(async ({ page }) => {
  // the waitUntil change here is to work around a temporary bug with some staging assets
  // Background: Given I open "/vision"
  await page.goto("/vision", { waitUntil: "load" });
});

/**
 * @scenario Show the page title
 */
test("has title", { tag: [STATIC, FULL_REGRESSION] }, async ({ page }) => {
  // Then the page title should be "Vision | Simpler.Grants.gov"
  await expect(page).toHaveTitle("Vision | Simpler.Grants.gov");
});

/**
 * @scenario Open the public wiki link in a new tab
 */
test(
  "can navigate to wiki in new tab",
  { tag: [STATIC, FULL_REGRESSION] },
  async ({ page, context }) => {
    // Given I should see "Read more about the research on our public wiki"
    const wikiLink = page.getByRole("link", {
      name: /Read more about the research on our public wiki/i,
    });

    // When I scroll "Read more about the research on our public wiki" into view
    await wikiLink.scrollIntoViewIfNeeded();

    // Then "Read more about the research on our public wiki" should have href "https://wiki.simpler.grants.gov/design-and-research/user-research/grants.gov-archetypes"
    await expect(wikiLink).toHaveAttribute(
      "href",
      "https://wiki.simpler.grants.gov/design-and-research/user-research/grants.gov-archetypes",
    );

    // When I click "Read more about the research on our public wiki"
    const newTabPromise = context.waitForEvent("page");
    await wikiLink.click();

    // Then a new tab should open
    const newPage = await newTabPromise;

    // And the new tab URL should be "https://wiki.simpler.grants.gov/design-and-research/user-research/grants.gov-archetypes"
    await expect(newPage).toHaveURL(
      "https://wiki.simpler.grants.gov/design-and-research/user-research/grants.gov-archetypes",
    );
  },
);

/**
 * @scenario Open the user studies sign-up link in a new tab
 */
test(
  "can navigate to ethnio in new tab",
  { tag: [STATIC, EXTENDED] },
  async ({ page, context }) => {
    // Given I should see "Sign up to participate in future user studies"
    const ethnioLink = page.getByRole("link", {
      name: /Sign up to participate in future user studies/i,
    });

    // When I scroll "Sign up to participate in future user studies" into view
    await ethnioLink.scrollIntoViewIfNeeded();

    // Then "Sign up to participate in future user studies" should have href "https://ethn.io/91822"
    await expect(ethnioLink).toHaveAttribute("href", "https://ethn.io/91822");

    // When I click "Sign up to participate in future user studies"
    const newTabPromise = context.waitForEvent("page");
    await ethnioLink.click();

    // Then a new tab should open
    const newPage = await newTabPromise;

    // And the new tab URL should be "https://ethn.io/91822"
    await expect(newPage).toHaveURL("https://ethn.io/91822");
  },
);
