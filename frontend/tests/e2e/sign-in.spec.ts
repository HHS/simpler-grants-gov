/* eslint-disable testing-library/prefer-screen-queries */
import { test } from "@playwright/test";

import { performSignIn } from "./playwrightUtils";

test.afterEach(async ({ context }) => {
  await context.close();
});

test("signs in successfully", async ({ page }, { project }) => {
  await page.goto("http://localhost:3000/?_ff=authOn:true");
  await performSignIn(page, project);
});
