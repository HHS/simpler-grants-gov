import { expect, test } from "@playwright/test";
import { SFLLL_TEST_DATA } from "tests/e2e/apply/fixtures/test-data-for-sflll-forms.fixture";
import { SFLLL_FORM_CONFIG } from "tests/e2e/apply/page-objects/sflll-form.page";
import playwrightEnv from "tests/e2e/playwright-env";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import { fillForm } from "tests/e2e/utils/forms/general-forms-filling";

const { baseUrl, testOrgLabel, opportunityId, targetEnv } = playwrightEnv;
const OPPORTUNITY_URL = `/opportunity/${opportunityId}`;

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

    await expect(page.getByText(SFLLL_FORM_CONFIG.noErrorsText)).toBeVisible({
      timeout: 15000,
    });
  });
});
