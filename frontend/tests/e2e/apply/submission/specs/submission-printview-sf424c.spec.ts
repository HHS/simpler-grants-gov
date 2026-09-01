/**
 * @feature Apply - Happy Path - SF-424C Application Submission and Print View Workflow
 * @scenario Complete the SF-424C Application Submission and Print View workflow for an <user type> user
 *
 * Validates:
 * - all user-editable SF-424C budget fields can be populated
 * - calculated allowable costs are generated correctly
 * - subtotal calculations are correct
 * - total project costs are correct
 * - federal funding share is calculated from the federal percentage
 * - the saved form is complete
 * - the submitted application succeeds
 * - the SF-424C print view contains the persisted and calculated values
 */

import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { SF424C_FORM_CONFIG } from "tests/e2e/apply/fixtures/sf424c-field-definitions";
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

const OPPORTUNITY_NUMBER = "E2E-SF424C-ORG-IND-01";
const opportunityConfig = loadOpportunityConfig(OPPORTUNITY_NUMBER);

const applicantScenarios = [
  {
    testName:
      "Complete the SF-424C Application Submission and Print View workflow for an Organization user",
    orgLabel: testOrgLabel,
  },
  {
    testName:
      "Complete the SF-424C Application Submission and Print View workflow for an Individual user",
    orgLabel: undefined,
  },
] as const;

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
      test.setTimeout(300_000);

      const isMobile = testInfo.project.name.match(/[Mm]obile/);
      const baseSuffix = Date.now();

      // Login
      await authenticateE2eUser(page, context, !!isMobile);

      // Create application
      await createApplication(page, opportunityConfig.opportunityUrl, orgLabel);

      const applicationUrl = page.url();

      // Fill SF-424C
      const filledForms: FilledFormEntry[] = [];

      for (const [index, form] of opportunityConfig.forms.entries()) {
        const testData = buildHappyPathTestData(form, baseSuffix + index);

        await fillForm(testInfo, page, form.formConfig, testData, false);

        await verifyFormStatusAfterSave(page, "complete");

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

      // -----------------------------------------------------------------------
      // Submit
      // -----------------------------------------------------------------------

      await page.goto(applicationUrl);
      await page.waitForLoadState("domcontentloaded");

      await submitApplicationAndVerify(page, "success");
      await verifySubmissionConfirmation(page);

      // -----------------------------------------------------------------------
      // Print view
      // -----------------------------------------------------------------------

      // SF-424C has custom validation logic below, so skip it in validateAllPrintViews
      const nonSF424CFormsForValidation = filledForms.filter(
        (form) => form.formKey !== "sf424c",
      );
      if (nonSF424CFormsForValidation.length > 0) {
        await validateAllPrintViews(page, nonSF424CFormsForValidation);
      }

      const sf424cForm = filledForms.find(
        ({ formKey }) => formKey === "sf424c",
      );

      if (!sf424cForm) {
        throw new Error("SF-424C form was not found in the filled forms.");
      }

      await navigateToPrintView(page, sf424cForm.printUrl);

      // Helper function to create a flexible regex pattern that matches values
      // with or without currency formatting (e.g., "1000" or "$1,000.00")
      const createFlexibleValuePattern = (value: string): RegExp => {
        // Create a regex that matches currency-formatted values with flexible comma placement
        // e.g., "1000" becomes /\$?1,?0{3}(\.\d{2})?/ which matches "$1000", "$1,000", "$1,000.00"
        const digits = Array.from(value);
        // Join digits with optional comma separator
        const digitPattern = digits.join(',?');
        // Add optional currency and decimal formatting
        return new RegExp(`\\$?${digitPattern}(\\.\\d{2})?`);
      };

      // -----------------------------------------------------------------------
      // Validate user-entered Table 1 values
      // -----------------------------------------------------------------------

      const testData = sf424cForm.testData;

      const table1Fields = [
        "budget_information--administrative_and_legal_expenses--total_cost",
        "budget_information--administrative_and_legal_expenses--non_allowable_cost",
        "budget_information--land_structures_rights_of_way--total_cost",
        "budget_information--land_structures_rights_of_way--non_allowable_cost",
        "budget_information--relocation_expenses--total_cost",
        "budget_information--relocation_expenses--non_allowable_cost",
        "budget_information--architectural_engineering_fees--total_cost",
        "budget_information--architectural_engineering_fees--non_allowable_cost",
        "budget_information--other_architectural_engineering_fees--total_cost",
        "budget_information--other_architectural_engineering_fees--non_allowable_cost",
        "budget_information--project_inspection_fees--total_cost",
        "budget_information--project_inspection_fees--non_allowable_cost",
        "budget_information--site_work--total_cost",
        "budget_information--site_work--non_allowable_cost",
        "budget_information--demolition_and_removal--total_cost",
        "budget_information--demolition_and_removal--non_allowable_cost",
        "budget_information--construction--total_cost",
        "budget_information--construction--non_allowable_cost",
        "budget_information--equipment--total_cost",
        "budget_information--equipment--non_allowable_cost",
        "budget_information--miscellaneous--total_cost",
        "budget_information--miscellaneous--non_allowable_cost",
        "budget_information--contingencies--total_cost",
        "budget_information--contingencies--non_allowable_cost",
        "budget_information--project_income--total_cost",
        "budget_information--project_income--non_allowable_cost",
      ] as const;

      for (const fieldKey of table1Fields) {
        const field = SF424C_FORM_CONFIG.fields[fieldKey];

        if (!field?.testId) {
          throw new Error(`SF-424C field ${fieldKey} does not have a testId.`);
        }

        // In print view, the testId has a "-read-only" suffix (e.g., budget_424c_table_1-0-1-read-only)
        // This is the most reliable way to locate the specific field value in print view
        const printTestId = field.testId.replace("-input", "-read-only");
        const valuePattern = createFlexibleValuePattern(testData[fieldKey]);
        
        await expect(page.getByTestId(printTestId)).toContainText(valuePattern);
      }

      // -----------------------------------------------------------------------
      // Validate calculated values
      // -----------------------------------------------------------------------

      // Subtotal 1 (Rows 0-10): 11 items × 1000 total = 11,000
      // Rows 0-10 non-allowable: 11 items × 100 = 1,100
      // Rows 0-10 allowable: 11,000 - 1,100 = 9,900
      const expectedSubtotal1TotalCost = 11_000;
      const expectedSubtotal1NonAllowable = 1_100;
      const expectedSubtotal1Allowable = 9_900;

      // Subtotal 2 (Rows 0-12): Subtotal 1 + Contingencies (1000/100)
      // Total: 11,000 + 1,000 = 12,000
      // Non-allowable: 1,100 + 100 = 1,200
      // Allowable: 9,900 + 900 = 10,800
      const expectedSubtotal2TotalCost = 12_000;
      const expectedSubtotal2NonAllowable = 1_200;
      const expectedSubtotal2Allowable = 10_800;

      // Project Income (Row 14): 5000 total, 500 non-allowable
      const _expectedProjectIncomeTotalCost = 5_000;
      const _expectedProjectIncomeNonAllowable = 500;
      const _expectedProjectIncomeAllowable = 4_500;

      // Total Project Cost = Subtotal 2 - Project Income
      // Total: 12,000 - 5,000 = 7,000
      // Non-allowable: 1,200 - 500 = 700
      // Allowable: 10,800 - 4,500 = 6,300
      const expectedTotalProjectCost = 7_000;
      const expectedTotalProjectCostNonAllowable = 700;
      const expectedTotalProjectCostAllowable = 6_300;

      // Federal Funding Share = Total Project Cost × 90% = 7,000 × 0.9 = 6,300
      const expectedFederalFundingShare = 6_300;

      // Table 2 (Federal Funding) validation:
      // Row 0: Total project costs (read-only, calculated from Table 1) = $7,000
      // Row 1: Federal percentage share (user-entered) = 90%
      // Row 2: Federal funding share (read-only, calculated) = $6,300
      const expectedTotalProjectCostsTable2 = 7_000;
      const expectedFederalPercentageShare = 90; // User entered value
      
      // Calculated fields use -read-only testIds in print view.
      // These are mapped by their table/row/column position.
      const calculatedFieldsMap = {
        subtotal1_total: { testId: "budget_424c_table_1-11-1-read-only", value: expectedSubtotal1TotalCost },
        subtotal1_non_allowable: { testId: "budget_424c_table_1-11-2-read-only", value: expectedSubtotal1NonAllowable },
        subtotal1_allowable: { testId: "budget_424c_table_1-11-3-read-only", value: expectedSubtotal1Allowable },
        subtotal2_total: { testId: "budget_424c_table_1-13-1-read-only", value: expectedSubtotal2TotalCost },
        subtotal2_non_allowable: { testId: "budget_424c_table_1-13-2-read-only", value: expectedSubtotal2NonAllowable },
        subtotal2_allowable: { testId: "budget_424c_table_1-13-3-read-only", value: expectedSubtotal2Allowable },
        total_project_cost: { testId: "budget_424c_table_1-15-1-read-only", value: expectedTotalProjectCost },
        total_project_cost_non_allowable: { testId: "budget_424c_table_1-15-2-read-only", value: expectedTotalProjectCostNonAllowable },
        total_project_cost_allowable: { testId: "budget_424c_table_1-15-3-read-only", value: expectedTotalProjectCostAllowable },
        total_project_costs_table_2: { testId: "budget_424c_table_2-0-1-read-only", value: expectedTotalProjectCostsTable2 },
        federal_funding_share: { testId: "budget_424c_table_2-2-1-read-only", value: expectedFederalFundingShare },
      };

      for (const [_fieldName, { testId, value }] of Object.entries(calculatedFieldsMap)) {
        const valuePattern = createFlexibleValuePattern(String(value));
        await expect(page.getByTestId(testId)).toContainText(valuePattern);
      }

      // Validate federal percentage share (Row 1 in Table 2) - special handling for percentage
      // The user entered 90, which displays as "90.00%" or "90%"
      const percentagePattern = /90(?:\.00)?%/;
      await expect(page.getByTestId("budget_424c_table_2-1-1-read-only")).toContainText(percentagePattern);
    },
  );
}
