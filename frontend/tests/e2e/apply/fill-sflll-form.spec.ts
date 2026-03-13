import { test } from "@playwright/test";
import { SFLLL_TEST_DATA } from "tests/e2e/apply/fixtures/test-data-for-sflll-forms.fixture";
import { SFLLL_FORM_CONFIG } from "tests/e2e/apply/page-objects/sflll-form.page";
import playwrightEnv from "tests/e2e/playwright-env";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import { fillForm } from "tests/e2e/utils/forms/general-forms-filling";
import { verifyFormStatusAfterSave } from "tests/e2e/utils/forms/verify-form-status-utils";

const { baseUrl, testOrgLabel, opportunityId } = playwrightEnv;
const OPPORTUNITY_URL = `/opportunity/${opportunityId}`;

test("Application form completion happy path - SFLLL", async ({
  page,
  context,
}, testInfo) => {
  test.setTimeout(300_000); // 5 min timeout

  const isMobile = testInfo.project.name.match(/[Mm]obile/);

  await authenticateE2eUser(page, context, !!isMobile);

  await createApplication(page, OPPORTUNITY_URL, testOrgLabel);

  await fillForm(testInfo, page, SFLLL_FORM_CONFIG, SFLLL_TEST_DATA, false);

  // Verify form status after save
  await verifyFormStatusAfterSave(page, "complete");
});
