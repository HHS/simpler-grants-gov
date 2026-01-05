import { test } from "@playwright/test";
import { baseURL } from "tests/playwright.config";

import { performSignIn } from "./playwrightUtils";

test.afterEach(async ({ context }) => {
  await context.close();
});

// reenable after https://github.com/HHS/simpler-grants-gov/issues/3791
test("signs in successfully", async ({ page }, { project }) => {
  await page.goto(baseURL);
  await performSignIn(page, project);
});
