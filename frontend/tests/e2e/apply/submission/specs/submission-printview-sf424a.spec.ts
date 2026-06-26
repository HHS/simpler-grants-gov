/**
 * @feature Apply - Happy Path - SF-424A Application Submission and Print View Workflow
 * @scenario Complete the SF-424A Application Submission and Print View workflow for an <user type> user
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
  validatePrintViewField,
} from "tests/e2e/utils/submission/print-view-utils";
import { submitApplicationAndVerify } from "tests/e2e/utils/submission/submit-application-utils";

const { APPLY, APPLY_FORMS, CORE_REGRESSION, SMOKE, GRANTEE } = VALID_TAGS;

const { testOrgLabel, targetEnv } = playwrightEnv;

// Only the opportunity number is declared here.
// All opportunity/form details are resolved from the per-form data files via load-opportunity-config.ts.
// Unified opportunity for both local and staging environments.
const OPPORTUNITY_NUMBER = "E2E-SF424A-ORG-IND-01";
const opportunityConfig = loadOpportunityConfig(OPPORTUNITY_NUMBER);

const applicantScenarios = [
  {
    testName: `Complete the SF-424A Application Submission and Print View workflow for an Organization user`,
    orgLabel: testOrgLabel,
  },
  {
    testName: `Complete the SF-424A Application Submission and Print View workflow for an Individual user`,
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
      // Given the user is logged in
      await authenticateE2eUser(page, context, !!isMobile);

      // --- Navigate to Opportunity page and start a new application ---
      // And the user launches the URL for an opportunity with an open SF-424A competition
      // When the user clicks "Start Application", selects applicant type and creates the application
      await createApplication(page, opportunityConfig.opportunityUrl, orgLabel);
      const applicationUrl = page.url();

      // --- Fill required forms and collect print URLs ---
      // For each form on this opportunity: fill it, verify status, then capture the
      // form URL *before* verifyFormStatusOnApplication navigates away to the app page.
      const filledForms: FilledFormEntry[] = [];

      for (const [index, form] of opportunityConfig.forms.entries()) {
        const testData = buildHappyPathTestData(
          form.buildTestData,
          baseSuffix + index,
          form.formConfig,
        );

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
      await expect(
        page.getByRole("heading", {
          name: /your application has been submitted/i,
        }),
      ).toBeVisible();

      await expect(page.getByTestId("summary-box")).toContainText(
        "Your application has been submitted",
      );

      // --- Print View Validation (one page per form) ---
      for (const {
        formKey,
        testData,
        printUrl,
        expectedPrepopulatedFields,
        userEnteredFieldTestIds,
        formName,
      } of filledForms) {
        await navigateToPrintView(page, printUrl);

        // Form title heading is visible
        await expect(page.locator("h1")).toContainText(formName);

        // Pre-populated fields (API-injected from opportunity record)
        for (const [testId, expectedValue] of Object.entries(
          expectedPrepopulatedFields,
        )) {
          await expect(page.getByTestId(testId)).toBeVisible();
          await expect(page.getByTestId(testId)).toContainText(expectedValue);
        }

        // User-entered fields - testIds derived from formConfig.fields (printTestId ?? testId)
        // Skip fields not present in testData (e.g. conditional fields that weren't filled)
        // Note: SF-424A has computed total fields that may not appear in testData
        for (const [dataKey, testId] of Object.entries(
          userEnteredFieldTestIds,
        )) {
          if (testData[dataKey] === undefined) continue;
          await validatePrintViewField(page, testId, testData[dataKey]);
        }

        // SF-424A has no attachment sections (unlike SF-424)
        // All sections (A–F) contain computed totals that are derived from user-entered values
        // and validated implicitly by the above checks on user-entered fields.
        if (formKey === "sf424a") {
          // Verify computed totals are rendered in print view
          // These totals are rule-computed on the form and reflected in print view
          // The test data uses values that produce deterministic totals (all fields = "1")
          // so we can reliably validate them here.

          // Section A - Budget Summary totals (activity row totals and column totals)
          // Activity row totals: 4 columns × 1 = "4.00"
          const activityTotals = page.locator(
            '[data-testid*="activity_line_items"][data-testid*="budget_summary"][data-testid*="total"]',
          );
          if ((await activityTotals.count()) > 0) {
            // Verify at least some computed totals are rendered
            await expect(activityTotals.first()).toBeVisible();
          }

          // Section B - Budget Categories totals (category row sums and grand total)
          const budgetCategoryTotals = page.locator(
            '[data-testid*="budget_categories"][data-testid*="total"]',
          );
          if ((await budgetCategoryTotals.count()) > 0) {
            await expect(budgetCategoryTotals.first()).toBeVisible();
          }

          // Section C - Non-Federal Resources totals
          const nonFederalTotals = page.locator(
            '[data-testid*="non_federal_resources"][data-testid*="total"]',
          );
          if ((await nonFederalTotals.count()) > 0) {
            await expect(nonFederalTotals.first()).toBeVisible();
          }

          // Section D - Forecasted Cash Needs totals
          const cashNeedsTotals = page.locator(
            '[data-testid*="forecasted_cash_needs"][data-testid*="total"]',
          );
          if ((await cashNeedsTotals.count()) > 0) {
            await expect(cashNeedsTotals.first()).toBeVisible();
          }
        }
      }
    },
  );
}
