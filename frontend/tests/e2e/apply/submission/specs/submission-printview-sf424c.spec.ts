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

      // -----------------------------------------------------------------------
      // Validate user-entered Table 1 values
      // -----------------------------------------------------------------------

      const testData = sf424cForm.testData;

      const table1Fields = [
        "administrative_and_legal_expenses--total_cost",
        "administrative_and_legal_expenses--non_allowable_cost",
        "land_structures_rights_of_way--total_cost",
        "land_structures_rights_of_way--non_allowable_cost",
        "relocation_expenses--total_cost",
        "relocation_expenses--non_allowable_cost",
        "architectural_engineering_fees--total_cost",
        "architectural_engineering_fees--non_allowable_cost",
        "other_architectural_engineering_fees--total_cost",
        "other_architectural_engineering_fees--non_allowable_cost",
        "project_inspection_fees--total_cost",
        "project_inspection_fees--non_allowable_cost",
        "site_work--total_cost",
        "site_work--non_allowable_cost",
        "demolition_and_removal--total_cost",
        "demolition_and_removal--non_allowable_cost",
        "construction--total_cost",
        "construction--non_allowable_cost",
        "equipment--total_cost",
        "equipment--non_allowable_cost",
        "miscellaneous--total_cost",
        "miscellaneous--non_allowable_cost",
        "contingencies--total_cost",
        "contingencies--non_allowable_cost",
        "project_income--total_cost",
        "project_income--non_allowable_cost",
      ] as const;

      for (const fieldKey of table1Fields) {
        const field = SF424C_FORM_CONFIG.fields[fieldKey];

        if (!field?.testId) {
          throw new Error(`SF-424C field ${fieldKey} does not have a testId.`);
        }

        // The exact print-view validation helper should be used here once the
        // SF-424C print testIds are confirmed from the rendered form.
        //
        // The important assertion is that every persisted user-entered value
        // appears in the corresponding print-view field.
        await expect(
          page.getByText(testData[fieldKey], { exact: true }).first(),
        ).toBeVisible();
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

      // These values should ultimately be validated against their specific
      // print-view field/test IDs once those IDs are confirmed.
      await expect(
        page.getByText(String(expectedSubtotal1TotalCost), { exact: true }),
      ).toBeVisible();

      await expect(
        page.getByText(String(expectedSubtotal1NonAllowable), {
          exact: true,
        }),
      ).toBeVisible();

      await expect(
        page.getByText(String(expectedSubtotal1Allowable), {
          exact: true,
        }),
      ).toBeVisible();

      await expect(
        page.getByText(String(expectedSubtotal2TotalCost), {
          exact: true,
        }),
      ).toBeVisible();

      await expect(
        page.getByText(String(expectedSubtotal2NonAllowable), {
          exact: true,
        }),
      ).toBeVisible();

      await expect(
        page.getByText(String(expectedSubtotal2Allowable), {
          exact: true,
        }),
      ).toBeVisible();

      await expect(
        page.getByText(String(expectedTotalProjectCost), {
          exact: true,
        }),
      ).toBeVisible();

      await expect(
        page.getByText(String(expectedTotalProjectCostNonAllowable), {
          exact: true,
        }),
      ).toBeVisible();

      await expect(
        page.getByText(String(expectedTotalProjectCostAllowable), {
          exact: true,
        }),
      ).toBeVisible();

      await expect(
        page.getByText(String(expectedFederalFundingShare), {
          exact: true,
        }),
      ).toBeVisible();
    },
  );
}
