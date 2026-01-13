import { test } from "@playwright/test";
import { baseURL, targetEnv } from "tests/playwright.config";

import { performSignIn } from "./playwrightUtils";

test.afterEach(async ({ context }) => {
  await context.close();
});

test("signs in successfully", async ({ page }, { project }) => {
  // due to issues mentioned in https://github.com/HHS/simpler-grants-gov/issues/3459#issuecomment-2837138259
  // we are not running tests that require actual login in local CI environments
  // this test should still run when targeting actual local or deployed environments
  if (targetEnv === "local-ci") {
    test.skip();
  }
  await page.goto(baseURL);
  await performSignIn(page, project);
});
