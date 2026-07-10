/**
 * @feature Apply - Happy Path – Application Submission Workflow
 * @featureFile e2e/apply/submission/features/happy-path-submission-required-conditional.feature
 * @scenario Complete the Application Submission workflow for an <user type> user, with required and conditional forms
 *
 * Examples:
 * | user type     |
 * | Organization  |
 * | Individual    |
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { SF424B_FORM_CONFIG } from "tests/e2e/apply/fixtures/sf424b-field-definitions";
import { sf424BHappyPathTestData } from "tests/e2e/apply/fixtures/sf424b-fill-data";
import { buildSFLLLHappyPathTestData } from "tests/e2e/apply/fixtures/sfLLL-data";
import { SFLLL_FORM_CONFIG } from "tests/e2e/apply/fixtures/sfLLL-field-definitions";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { fillForm } from "tests/e2e/utils/forms/general-forms-filling";
import { selectFormInclusionOption } from "tests/e2e/utils/forms/select-form-inclusion-utils";
import {
  verifyFormStatusAfterSave,
  verifyFormStatusOnApplication,
} from "tests/e2e/utils/forms/verify-form-status-utils";
import { submitApplicationAndVerify } from "tests/e2e/utils/submission/submit-application-utils";

const { APPLY, SMOKE, GRANTEE } = VALID_TAGS;

const { testOrgLabel, targetEnv } = playwrightEnv;
const OPPORTUNITY_ID = "f7a1c2b3-4d5e-6789-8abc-1234567890ab"; // TEST-APPLY-ORG-IND-ON01
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;

const applicantScenarios = [
  {
    testName:
      "Complete the Application Submission workflow for an Organization user, with required and conditional forms",
    orgLabel: testOrgLabel,
  },
  {
    testName:
      "Complete the Application Submission workflow for an Individual user, with required and conditional forms",
    orgLabel: undefined,
  },
] as const;

// Skip non-Chrome browsers in staging
test.beforeEach(({ page: _ }, testInfo) => {
  if (targetEnv === "staging") {
    test.skip(
      testInfo.project.name !== "Chrome",
      "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
    );
  }
});

for (const { testName, orgLabel } of applicantScenarios) {
  test(
    testName,
    { tag: [SMOKE, GRANTEE, APPLY] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000); // 5 min timeout

      const isMobile = testInfo.project.name.match(/[Mm]obile/);

      // Given the user is logged in
      await authenticateE2eUser(page, context, !!isMobile);

      // Covers "Starting a new application" flow for both org and individual applicants.
      await createApplication(page, OPPORTUNITY_URL, orgLabel);
      const applicationUrl = page.url();

      // When the user clicks on SF424B form link
      // Then the form opens
      // And the user fills out the form with valid test data
      // And the user clicks Save
      await fillForm(
        testInfo,
        page,
        SF424B_FORM_CONFIG,
        sf424BHappyPathTestData(testOrgLabel),
        false,
      );

      // Verify save success alert on form page
      await verifyFormStatusAfterSave(page, "complete");

      // On application page - verify form row shows "No issues detected"
      await verifyFormStatusOnApplication(
        page,
        "complete",
        "SF-424B",
        applicationUrl,
      );

      // Extra wait for page to fully render forms table after navigation
      await page.waitForTimeout(10000);

      // Select 'Yes' for including SF-LLL form in submission
      await selectFormInclusionOption(
        page,
        "Disclosure of Lobbying Activities (SF-LLL)",
        "Yes",
      );

      // When the user clicks on SF-LLL form link
      // Then the form opens
      // And the user fills out the form with valid test data
      // And the user clicks Save
      await fillForm(
        testInfo,
        page,
        SFLLL_FORM_CONFIG,
        buildSFLLLHappyPathTestData(Date.now()),
        false,
      );

      // Verify SF-LLL save success alert on form page
      await verifyFormStatusAfterSave(page, "complete");

      // On application page - verify SF-LLL row shows "No issues detected"
      await verifyFormStatusOnApplication(
        page,
        "complete",
        "SF-LLL",
        applicationUrl,
      );

      // Submit the application and verify success
      await submitApplicationAndVerify(page, "success");
    },
  );
}
