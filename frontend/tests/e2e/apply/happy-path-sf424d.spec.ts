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

import { SF424D_FORM_CONFIG } from "./fixtures/sf424d-field-definitions";
import { sf424DHappyPathTestData } from "./fixtures/sf424d-fill-data";

const { testOrgLabel } = playwrightEnv;
const OPPORTUNITY_ID = "c3c59562-a54f-4203-b0f6-98f2f0383481";
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;

test("Application form completion happy path - SF424D", async ({
  page,
  context,
}: { page: Page; context: BrowserContext }, testInfo: TestInfo) => {
  test.setTimeout(300_000); // 5 min timeout

  const isMobile = testInfo.project.name.match(/[Mm]obile/);

  await authenticateE2eUser(page, context, !!isMobile);

  // Call reusable create application function from utils
  await createApplication(page, OPPORTUNITY_URL, testOrgLabel);

  await fillForm(
    testInfo,
    page,
    SF424D_FORM_CONFIG,
    sf424DHappyPathTestData,
    false,
  );

  await page.waitForTimeout(2000);

  // Verify form status after save
  await verifyFormStatusAfterSave(page, "complete");
});
