/**
 * @feature Apply - Happy Path - Application Submission and Print View Workflow for an Individual user
 * @scenario Complete the Application Submission and Print View workflow for an Individual user
 *
 * The form is for individual applicants, so it runs only as "As an individual (myself)".
 * Its seeded opportunity is open to organizations too, like every single-form E2E
 * opportunity.
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { SF424_INDIVIDUAL_GENERATED_OPPORTUNITY_DATA } from "tests/e2e/apply/fixtures/sf424-individual-data";
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

const { APPLY_FORMS, FULL_REGRESSION } = VALID_TAGS;

// Only the opportunity number is declared here.
// All opportunity/form details are resolved from form specific fixtures.
const OPPORTUNITY_NUMBER =
  SF424_INDIVIDUAL_GENERATED_OPPORTUNITY_DATA.opportunityNumber;
const opportunityConfig = loadOpportunityConfig(OPPORTUNITY_NUMBER);

// Skip non-Chrome browsers in staging to avoid MFA OTP rate-limiting.
test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

test(
  "Complete the SF-424 Individual (Generated) Form Submission and Print View workflow for an Individual user",
  { tag: [APPLY_FORMS, FULL_REGRESSION] },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo,
  ) => {
    test.setTimeout(300_000); // 5-min timeout

    const isMobile = testInfo.project.name.match(/[Mm]obile/);
    const baseSuffix = Date.now();

    // --- Login ---
    await authenticateE2eUser(page, context, !!isMobile);

    // --- Navigate to Opportunity page and start a new application ---
    await createApplication(page, opportunityConfig.opportunityUrl);
    const applicationUrl = page.url();

    // --- Fill required forms and collect print URLs ---
    const filledForms: FilledFormEntry[] = [];

    // --- Generate this form's happy-path test data ---
    for (const [index, form] of opportunityConfig.forms.entries()) {
      const testData = buildHappyPathTestData(form, baseSuffix + index);

      // --- Fill the form with generated unique data ---
      await fillForm(testInfo, page, form.formConfig, testData, false);

      // --- Verify save succeeded while still on the form page ---
      await verifyFormStatusAfterSave(page, "complete");

      // --- Capture the form URL ---
      const formUrl = page.url();

      // --- Verify form status on the application page ---
      await verifyFormStatusOnApplication(
        page,
        "complete",
        form.formConfig.formName,
        applicationUrl,
      );

      // --- Store form data and print URL for later validation ---
      filledForms.push({
        formKey: form.formKey,
        formName: form.formConfig.formName,
        testData,
        printUrl: buildPrintUrl(formUrl),
        expectedPrepopulatedFields: form.expectedPrepopulatedFields,
        userEnteredFieldTestIds: form.userEnteredFieldTestIds,
        // The form has no section named for itself; its first is the opportunity.
        expectedSectionHeading: "Opportunity Information",
      });
    }

    // --- Return to application landing page before submitting ---
    await page.goto(applicationUrl);
    await page.waitForLoadState("domcontentloaded");

    // --- Submit Application ---
    await submitApplicationAndVerify(page, "success");

    // --- Confirmation Page Validation ---
    await verifySubmissionConfirmation(page);

    // --- Print View Validation (one print url per form) ---
    await validateAllPrintViews(page, filledForms);
  },
);
