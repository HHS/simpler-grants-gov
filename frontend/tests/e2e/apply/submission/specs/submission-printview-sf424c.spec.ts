/**
 * @feature Apply - Happy Path - SF-424C Application Submission and Print View Workflow
 * @scenario Complete the SF-424C Application Submission and Print View workflow for an <user type> user
 **/

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  buildSF424CApplicantScenarios,
  validateSF424CCalculatedFields,
  validateSF424CFederalPercentageShare,
  validateSF424CTable1UserEnteredFields,
} from "tests/e2e/apply/fixtures/sf424c-data";
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
  assertPrintViewIsReadOnly,
  buildHappyPathTestData,
  buildPrintUrl,
  navigateToPrintView,
} from "tests/e2e/utils/submission/print-view-utils";
import {
  submitApplicationAndVerify,
  verifySubmissionConfirmation,
} from "tests/e2e/utils/submission/submit-application-utils";

const { APPLY, APPLY_FORMS, CORE_REGRESSION, SMOKE, GRANTEE } = VALID_TAGS;

const { testOrgLabel } = playwrightEnv;

const OPPORTUNITY_NUMBER = "E2E-SF424C-ORG-IND-01";
const opportunityConfig = loadOpportunityConfig(OPPORTUNITY_NUMBER);

const applicantScenarios = buildSF424CApplicantScenarios(testOrgLabel);

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

      // Submit application and verify submission confirmation

      await page.goto(applicationUrl);
      await page.waitForLoadState("domcontentloaded");

      await submitApplicationAndVerify(page, "success");
      await verifySubmissionConfirmation(page);

      // Print view - SF-424C validation

      const sf424cForm = filledForms.find(
        (form): form is FilledFormEntry => form.formKey === "sf424c",
      );

      if (!sf424cForm) {
        throw new Error("SF-424C form was not found in the filled forms.");
      }

      const printUrl = sf424cForm.printUrl;
      const formName = sf424cForm.formName;
      const formTitle =
        typeof formName === "string" ? formName : formName.source;
      const testData: Record<string, string> = sf424cForm.testData;

      await navigateToPrintView(page, printUrl);

      // Validate print view structure and read-only state
      await assertPrintViewIsReadOnly(page);

      // Form title is visible in h1 heading
      const pageHeading = await page.locator("h1").textContent();
      if (!pageHeading || !pageHeading.includes(formTitle)) {
        throw new Error(
          `Expected page heading to include "${formTitle}", got: "${pageHeading ?? ""}"`,
        );
      }

      // Validate user-entered Table 1 values

      await validateSF424CTable1UserEnteredFields(page, testData);

      // Validate calculated values

      await validateSF424CCalculatedFields(page);

      // Validate federal percentage share (Row 1 in Table 2) - special handling for percentage
      // The user entered value displays as a percentage in print view
      const federalPercentage = parseInt(
        testData["federal_funding--federal_percentage_share"],
        10,
      );
      await validateSF424CFederalPercentageShare(page, federalPercentage);
    },
  );
}
