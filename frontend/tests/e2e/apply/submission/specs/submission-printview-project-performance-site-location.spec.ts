/**
 * @feature Apply - Happy Path - PROJECT/PERFORMANCE SITE LOCATION(S) Submission and Print View Workflow
 * @scenario Complete the PROJECT/PERFORMANCE SITE LOCATION(S) Submission and Print View workflow for an <user type> user
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
import {
  skipNonChromeOnStaging,
  skipWebkitSubmissionSpecsLocal,
} from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
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
  navigateToPrintView,
  validateAllPrintViews,
  validateAttachmentPrintViewSection,
} from "tests/e2e/utils/submission/print-view-utils";
import {
  submitApplicationAndVerify,
  verifySubmissionConfirmation,
} from "tests/e2e/utils/submission/submit-application-utils";

const { APPLY, APPLY_FORMS, CORE_REGRESSION, SMOKE, GRANTEE } = VALID_TAGS;

const { testOrgLabel } = playwrightEnv;

const OPPORTUNITY_NUMBER = "E2E-PPSL-ORG-IND-01";
const opportunityConfig = loadOpportunityConfig(OPPORTUNITY_NUMBER);

const applicantScenarios = [
  {
    testName: `Complete the PROJECT/PERFORMANCE SITE LOCATION(S) Submission and Print View workflow for an Organization user`,
    orgLabel: testOrgLabel,
  },
  {
    testName: `Complete the PROJECT/PERFORMANCE SITE LOCATION(S) Submission and Print View workflow for an Individual user`,
    orgLabel: undefined,
  },
] as const;

test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
  skipWebkitSubmissionSpecsLocal(testInfo);
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

      const isMobile = testInfo.project.use.isMobile ?? false;
      const baseSuffix = Date.now();

      // --- Login ---
      // Given the user is logged in
      await authenticateE2eUser(page, context, isMobile);

      // --- Navigate to Opportunity page and start a new application ---
      // And the user launches the URL for an opportunity with an open PPSL competition
      // When the user clicks "Start Application", selects applicant type and creates the application
      await createApplication(page, opportunityConfig.opportunityUrl, orgLabel);
      const applicationUrl = page.url();

      // --- Fill required forms and collect print URLs ---
      // This opportunity contains a single form (PROJECT/PERFORMANCE SITE LOCATION(S)).
      // The loop follows the shared pattern across all print view specs
      // to maintain consistency, even though only one iteration is expected here.
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

      // --- Optional Attachment Validation ---
      for (const { testData, printUrl } of filledForms) {
        if (testData["additional_locations_attachment"]) {
          await navigateToPrintView(page, printUrl);
          await validateAttachmentPrintViewSection(
            page,
            "form-section-additional_locations_attachment",
            testData["additional_locations_attachment"],
          );
        }
      }
    },
  );
}
