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
import { validateSF424ARowTotals } from "tests/e2e/utils/forms/validate-form-totals-utils";
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

        // Verify SF-424A row totals are calculated after save
        // TODO: Uncomment when bug #11223 is fixed (row totals not being calculated)
        // if (form.formKey === "sf424a") {
        //   await validateSF424ARowTotals(page);
        // }

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

      // Verify SF-424A row totals persist after submission (before print view)
      // Navigate to each SF-424A form's print view to validate totals survived submission
      // TODO: Uncomment when bug #11223 is fixed (row totals not being calculated)
      // for (const { formKey, printUrl } of filledForms) {
      //   if (formKey === "sf424a") {
      //     await navigateToPrintView(page, printUrl);
      //     await validateSF424ARowTotals(page);
      //     // Navigate back to confirmation page for next form
      //     await page.goBack();
      //     await page.waitForLoadState("domcontentloaded");
      //   }
      // }

      // Return to application/confirmation page
      await page.goto(applicationUrl);
      await page.waitForLoadState("domcontentloaded");

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
        for (const [dataKey, testId] of Object.entries(
          userEnteredFieldTestIds,
        )) {
          if (testData[dataKey] === undefined) continue;
          await validatePrintViewField(page, testId, testData[dataKey]);
        }

        // SF-424A validation - strict computed totals checks with activity-specific expectations
        // Test data uses unique values per activity (01, 02, 03, 04)
        // requirement. Totals are still deterministic and calculated per activity index.
        if (formKey === "sf424a") {
          // Section A - Budget Summary

          /**  Due to bug #11223, the following validations are SKIPPED:
          // - Row totals (sum of columns C-F for each activity)
          // - Grand total (sum of all row totals)
          // See: https://github.com/HHS/simpler-grants-gov/issues/11223

          // Validate column totals (sum across all activities for columns C-F)
             validateSF424ARowTotals(page);
          */

          // Helper to format numeric activity value to two decimal places
          const toTwoDecimals = (num: number): string => num.toFixed(2);
          const sectionATotalColumns = toTwoDecimals(1 + 2 + 3 + 4);
          const budgetSummaryCols = [
            "federal_estimated_unobligated_amount",
            "non_federal_estimated_unobligated_amount",
            "federal_new_or_revised_amount",
            "non_federal_new_or_revised_amount",
          ];
          for (const col of budgetSummaryCols) {
            const totalId = `total_budget_summary--${col}`;
            await validatePrintViewField(page, totalId, sectionATotalColumns);
          }
          /**  TODO: Uncomment when bug #11223 is fixed (row totals and grand total)
           // Section A - Grand total (Column G: sum of row totals = 40.00)
           // See: https://github.com/HHS/simpler-grants-gov/issues/11223

           const sectionAGrandTotal = toTwoDecimals(4 + 8 + 12 + 16); // row totals per activity

           await validatePrintViewField(
             page,
             "total_budget_summary--total_amount",
             sectionAGrandTotal,
           );
          */

          // Section B - Budget Categories totals
          // Individual category row totals (Column 5: sum of 1-4)
          // Each category sums across the 4 activities: 1+2+3+4 = 10.00
          const categoryRowTotal = toTwoDecimals(1 + 2 + 3 + 4);
          const categoryFields = [
            "personnel_amount",
            "fringe_benefits_amount",
            "travel_amount",
            "equipment_amount",
            "supplies_amount",
            "contractual_amount",
            "construction_amount",
            "other_amount",
          ];
          for (const categoryField of categoryFields) {
            const categoryTotalId = `total_budget_categories--${categoryField}`;
            await validatePrintViewField(
              page,
              categoryTotalId,
              categoryRowTotal,
            );
          }

          // Total direct charges and indirect charges
          // directChargeColumnSum: (1+2+3+4) × 8 fields
          const sectionBDirectChargeTotal = toTwoDecimals((1 + 2 + 3 + 4) * 8);
          // indirectChargeColumnSum: 1+2+3+4
          const sectionBIndirectChargeTotal = toTwoDecimals(1 + 2 + 3 + 4);
          // grandTotal: sum of row totals (10+20+30+40)
          const sectionBGrandTotal = toTwoDecimals(10 + 20 + 30 + 40);
          // programIncomeSum: 1+2+3+4
          const sectionBProgramIncomeSum = toTwoDecimals(1 + 2 + 3 + 4);

          await validatePrintViewField(
            page,
            "total_budget_categories--total_direct_charge_amount",
            sectionBDirectChargeTotal,
          );
          await validatePrintViewField(
            page,
            "total_budget_categories--total_indirect_charge_amount",
            sectionBIndirectChargeTotal,
          );
          await validatePrintViewField(
            page,
            "total_budget_categories--total_amount",
            sectionBGrandTotal,
          );
          await validatePrintViewField(
            page,
            "total_budget_categories--program_income_amount",
            sectionBProgramIncomeSum,
          );

          // Section C - Non-Federal Resources totals
          // columnBCD: sum of activity values (1+2+3+4)
          const sectionCColumnTotal = toTwoDecimals(1 + 2 + 3 + 4);
          // grandTotal: sum of row totals (3+6+9+12)
          const sectionCGrandTotal = toTwoDecimals(3 + 6 + 9 + 12);

          // Row-level totals for each activity (Column E: sum of B-D per row)
          // Each activity has applicant + state + other = 3 fields
          // Activity 0 (value 1): 1+1+1 = 3.00
          // Activity 1 (value 2): 2+2+2 = 6.00
          // Activity 2 (value 3): 3+3+3 = 9.00
          // Activity 3 (value 4): 4+4+4 = 12.00
          for (let i = 0; i < 4; i++) {
            const activityValue = i + 1;
            const rowTotal = toTwoDecimals(activityValue * 3);
            const rowTotalId = `activity_line_items[${i}]--non_federal_resources--total_amount`;
            await validatePrintViewField(page, rowTotalId, rowTotal);
          }

          // Column totals for each resource type
          await validatePrintViewField(
            page,
            "total_non_federal_resources--applicant_amount",
            sectionCColumnTotal,
          );
          await validatePrintViewField(
            page,
            "total_non_federal_resources--state_amount",
            sectionCColumnTotal,
          );
          await validatePrintViewField(
            page,
            "total_non_federal_resources--other_amount",
            sectionCColumnTotal,
          );

          // Grand total across all activities and resource types
          await validatePrintViewField(
            page,
            "total_non_federal_resources--total_amount",
            sectionCGrandTotal,
          );

          // Section D - Forecasted Cash Needs
          // All quarters use "01" (value 1), so quarterly amounts are consistent
          // Federal total: 1+1+1+1 = 4.00
          // Non-federal total: 1+1+1+1 = 4.00
          // quarterColumnSum: federal + non-federal per quarter = 2.00
          // grandTotal: federal total + non-federal total = 8.00
          const sectionDQuarterlyAmount = toTwoDecimals(1);
          const sectionDRowTotal = toTwoDecimals(1 + 1 + 1 + 1);
          const sectionDQuarterTotal = toTwoDecimals(2);
          const sectionDGrandTotal = toTwoDecimals(2 * 4);

          // Individual quarterly amounts for Federal row
          const quarterFields = [
            "first_quarter_amount",
            "second_quarter_amount",
            "third_quarter_amount",
            "fourth_quarter_amount",
          ];
          for (const quarterField of quarterFields) {
            const federalQuarterId = `total_forecasted_cash_needs--federal_forecasted_cash_needs--${quarterField}`;
            await validatePrintViewField(
              page,
              federalQuarterId,
              sectionDQuarterlyAmount,
            );
          }

          // Individual quarterly amounts for Non-federal row
          for (const quarterField of quarterFields) {
            const nonFederalQuarterId = `total_forecasted_cash_needs--non_federal_forecasted_cash_needs--${quarterField}`;
            await validatePrintViewField(
              page,
              nonFederalQuarterId,
              sectionDQuarterlyAmount,
            );
          }

          // Federal and Non-federal row totals (Column E)
          await validatePrintViewField(
            page,
            "total_forecasted_cash_needs--federal_forecasted_cash_needs--total_amount",
            sectionDRowTotal,
          );
          await validatePrintViewField(
            page,
            "total_forecasted_cash_needs--non_federal_forecasted_cash_needs--total_amount",
            sectionDRowTotal,
          );

          // Quarter column totals (Row 15: sum of federal + non-federal per quarter)
          for (const quarterField of quarterFields) {
            const quarterTotalId = `total_forecasted_cash_needs--${quarterField}`;
            await validatePrintViewField(
              page,
              quarterTotalId,
              sectionDQuarterTotal,
            );
          }

          // Grand total
          await validatePrintViewField(
            page,
            "total_forecasted_cash_needs--total_amount",
            sectionDGrandTotal,
          );

          // Section E - Federal Fund Estimates
          // Each year column has 4 activities (value 1, 2, 3, 4)
          // Column sum per year: 1+2+3+4 = 10.00
          // Row total per activity: 1+1+1+1 = 4.00 (4 years)
          const sectionEColumnTotal = toTwoDecimals(1 + 2 + 3 + 4);
          const sectionERowTotal = toTwoDecimals(1 + 1 + 1 + 1);

          // Row totals for each activity (sum of Year 1-4)
          for (let i = 0; i < 4; i++) {
            const rowTotalId = `activity_line_items[${i}]--federal_fund_estimates--total_amount`;
            await validatePrintViewField(page, rowTotalId, sectionERowTotal);
          }

          // Column totals for each year (Year 1-4: sum of activities 1-4)
          const yearFields = [
            "year_1_amount",
            "year_2_amount",
            "year_3_amount",
            "year_4_amount",
          ];
          for (const yearField of yearFields) {
            const yearTotalId = `total_federal_fund_estimates--${yearField}`;
            await validatePrintViewField(
              page,
              yearTotalId,
              sectionEColumnTotal,
            );
          }
        }
      }
    },
  );
}
