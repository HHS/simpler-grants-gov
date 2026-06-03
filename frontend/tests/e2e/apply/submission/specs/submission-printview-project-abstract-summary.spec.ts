/**
 * @feature Apply - Happy Path - Application Submission and Print View Workflow for both Organization and Individual users
 * @scenario Complete the Application Submission and Print View workflow for an <user type> user
 *
 * Examples:
 * | user type    | who is applying           |
 * | Organization | Organization A            |
 * | Individual   | As an individual (myself) |
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
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
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
} from "tests/e2e/utils/submission/print-view-utils";
import { submitApplicationAndVerify } from "tests/e2e/utils/submission/submit-application-utils";

const { APPLY, APPLY_FORMS, CORE_REGRESSION, SMOKE, GRANTEE } = VALID_TAGS;

const { testOrgLabel, targetEnv } = playwrightEnv;

// Only the opportunity number is declared here.
// All opportunity/form details are resolved from print-view-opportunities.json.
const OPPORTUNITY_NUMBER = "TEST-PRINT-ORG-IND-ON01";
const opportunityConfig = loadOpportunityConfig(OPPORTUNITY_NUMBER);

const applicantScenarios = [
  {
    testName: `Complete the Application Submission and Print View workflow for an Organization user`,
    orgLabel: testOrgLabel,
  },
  {
    testName: `Complete the Application Submission and Print View workflow for an Individual user`,
    orgLabel: undefined,
  },
] as const;

// Skip non-Chrome browsers in staging to avoid MFA OTP rate-limiting.
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
    { tag: [SMOKE, GRANTEE, APPLY, APPLY_FORMS, CORE_REGRESSION] },
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
      await createApplication(page, opportunityConfig.opportunityUrl, orgLabel);
      const applicationUrl = page.url();

      // --- Fill required forms and collect print URLs ---
      const filledForms: FilledFormEntry[] = [];

      // --- Generate this form's happy-path test data ---
      for (const [index, form] of opportunityConfig.forms.entries()) {
        const testData = buildHappyPathTestData(
          form.buildTestData,
          baseSuffix + index,
          form.formConfig,
        );

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
        });
      }

      // --- Return to application landing page before submitting ---
      await page.goto(applicationUrl);
      await page.waitForLoadState("domcontentloaded");

      // --- Submit Application ---
      await submitApplicationAndVerify(page, "success");

      // --- Confirmation Page Validation ---
      await expect(
        page.getByRole("heading", {
          name: /your application has been submitted/i,
        }),
      ).toBeVisible();

      // --- Summary box contains submission confirmation message ---
      await expect(page.getByTestId("summary-box")).toContainText(
        "Your application has been submitted",
      );

      // --- Print View Validation (one print url per form) ---
      for (const {
        testData,
        printUrl,
        expectedPrepopulatedFields,
        userEnteredFieldTestIds,
        formName,
      } of filledForms) {
        await navigateToPrintView(page, printUrl);

        // --- Form title heading is visible ---
        await expect(page.locator("h1")).toContainText(formName);

        // --- Section heading contains the form name ---
        await expect(
          page.getByTestId("fieldset").getByRole("heading"),
        ).toContainText(formName);

        // --- Pre-populated fields (Data injected from opportunity record) ---
        for (const [testId, expectedValue] of Object.entries(
          expectedPrepopulatedFields,
        )) {
          await expect(page.getByTestId(testId)).toBeVisible();
          await expect(page.getByTestId(testId)).toContainText(expectedValue);
        }

        // --- User-entered fields ---
        for (const [dataKey, testId] of Object.entries(
          userEnteredFieldTestIds,
        )) {
          await expect(page.getByTestId(testId)).toBeVisible();
          await expect(page.getByTestId(testId)).toContainText(
            testData[dataKey],
          );
        }
      }
    },
  );
}
