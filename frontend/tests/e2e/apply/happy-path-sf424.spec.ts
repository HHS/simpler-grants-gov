import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { getOpportunityId } from "tests/e2e/get-opportunityId-utils";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import { fillForm } from "tests/e2e/utils/forms/general-forms-filling";
import { verifyFormStatusAfterSave } from "tests/e2e/utils/forms/verify-form-status-utils";

import { SF424_FORM_CONFIG } from "./fixtures/sf424-field-definitions";
import { sf424HappyPathTestData } from "./fixtures/sf424-fill-data";

const { APPLY, CORE_REGRESSION } = VALID_TAGS;

const { testOrgLabel, targetEnv } = playwrightEnv;

const OPPORTUNITY_URL = `/opportunity/${getOpportunityId()}`;

// Skip non-Chrome browsers in staging
test.beforeEach(({ page: _ }, testInfo) => {
  if (targetEnv === "staging") {
    test.skip(
      testInfo.project.name !== "Chrome",
      "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
    );
  }
});

test(
  "Application form completion happy path - SF424",
  { tag: [APPLY, CORE_REGRESSION] },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo,
  ) => {
    test.setTimeout(300_000); // 5 min timeout

    const isMobile = testInfo.project.name.match(/[Mm]obile/);

    await authenticateE2eUser(page, context, !!isMobile);

    // Call reusable create application function from utils
    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);

    await fillForm(
      testInfo,
      page,
      SF424_FORM_CONFIG,
      sf424HappyPathTestData,
      false,
    );

    await page.waitForTimeout(2000);

    // Verify form status after save
    await verifyFormStatusAfterSave(page, "complete");
  },
);
