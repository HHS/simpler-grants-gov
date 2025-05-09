import { expect, test } from "@playwright/test";

import { fillSearchInputAndSubmit } from "./searchSpecUtil";

test("should copy search query URL to clipboard", async ({ page }) => {
  await page.goto("/search");

  // this is dumb but webkit has an issue with trying to fill in the input too quickly
  // if the expect in here fails, we give it another shot after 5 seconds
  // this way we avoid an arbitrary timeout, and do not slow down the other tests
  try {
    await fillSearchInputAndSubmit("education grants", page);
  } catch (e) {
    await fillSearchInputAndSubmit("education grants", page);
  }
  // Check if we need to show filters
  const showFiltersButton = page.getByRole("button", { name: "Show Filters" });
  if (await showFiltersButton.isVisible()) {
    await showFiltersButton.click();
    await page.waitForTimeout(500);
  }

  // Look for the copy button
  const copyButton = page.getByText("Copy this search query");
  await copyButton.waitFor({ state: "visible", timeout: 5000 });

  // Click the button and verify that the action is successful
  await copyButton.click();

  // Get the current URL to verify it contains the expected query
  const clipboardText = await page.evaluate("navigator.clipboard.readText()");
  // const currentUrl = page.url();
  expect(clipboardText).toContain("/search?query=education+grants");
});
