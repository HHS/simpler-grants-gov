import { expect, Page, test } from "@playwright/test";
import { BrowserContextOptions } from "playwright-core";
import { generateRandomString } from "tests/e2e/playwrightUtils";

import {
  fillSearchInputAndSubmit,
  waitForSearchResultsInitialLoad,
} from "./searchSpecUtil";

interface PageProps {
  page: Page;
  browserName?: string;
  contextOptions?: BrowserContextOptions;
}

test.describe("Search page tests", () => {
  test("should return 0 results when searching for obscure term", async ({
    page,
  }: PageProps) => {
    const searchTerm = generateRandomString([10]);

    await page.goto("/search");

    await waitForSearchResultsInitialLoad(page);

    // this is dumb but webkit has an issue with trying to fill in the input too quickly
    // if the expect in here fails, we give it another shot after 5 seconds
    // this way we avoid an arbitrary timeout, and do not slow down the other tests
    try {
      await fillSearchInputAndSubmit(searchTerm, page);
    } catch (e) {
      await fillSearchInputAndSubmit(searchTerm, page);
    }

    await page.waitForURL("/search?query=" + searchTerm);

    // eslint-disable-next-line testing-library/prefer-screen-queries
    const resultsHeading = page.getByRole("heading", {
      name: /0 Opportunities/i,
    });
    await expect(resultsHeading).toBeVisible();

    await expect(page.locator("div.usa-prose h2")).toHaveText(
      "Your search did not return any results.",
    );
  });
});
