/**
 * @feature Apply - Application Form Happy Path
 * @featureFile frontend/tests/e2e/apply/features/happy-path-forms.feature
 * @scenario Application form completion happy path - SFLLL
 */
import { test } from "@playwright/test";
import { getOpportunityId } from "tests/e2e/get-opportunityId-utils";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import { fillForm } from "tests/e2e/utils/forms/general-forms-filling";
import { verifyFormStatusAfterSave } from "tests/e2e/utils/forms/verify-form-status-utils";

import { SFLLL_TEST_DATA } from "./fixtures/sfLLL-field-definitions";
import { SFLLL_FORM_CONFIG } from "./fixtures/sfLLL-fill-data";

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

test.describe("Application form completion happy path - SFLLL", () => {
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
    "Completes and saves form without errors",
    { tag: [APPLY, CORE_REGRESSION] },
    async ({ page, context }, testInfo) => {
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

      // When the user clicks on a form link
      // Then the form opens
      // And the user fills out the form with valid test data
      // And the user clicks Save
      await fillForm(testInfo, page, SFLLL_FORM_CONFIG, SFLLL_TEST_DATA, false);

      await page.waitForTimeout(5000);

      /* Covers "Form status validation" flow in the feature file,
       * which includes verification of the status in form and application landing page after saving a completed form.
       */
      await verifyFormStatusAfterSave(page, "complete");
    },
  );
});
