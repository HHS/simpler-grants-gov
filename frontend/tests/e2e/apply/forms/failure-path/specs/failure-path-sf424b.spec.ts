/**
 * @feature Apply - Application Form Failure Path
 * @featureFile tests/e2e/apply/forms/failure-path/features/failure-path-forms.feature
 * @scenario Application form completion failure path - sf424b
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  SF424B_FORM_MATCHER,
  SF424B_REQUIRED_FIELD_ERRORS,
} from "tests/e2e/apply/fixtures/sf424b-field-definitions";
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

const { APPLY, CORE_REGRESSION } = VALID_TAGS;

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

test(
  "SF-424B error validation - required fields and inline errors",
  { tag: [APPLY, CORE_REGRESSION] },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo,
  ) => {
    test.setTimeout(300_000); // 5 min timeout

    const isMobile = testInfo.project.name.match(/[Mm]obile/);

    // Given the user is logged in
    await authenticateE2eUser(page, context, !!isMobile);

    // And the user launches the URL for an opportunity with an open competition
    // When the user clicks "Start Application" in the opportunity page
    // Then the "Start a new application" modal opens
    // When the user selects the test organization in the "Who's applying" dropdown
    // And the user enters the application name
    // And the user clicks "Create Application"
    // Then a new application is created
    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
    const applicationUrl = page.url();

    // And the Application landing page loads with the "SF-424B" form link visible
    // And the user clicks on a form link
    // Then the form opens
    const opened = await openForm(page, SF424B_FORM_MATCHER);
    if (!opened) {
      throw new Error(
        "Could not find or open SF-424B form link on the application forms page",
      );
    }

    // When the user attempts to save with required fields left empty
    await saveForm(page, true); // expect validation errors

    // Then required field validation errors are shown on the form
    await verifyFormStatusAfterSave(
      page,
      "incomplete",
      SF424B_REQUIRED_FIELD_ERRORS,
    );

    // When the user navigates back to the application landing page
    // Then under the "SF-424B" form the status shows "Some issues found. Check your entries."
    await verifyFormStatusOnApplication(
      page,
      "incomplete",
      SF424B_FORM_MATCHER,
      applicationUrl,
    );
  },
);
