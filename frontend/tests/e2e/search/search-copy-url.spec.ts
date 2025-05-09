import { expect, test } from "@playwright/test";
import { waitForURLContainsQueryParam } from "tests/e2e/playwrightUtils";

import {
  fillSearchInputAndSubmit,
  toggleMobileSearchFilters,
} from "./searchSpecUtil";

test("should copy search query URL to clipboard", async ({ page }, {
  project,
}) => {
  // navigator.clipboard only works in secure contexts (https) except, apparently in webkit
  // for now, we'll only run this test in webkit
  if (!project.name.match(/[Ww]ebkit/)) {
    return;
  }
  await page.goto("/search");

  // this is dumb but webkit has an issue with trying to fill in the input too quickly
  // if the expect in here fails, we give it another shot after 5 seconds
  // this way we avoid an arbitrary timeout, and do not slow down the other tests
  try {
    await fillSearchInputAndSubmit("education grants", page);
  } catch (e) {
    await fillSearchInputAndSubmit("education grants", page);
  }

  if (project.name.match(/[Mm]obile/)) {
    await toggleMobileSearchFilters(page);
  }

  const copyButton = page.getByText("Copy this search query");
  await copyButton.waitFor({ state: "visible", timeout: 5000 });
  await waitForURLContainsQueryParam(page, "query");

  await copyButton.click();

  const clipboardText = await page.evaluate("navigator.clipboard.readText()");
  expect(clipboardText).toContain("/search?query=education+grants");
});
