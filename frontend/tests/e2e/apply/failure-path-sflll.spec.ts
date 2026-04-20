import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
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
  SFLLL_FORM_MATCHER,
  SFLLL_REQUIRED_FIELD_ERRORS,
} from "./fixtures/sfLLL-field-definitions";

const { APPLY, CORE_REGRESSION } = VALID_TAGS;
const { testOrgLabel, targetEnv } = playwrightEnv;

// Environment-specific opportunity IDs
// Staging: 39cf0a5c-5fed-40b4-8f46-5374101ae419
// Local:   c3c59562-a54f-4203-b0f6-98f2f0383481
const OPPORTUNITY_ID =
  targetEnv === "staging"
    ? "39cf0a5c-5fed-40b4-8f46-5374101ae419"
    : "c3c59562-a54f-4203-b0f6-98f2f0383481";
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

test(
  "SF-LLL - error validation on empty save",
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

    const opened = await openForm(page, SFLLL_FORM_MATCHER);
    if (!opened) {
      throw new Error(
        "Could not find or open SF-LLL form link on the application forms page",
      );
    }

    // Save without filling required fields
    await saveForm(page, true); // expect validation errors

    // Checks error alert list at top of form page and inline field errors
    await verifyFormStatusAfterSave(
      page,
      "incomplete",
      SFLLL_REQUIRED_FIELD_ERRORS,
    );

    // Return to application and verify form row shows "Some issues found"
    await verifyFormStatusOnApplication(
      page,
      "incomplete",
      SFLLL_FORM_MATCHER,
      applicationUrl,
    );
  },
);
