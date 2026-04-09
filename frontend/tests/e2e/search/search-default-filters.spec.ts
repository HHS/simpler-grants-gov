import { expect, test } from "@playwright/test";
import { VALID_TAGS } from "tests/e2e/tags";

import { expectCheckboxIDIsChecked } from "./searchSpecUtil";

const { GRANTEE, OPPORTUNITY_SEARCH, SMOKE } = VALID_TAGS;

test(
  "should load search page with forecasted and open filters checked by default",
  { tag: [GRANTEE, OPPORTUNITY_SEARCH, SMOKE] },
  async ({ page }) => {
    await page.goto("/search");

    // Verify the presence of "Search" content on the page
    await expect(page.locator("h1")).toContainText(
      "Search funding opportunities",
    );

    // Verify that the 'forecasted' and 'posted' are checked
    await expectCheckboxIDIsChecked(page, "status-forecasted");
    await expectCheckboxIDIsChecked(page, "status-open");
  },
);
