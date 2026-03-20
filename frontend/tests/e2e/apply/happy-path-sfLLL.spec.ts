import { test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import { fillForm } from "tests/e2e/utils/forms/general-forms-filling";
import { verifyFormStatusAfterSave } from "tests/e2e/utils/forms/verify-form-status-utils";

import { SFLLL_TEST_DATA } from "./fixtures/sfLLL-field-definitions";
import { SFLLL_FORM_CONFIG } from "./fixtures/sfLLL-fill-data";

const { testOrgLabel, opportunityId, targetEnv, baseUrl } = playwrightEnv;

const OPPORTUNITY_URL = `/opportunity/${opportunityId}`;

// Skip non-Chrome browsers in staging
test.beforeEach(({ page: _ }, testInfo) => {
  if (targetEnv === "staging") {
    test.skip(
      testInfo.project.name !== "Chrome",
      "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
    );
  }
});

test.describe("Application form completion happy path - SFLLL", () => {
  // Skip non-Chrome browsers in staging
  test.beforeEach(({ page: _ }, testInfo) => {
    if (targetEnv === "staging") {
      test.skip(
        testInfo.project.name !== "Chrome",
        "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
      );
    }
  });
  test("Completes and saves form without errors", async ({
    page,
    context,
  }, testInfo) => {
    test.setTimeout(300_000); // 5 min timeout

    const isMobile = testInfo.project.name.match(/[Mm]obile/);

    await authenticateE2eUser(page, context, !!isMobile);
    await page.goto(`${baseUrl}${OPPORTUNITY_URL}`, {
      waitUntil: "load",
      timeout: 30000,
    });

    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);

    await fillForm(testInfo, page, SFLLL_FORM_CONFIG, SFLLL_TEST_DATA, false);

    await page.waitForTimeout(5000);

    // Verify form status after save
    await verifyFormStatusAfterSave(page, "complete");
  });
});
