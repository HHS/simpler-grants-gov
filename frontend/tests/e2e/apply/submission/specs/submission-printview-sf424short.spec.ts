/**
 * @feature Apply - Happy Path - SF-424 Short Application Submission and Print View Workflow
 * @scenario Complete the SF-424 Short Application Submission and Print View workflow for an
 * Organization user
 *
 * NOTE: unlike the SF-424 (long) spec, this only covers the Organization applicant scenario.
 * The form is titled "...Short Organizational (SF-424)" and organization_name is
 * unconditionally required by the schema, even though applicant_type_code's enum still lists
 * "P: Individual" as an option. TODO: confirm with product/eng whether this form is ever
 * actually reachable via an Individual-applicant opportunity flow - if so, add an Individual
 * scenario back in, mirroring the SF-424 (long) spec's applicantScenarios loop.
 */

import {
  expect,
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
  navigateToPrintView,
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
const OPPORTUNITY_NUMBER = "E2E-SF424SHORT-ORG-IND-01";

const opportunityConfig = loadOpportunityConfig(OPPORTUNITY_NUMBER);

// Skip non-Chrome browsers in staging to avoid MFA OTP rate-limiting.
test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

test(
  "Complete the SF-424 Short Application Submission and Print View workflow for an Organization user",
  { tag: [SMOKE, GRANTEE, APPLY, APPLY_FORMS, CORE_REGRESSION] },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo,
  ) => {
    // --- Login ---
    // Given the user is logged in
    const viewportSize = page.viewportSize();
    const isMobile = viewportSize ? viewportSize.width < 1024 : false;
    await authenticateE2eUser(page, context, isMobile);

    // --- Navigate to Opportunity page and start a new application ---
    // And the user launches the URL for an opportunity with an open SF-424 Short competition
    // When the user clicks "Start Application", selects applicant type and creates the application
    await createApplication(
      page,
      opportunityConfig.opportunityUrl,
      testOrgLabel,
    );
    const applicationUrl = page.url();

    // --- Fill required forms and collect print URLs ---
    // For each form on this opportunity: fill it, verify status, then capture the
    // form URL *before* verifyFormStatusOnApplication navigates away to the app page.
    const filledForms: FilledFormEntry[] = [];
    const baseSuffix = Date.now();

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
    // aor_signature and authorized_representative_date_signed are system post-populated at
    // submission time (gg_post_population rules: "signature", "current_date") - same pattern
    // as SF-424B's signature/date_signed check.
    for (const { printUrl } of filledForms) {
      await navigateToPrintView(page, printUrl);

      await expect(page.getByTestId("signature")).toBeVisible();
      await expect(page.getByTestId("signature")).not.toBeEmpty();

      await expect(page.getByTestId("date_signed")).toBeVisible();
      await expect(page.getByTestId("date_signed")).not.toBeEmpty();
    }
  },
);
