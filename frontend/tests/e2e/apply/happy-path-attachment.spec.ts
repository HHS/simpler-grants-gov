/**
 * @feature Apply - Application Form Happy Path
 * @featureFile frontend/tests/e2e/apply/features/happy-path-forms.feature
 * @scenario Application form completion happy path - Attachment
 */
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
import {
  fillForm,
  verifyFormLinkVisible,
} from "tests/e2e/utils/forms/general-forms-filling";
import { verifyFormStatusAfterSave } from "tests/e2e/utils/forms/verify-form-status-utils";

import {
  ATTACHMENT_FORM_CONFIG,
  ATTACHMENT_FORM_MATCHER,
} from "./fixtures/attachment-field-definitions";
import { attachmentHappyPathTestData } from "./fixtures/attachment-fill-data";

const { APPLY, CORE_REGRESSION } = VALID_TAGS;
const { testOrgLabel, targetEnv } = playwrightEnv;

// Environment-specific opportunity IDs
// Staging: ecd28401-ba6a-4ce7-928f-0f9fc77c5702
// Local:   c3c59562-a54f-4203-b0f6-98f2f0383481
const OPPORTUNITY_ID =
  targetEnv === "staging"
    ? "ecd28401-ba6a-4ce7-928f-0f9fc77c5702"
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
  "Application form completion happy path - Attachment Form",
  { tag: [APPLY, CORE_REGRESSION] },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo,
  ) => {
    test.setTimeout(300_000); // 5 min timeout

    const isMobile = testInfo.project.name.match(/[Mm]obile/);

    // Given the user is logged in
    await authenticateE2eUser(page, context, !!isMobile);

    // Call reusable create application function from utils
    /**
     * Covers "Starting a new application" flow in the feature file
     * (includes modal interaction, organization selection, and application creation)
     */
    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);

    // Verify the Attachment Form link is visible on the application page
    await verifyFormLinkVisible(page, ATTACHMENT_FORM_MATCHER);

    // When the user fills out the form with valid test data
    // And the user clicks Save
    await fillForm(
      testInfo,
      page,
      ATTACHMENT_FORM_CONFIG,
      attachmentHappyPathTestData,
      false,
    );

    await page.waitForTimeout(2000);

    /* Covers "Form status validation" flow in the feature file,
     * which includes verification of the status in form and application landing page after saving a completed form.
     */
    await verifyFormStatusAfterSave(page, "complete");
  },
);
