/**
 * @feature Apply - Application Form Happy Path
 * @featureFile frontend/tests/e2e/apply/features/happy-path-forms.feature
 * @scenario Application form completion happy path - SF424B
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
  SF424B_FORM_CONFIG,
  SF424B_FORM_MATCHER,
} from "./fixtures/sf424b-field-definitions";
import { sf424BHappyPathTestData } from "./fixtures/sf424b-fill-data";

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
  "Application form completion happy path - SF424B",
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

    // And the Application landing page loads with the <form name> form link visible
    await verifyFormLinkVisible(page, SF424B_FORM_MATCHER);

    // When the user fills out the form with valid test data
    // And the user clicks Save
    await fillForm(
      testInfo,
      page,
      SF424B_FORM_CONFIG,
      sf424BHappyPathTestData(testOrgLabel),
      false,
    );
    await page.waitForTimeout(2000);

    /* Covers "Form status validation" flow in the feature file,
     * which includes verification of the status in form and application landing page after saving a completed form.
     */
    await verifyFormStatusAfterSave(page, "complete");
  },
);
