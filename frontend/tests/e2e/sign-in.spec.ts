import { test } from "@playwright/test";

import { performSignIn } from "./playwrightUtils";

// reenable after https://github.com/HHS/simpler-grants-gov/issues/3791
test.skip("signs in successfully", async ({ page }, { project }) => {
  await page.goto("http://localhost:3000/?_ff=authOn:true");
  await performSignIn(page, project);
});
