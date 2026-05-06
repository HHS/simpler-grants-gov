/**
 * @feature Search Copy URL
 * @featureFile e2e/search/search-core/features/search-copy-url.feature
 * @scenario Copy the current search query URL and paste it into the search input
 */

import { expect, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { waitForURLContainsQueryParam } from "tests/e2e/playwrightUtils";
import { VALID_TAGS } from "tests/e2e/tags";

import { fillSearchInputAndSubmit } from "tests/e2e/search/searchSpecUtil";

const { baseUrl } = playwrightEnv;

const { GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION } = VALID_TAGS;

test(
  "should copy search query URL to clipboard",
  { tag: [GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION] },
  async ({ page }, { project }) => {
    // clipboard testing does not work in webkit
    if (project.name.match(/[Ww]ebkit/)) {
      return;
    }
    // copy button is not visible in mobile
    if (project.name.match(/[Mm]obile/)) {
      return;
    }

    await page.goto("/search");

    // this is dumb but webkit has an issue with trying to fill in the input too quickly
    // if the expect in here fails, we give it another shot after 5 seconds
    // this way we avoid an arbitrary timeout, and do not slow down the other tests
    // Given I search for "<search-term>"
    try {
      await fillSearchInputAndSubmit("education grants", page);
    } catch (_e) {
      await fillSearchInputAndSubmit("education grants", page);
    }

    // And the Copy this search query control is visible
    const copyButton = page.getByText("Copy this search query");
    await copyButton.waitFor({ state: "visible", timeout: 5000 });
    await waitForURLContainsQueryParam(page, "query");

    // When I click Copy this search query
    await copyButton.click();

    // const clipboardText = await page.evaluate("navigator.clipboard.readText()");
    // expect(clipboardText).toContain("/search?query=education+grants");

    // And I paste from clipboard into the search input
    const searchInput = page.locator("#query");
    await searchInput.fill("");
    await searchInput.press("ControlOrMeta+V");

    // Then the search input should contain "/search?query=<search-term>"
    await expect(searchInput).toHaveValue(
      `${baseUrl}/search?query=education+grants`,
    );
  },
);
