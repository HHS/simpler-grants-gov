/**
 * @feature Apply - Happy Path - SF-424 Short Application Submission and Print View Workflow
 * @scenario Complete the SF-424 Short Application Submission and Print View workflow for an <user type> user
 *
 * Tests both Organization and Individual applicant scenarios, mirroring the SF-424 (long) spec pattern.
 * The form is titled "...Short Organizational (SF-424)" in the schema, but both applicant types can
 * access it. Runs once for the hand-written form and once for the one generated from forms/specs.
 */

import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { SF424_SHORT_OPPORTUNITIES } from "tests/e2e/apply/fixtures/sf424short-data";
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
  assertPrintViewIsReadOnly,
  buildHappyPathTestData,
  buildPrintUrl,
  navigateToPrintView,
  validateAllPrintViews,
} from "tests/e2e/utils/submission/print-view-utils";
import {
  submitApplicationAndVerify,
  verifySubmissionConfirmation,
} from "tests/e2e/utils/submission/submit-application-utils";

const { APPLY_FORMS, FULL_REGRESSION } = VALID_TAGS;

const { testOrgLabel } = playwrightEnv;

// All opportunity/form details are resolved from the per-form data files via load-opportunity-config.ts.
const applicantScenarios = SF424_SHORT_OPPORTUNITIES.flatMap(
  ({ formLabel, opportunityNumber, postPopulatedTestIds }) => {
    const opportunityConfig = loadOpportunityConfig(opportunityNumber);
    return [
      {
        testName: `Complete the ${formLabel} Application Submission and Print View workflow for an Organization user`,
        orgLabel: testOrgLabel,
        opportunityConfig,
        postPopulatedTestIds,
      },
      {
        testName: `Complete the ${formLabel} Application Submission and Print View workflow for an Individual user`,
        orgLabel: undefined,
        opportunityConfig,
        postPopulatedTestIds,
      },
    ];
  },
);

// Skip non-Chrome browsers in staging to avoid MFA OTP rate-limiting.
test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

for (const {
  testName,
  orgLabel,
  opportunityConfig,
  postPopulatedTestIds,
} of applicantScenarios) {
  test(
    testName,
    { tag: [APPLY_FORMS, FULL_REGRESSION] },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000); // 5-min timeout

      const isMobile = testInfo.project.name.match(/[Mm]obile/);
      const baseSuffix = Date.now();

      // --- Login ---
      // Given the user is logged in
      const viewportSize = page.viewportSize();
      const isMobileViewport = viewportSize ? viewportSize.width < 1024 : false;
      await authenticateE2eUser(page, context, isMobileViewport || !!isMobile);

      // --- Navigate to Opportunity page and start a new application ---
      // And the user launches the URL for an opportunity with an open SF-424 Short competition
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
      // NOTE: no attachment-specific print view block here - unlike SF-424 (long), the Short
      // form has no attachment fields (areas_affected, additional_project_title,
      // additional_congressional_districts, debt_explanation all live only on the long form).
      await validateAllPrintViews(page, filledForms);

      // --- Post-Population Field Validation ---
      // The signature and date signed are system post-populated at submission time
      // (gg_post_population rules: "signature", "current_date")
      // First verify the print view is read-only (no editable controls), then check values exist.
      for (const { printUrl } of filledForms) {
        await navigateToPrintView(page, printUrl);

        // Verify print view is read-only before checking field values
        await assertPrintViewIsReadOnly(page);

        // Now verify the post-populated field values exist and are populated
        for (const testId of postPopulatedTestIds) {
          await expect(page.getByTestId(testId)).toBeVisible();
          await expect(page.getByTestId(testId)).not.toBeEmpty();
        }
      }
    },
  );
}
