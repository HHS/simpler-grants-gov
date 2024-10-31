import { expect, test } from "@playwright/test";

import { PageProps } from "../utils";

test.describe("Opportunity listing page", () => {
  test("displays all the expected sections", async ({ page }, { project }) => {
    await page.goto("/opportunity/1");
  });

  test("displays collapsed but expandable text for long description strings", async ({
    page,
  }, { project }) => {
    // need to make sure that opportunity loaded here is seeded with the proper data to create conditions for collapsing text
    // for now our seed will spit out long descriptions at 31 and 32, but that could change if the seed changes
    await page.goto("/opportunity/31");
  });
});
