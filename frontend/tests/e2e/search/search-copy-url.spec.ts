import { expect, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { waitForURLContainsQueryParam } from "tests/e2e/playwrightUtils";

import { fillSearchInputAndSubmit } from "./searchSpecUtil";

const { baseUrl } = playwrightEnv;

test("should copy search query URL to clipboard", async ({ page }, {
  project,
}) => {
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
  try {
    await fillSearchInputAndSubmit("education grants", page);
  } catch (e) {
    await fillSearchInputAndSubmit("education grants", page);
  }

  const copyButton = page.getByText("Copy this search query");
  await copyButton.waitFor({ state: "visible", timeout: 5000 });
  await waitForURLContainsQueryParam(page, "query");

  await copyButton.click();

  // const clipboardText = await page.evaluate("navigator.clipboard.readText()");
  // expect(clipboardText).toContain("/search?query=education+grants");

  const searchInput = page.locator("#query");
  await searchInput.fill("");
  await searchInput.press("ControlOrMeta+V");

  await expect(searchInput).toHaveValue(
    `${baseUrl}/search?query=education+grants`,
  );
});
