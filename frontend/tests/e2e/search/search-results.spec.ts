import { expect, test } from "@playwright/test";
import { screen } from "@testing-library/react";

import {
  fillSearchInputAndSubmit,
  waitForSearchResultsInitialLoad,
} from "./searchSpecUtil";

test.beforeEach(async ({ page }) => {
  const searchTerm = "grants";
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
});

test.afterEach(async ({ context }) => {
  await context.close();
});

test.describe("Search page results tests", () => {
  test("should return at least 1 result when searching with valid term", async ({
    page,
  }) => {
    // eslint-disable-next-line testing-library/prefer-screen-queries
    const resultsHeading = page.getByRole("heading", {
      name: /^[1-9]\d*\s+Opportunities$/i,
    });
    await expect(resultsHeading).toBeVisible();
  });

  test("should have a list of opportunities available", async ({ page }) => {
    await expect(page.getByTestId("search-list")).toBeAttached();
  });

  test("list of opportunities should have at least one opportunity", async ({
    page,
  }) => {
    const searchList = page.getByTestId("search-list");
    await expect(searchList.locator("li >> nth=1")).toBeVisible();
  });
});
