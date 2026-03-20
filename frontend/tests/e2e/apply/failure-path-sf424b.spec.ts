import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import { openForm } from "tests/e2e/utils/forms/form-navigation-utils";
import { saveForm } from "tests/e2e/utils/forms/save-form-utils";
import {
  verifyFormStatusAfterSave,
  verifyFormStatusOnApplication,
} from "tests/e2e/utils/forms/verify-form-status-utils";

import {
  SF424B_FORM_MATCHER,
  SF424B_REQUIRED_FIELD_ERRORS,
} from "./fixtures/sf424b-field-definitions";

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

test("SF-424B error validation - required fields and inline errors", async ({
  page,
  context,
}: { page: Page; context: BrowserContext }, testInfo: TestInfo) => {
  test.setTimeout(300_000); // 5 min timeout

  const isMobile = testInfo.project.name.match(/[Mm]obile/);

  await authenticateE2eUser(page, context, !!isMobile);

  await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
  const applicationUrl = page.url();

  const openedSf424bForValidation = await openForm(page, SF424B_FORM_MATCHER);
  if (!openedSf424bForValidation) {
    throw new Error(
      "Could not find or open SF-424B form link on the application forms page",
    );
  }

  // Do not enter anything and click save
  await saveForm(page, true); // expect validation errors

  // Checks error alert list at top of form page and inline field errors
  await verifyFormStatusAfterSave(
    page,
    "incomplete",
    SF424B_REQUIRED_FIELD_ERRORS,
  );

  // On application page — verify form row shows "Some issues found"
  await verifyFormStatusOnApplication(
    page,
    "incomplete",
    "SF-424B",
    applicationUrl,
  );
});
