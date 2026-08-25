/**
 * @feature Apply - Happy Path - SF-LLL Disclosure of Lobbying Activities and Print View Workflow
 * @scenario Complete the SF-LLL Disclosure of Lobbying Activities and Print View workflow for an <user type> user
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import { fillForm } from "tests/e2e/utils/forms/general-forms-filling";
import {
  verifyFormStatusAfterSave,
  verifyFormStatusOnApplication,
} from "tests/e2e/utils/forms/verify-form-status-utils";
import { loadOpportunityConfig } from "tests/e2e/utils/submission/load-opportunity-config";
import type { FilledFormEntry } from "tests/e2e/utils/submission/opportunity-print-view.types";
import {
  buildHappyPathTestData,
  buildPrintUrl,
  validateAllPrintViews,
} from "tests/e2e/utils/submission/print-view-utils";
import {
  submitApplicationAndVerify,
  verifySubmissionConfirmation,
} from "tests/e2e/utils/submission/submit-application-utils";

const { APPLY, APPLY_FORMS, CORE_REGRESSION, SMOKE, GRANTEE } = VALID_TAGS;

const { testOrgLabel } = playwrightEnv;

// Only the opportunity number is declared here.
// All opportunity/form details are resolved from the per-form data files via load-opportunity-config.ts.
// Unified opportunity for both local and staging environments.
const OPPORTUNITY_NUMBER = "E2E-SFLLL-ORG-IND-01";
const opportunityConfig = loadOpportunityConfig(OPPORTUNITY_NUMBER);

const applicantScenarios = [
  {
    testName: `Complete the SF-LLL Disclosure of Lobbying Activities and Print View workflow for an Organization user`,
    orgLabel: testOrgLabel,
  },
  {
    testName: `Complete the SF-LLL Disclosure of Lobbying Activities and Print View workflow for an Individual user`,
    orgLabel: undefined,
  },
] as const;

// Skip non-Chrome browsers in staging to avoid MFA OTP rate-limiting.
test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

for (const { testName, orgLabel } of applicantScenarios) {
  test(
    testName,
    { tag: [SMOKE, GRANTEE, APPLY, APPLY_FORMS, CORE_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000); // 5-min timeout

      const isMobile = testInfo.project.name.match(/[Mm]obile/);
      const baseSuffix = Date.now();

      // --- Login ---
      // Given the user is logged in
      await authenticateE2eUser(page, context, !!isMobile);

      // --- Navigate to Opportunity page and start a new application ---
      // And the user launches the URL for an opportunity with an open SF-LLL competition
      // When the user clicks "Start Application", selects applicant type and creates the application
      await createApplication(page, opportunityConfig.opportunityUrl, orgLabel);
      const applicationUrl = page.url();

      // --- Fill required forms and collect print URLs ---
      // For each form on this opportunity: fill it, verify status, then capture the
      // form URL *before* verifyFormStatusOnApplication navigates away to the app page.
      const filledForms: FilledFormEntry[] = [];

      for (const [index, form] of opportunityConfig.forms.entries()) {
        const testData = buildHappyPathTestData(form, baseSuffix + index);

        await fillForm(testInfo, page, form.formConfig, testData, false);

        // Verify save succeeded while still on the form page
        await verifyFormStatusAfterSave(page, "complete");

        // Capture the form URL now - verifyFormStatusOnApplication navigates away
        const formUrl = page.url();

        await verifyFormStatusOnApplication(
          page,
          "complete",
          form.formConfig.formName,
          applicationUrl,
        );

        filledForms.push({
          formKey: form.formKey,
          formName: form.formConfig.formName,
          testData,
          printUrl: buildPrintUrl(formUrl),
          expectedPrepopulatedFields: form.expectedPrepopulatedFields,
          userEnteredFieldTestIds: form.userEnteredFieldTestIds,
        });
      }

      // Return to application landing page before submitting
      await page.goto(applicationUrl);
      await page.waitForLoadState("domcontentloaded");

      // --- Submit Application ---
      // When the user clicks "Submit application"
      // Then the application is submitted successfully
      await submitApplicationAndVerify(page, "success");

      // --- Confirmation Page Validation ---
      await verifySubmissionConfirmation(page);

      // --- Print View Validation (one page per form) ---
      await validateAllPrintViews(page, filledForms);
    },
  );
}
