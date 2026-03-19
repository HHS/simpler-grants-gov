import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import { fillForm } from "tests/e2e/utils/forms/general-forms-filling";
import { verifyFormStatusAfterSave } from "tests/e2e/utils/forms/verify-form-status-utils";

import { SF424B_FORM_CONFIG } from "./fixtures/sf424b-field-definitions";
import { sf424BHappyPathTestData } from "./fixtures/sf424b-fill-data";

const { testOrgLabel, targetEnv } = playwrightEnv;
const OPPORTUNITY_ID = "f7a1c2b3-4d5e-6789-8abc-1234567890ab"; // TEST-APPLY-ORG-IND-ON01
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;

// Skip non-Chrome browsers in staging
test.beforeEach(({ page: _ }, testInfo) => {
  if (targetEnv === "staging") {
    test.skip(
      testInfo.project.name !== "Chrome",
      "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
    );
  }
});

test("Application form completion happy path - SF424B", async ({
  page,
  context,
}: { page: Page; context: BrowserContext }, testInfo: TestInfo) => {
  test.setTimeout(300_000); // 5 min timeout

  const isMobile = testInfo.project.name.match(/[Mm]obile/);

  await authenticateE2eUser(page, context, !!isMobile);

  // Call reusable create application function from utils
  await createApplication(page, OPPORTUNITY_URL, testOrgLabel);

  // Wait for the first form field to be visible before proceeding
  await page.getByTestId("title").waitFor({ state: "visible", timeout: 30000 });

  await fillForm(
    testInfo,
    page,
    SF424B_FORM_CONFIG,
    sf424BHappyPathTestData(testOrgLabel),
    false,
  );

  await page.waitForTimeout(2000);

  // Verify form status after save
  await verifyFormStatusAfterSave(page, "complete");
});
