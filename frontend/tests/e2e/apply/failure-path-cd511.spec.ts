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
import { openForm } from "tests/e2e/utils/forms/form-navigation-utils";
import { saveForm } from "tests/e2e/utils/forms/save-form-utils";
import {
  verifyFormStatusAfterSave,
  verifyFormStatusOnApplication,
} from "tests/e2e/utils/forms/verify-form-status-utils";

import {
  CD511_FORM_MATCHER,
  CD511_REQUIRED_FIELD_ERRORS,
} from "./fixtures/cd511-field-definitions";

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
  "CD511 error validation - required fields and inline errors",
  { tag: [APPLY, CORE_REGRESSION] },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo,
  ) => {
    test.setTimeout(300_000); // 5 min timeout

    const isMobile = testInfo.project.name.match(/[Mm]obile/);

    await authenticateE2eUser(page, context, !!isMobile);

    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
    const applicationUrl = page.url();

    const opened = await openForm(page, CD511_FORM_MATCHER);
    if (!opened) {
      throw new Error(
        "Could not find or open CD511 form link on the application forms page",
      );
    }

    // Do not enter anything and click save - expect validation errors
    await saveForm(page, true);

    // Checks error alert list at top of form page and inline field errors
    await verifyFormStatusAfterSave(
      page,
      "incomplete",
      CD511_REQUIRED_FIELD_ERRORS,
    );

    // Return to application and verify form row shows "Some issues found"
    await verifyFormStatusOnApplication(
      page,
      "incomplete",
      CD511_FORM_MATCHER,
      applicationUrl,
    );
  },
);
