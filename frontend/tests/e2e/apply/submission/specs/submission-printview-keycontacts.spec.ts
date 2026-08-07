/**
 * @feature Apply - Happy Path - Key Contacts Application Submission and Print View Workflow
 * @scenario Complete the Key Contacts Application Submission and Print View workflow for an <user type> user
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  buildKeyContactsHappyPathTestData,
  buildKeyContactsRequiredFieldsHappyPathTestData,
} from "tests/e2e/apply/fixtures/key-contacts-data";
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
  validateAllPrintViews,
} from "tests/e2e/utils/submission/print-view-utils";
import {
  submitApplicationAndVerify,
  verifySubmissionConfirmation,
} from "tests/e2e/utils/submission/submit-application-utils";

const { APPLY, APPLY_FORMS, CORE_REGRESSION, SMOKE, GRANTEE, FULL_REGRESSION } =
  VALID_TAGS;

const { testOrgLabel } = playwrightEnv;

const OPPORTUNITY_NUMBER = "E2E-KC-ORG-IND-01";
const opportunityConfig = loadOpportunityConfig(OPPORTUNITY_NUMBER);

/**
 * Test scenarios cover both minimal (required fields only) and complete
 * (all required + optional fields) happy-path submissions for both
 * Organization and Individual user types.
 *
 * Minimal scenarios: SMOKE tags (fast smoke tests)
 * Complete scenarios: FULL_REGRESSION tags (comprehensive coverage)
 */
const applicantScenarios = [
  {
    testName: `Key Contacts - Required fields only - Organization user`,
    orgLabel: testOrgLabel,
    tags: [SMOKE, GRANTEE, APPLY, APPLY_FORMS],
    buildTestData: buildKeyContactsRequiredFieldsHappyPathTestData,
  },
  {
    testName: `Key Contacts - Complete form - Organization user`,
    orgLabel: testOrgLabel,
    tags: [FULL_REGRESSION, GRANTEE, APPLY, APPLY_FORMS, CORE_REGRESSION],
    buildTestData: buildKeyContactsHappyPathTestData,
  },
  {
    testName: `Key Contacts - Required fields only - Individual user`,
    orgLabel: undefined,
    tags: [SMOKE, GRANTEE, APPLY, APPLY_FORMS],
    buildTestData: buildKeyContactsRequiredFieldsHappyPathTestData,
  },
  {
    testName: `Key Contacts - Complete form - Individual user`,
    orgLabel: undefined,
    tags: [FULL_REGRESSION, GRANTEE, APPLY, APPLY_FORMS, CORE_REGRESSION],
    buildTestData: buildKeyContactsHappyPathTestData,
  },
] as const;

test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

for (const { testName, orgLabel, tags, buildTestData } of applicantScenarios) {
  test(
    testName,
    { tag: [...tags] }, // Convert readonly array to mutable
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000);

      const isMobile = testInfo.project.name.match(/[Mm]obile/);
      const baseSuffix = Date.now();

      await authenticateE2eUser(page, context, !!isMobile);

      await createApplication(page, opportunityConfig.opportunityUrl, orgLabel);
      const applicationUrl = page.url();

      const filledForms: FilledFormEntry[] = [];

      for (const [index, form] of opportunityConfig.forms.entries()) {
        // Use scenario-specific builder for Key Contacts form,
        // or fall back to generic builder for other forms
        const testData =
          form.formKey === "keyContacts"
            ? buildTestData(baseSuffix + index)
            : buildHappyPathTestData(form, baseSuffix + index);

        await fillForm(testInfo, page, form.formConfig, testData, false);

        await verifyFormStatusAfterSave(page, "complete");

        const formUrl = page.url();
        const printUrl = buildPrintUrl(formUrl);

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
          printUrl,
          expectedPrepopulatedFields: form.expectedPrepopulatedFields,
          userEnteredFieldTestIds: form.userEnteredFieldTestIds,
          expectedSectionHeading: form.formConfig.formName,
        });
      }

      await page.goto(applicationUrl);
      await page.waitForLoadState("domcontentloaded");

      await submitApplicationAndVerify(page, "success");

      await verifySubmissionConfirmation(page);

      // --- Print View Validation (one page per form) ---
      await validateAllPrintViews(page, filledForms);
    },
  );
}
