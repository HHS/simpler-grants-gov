/**
 * @feature Apply - Application Form Failure Path
 * @featureFile tests/e2e/apply/forms/failure-path/features/negative-path-forms.feature
 * @scenario Application form completion failure path - other-narrative-attachment
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  OTHER_NARRATIVE_ATTACHMENT_FORM_MATCHER,
  OTHER_NARRATIVE_ATTACHMENT_REQUIRED_FIELD_ERRORS,
} from "tests/e2e/apply/fixtures/other-narrative-attachment-field-definitions";
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

// Environment-specific opportunity IDs
// Staging: 39df8091-6e99-4b0f-9db7-1f3aca9cb6e5
// Local:   c3c59562-a54f-4203-b0f6-98f2f0383481
const OPPORTUNITY_ID =
  targetEnv === "staging"
    ? "39df8091-6e99-4b0f-9db7-1f3aca9cb6e5"
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
  "Other Narrative Attachments - error validation on empty save",
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

    // And the Application landing page loads with the "Other Narrative Attachments" form link visible
    // And the user clicks on a form link
    // Then the form opens
    const opened = await openForm(
      page,
      OTHER_NARRATIVE_ATTACHMENT_FORM_MATCHER,
    );
    if (!opened) {
      throw new Error(
        "Could not find or open Other Narrative Attachments link on the application forms page",
      );
    }

    // When the user attempts to save with no file uploaded for required attachment fields
    await saveForm(page, true); // expect validation errors

    // Then required field validation errors are shown on the form
    await verifyFormStatusAfterSave(
      page,
      "incomplete",
      OTHER_NARRATIVE_ATTACHMENT_REQUIRED_FIELD_ERRORS,
    );

    // When the user navigates back to the application landing page
    // Then under the "Other Narrative Attachments" form the status shows "Some issues found. Check your entries."
    await verifyFormStatusOnApplication(
      page,
      "incomplete",
      OTHER_NARRATIVE_ATTACHMENT_FORM_MATCHER,
      applicationUrl,
    );
  },
);
