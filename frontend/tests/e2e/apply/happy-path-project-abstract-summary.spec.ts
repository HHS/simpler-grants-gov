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

import { PROJECT_ABSTRACT_SUMMARY_FORM_CONFIG } from "./fixtures/project-abstract-summary-field-definitions";
import { projectAbstractSummaryHappyPathTestData } from "./fixtures/project-abstract-summary-fill-data";

const { testOrgLabel } = playwrightEnv;
const OPPORTUNITY_ID = "39cf0a5c-5fed-40b4-8f46-5374101ae419";
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;

test("Application form completion happy path - Project Abstract Summary", async ({
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
    PROJECT_ABSTRACT_SUMMARY_FORM_CONFIG,
    projectAbstractSummaryHappyPathTestData,
    false,
  );

  await page.waitForTimeout(2000);

  // Verify form status after save
  await verifyFormStatusAfterSave(page, "complete");
});
