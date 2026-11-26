/**
 * @feature Apply - Happy Path - Application Submission and Print View Workflow for both Organization and Individual users
 * @scenario Complete the Application Submission and Print View workflow for an <user type> user
 *
 * Examples:
 * | user type    | who is applying           |
 * | Organization | Organization A            |
 * | Individual   | As an individual (myself) |
 */

import path from "path";
import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { SF424_R_R_GENERATED_OPPORTUNITY_DATA } from "tests/e2e/apply/fixtures/sf424-r-r-data";
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

const { APPLY_FORMS, FULL_REGRESSION } = VALID_TAGS;

const { testOrgLabel } = playwrightEnv;

// Only the opportunity number is declared here.
// All opportunity/form details are resolved from form specific fixtures.
const OPPORTUNITY_NUMBER =
  SF424_R_R_GENERATED_OPPORTUNITY_DATA.opportunityNumber;
const opportunityConfig = loadOpportunityConfig(OPPORTUNITY_NUMBER);

// Every attachment prints in the one section that lists the supporting files.
const ATTACHMENT_SECTION_ID = "form-section-supporting-files";

const applicantScenarios = [
  {
    testName: `Complete the SF-424 (R&R) (Generated) Form Submission and Print View workflow for an Organization user`,
    orgLabel: testOrgLabel,
  },
  {
    testName: `Complete the SF-424 (R&R) (Generated) Form Submission and Print View workflow for an Individual user`,
    orgLabel: undefined,
  },
] as const;

// Skip non-Chrome browsers in staging to avoid MFA OTP rate-limiting.
test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

for (const { testName, orgLabel } of applicantScenarios) {
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
      await authenticateE2eUser(page, context, !!isMobile);

      // --- Navigate to Opportunity page and start a new application ---
      await createApplication(page, opportunityConfig.opportunityUrl, orgLabel);
      const applicationUrl = page.url();

      // --- Fill required forms and collect print URLs ---
      const filledForms: FilledFormEntry[] = [];
      const attachmentChecks: {
        printUrl: string;
        fileCounts: Map<string, number>;
      }[] = [];

      for (const [index, form] of opportunityConfig.forms.entries()) {
        // --- Generate this form's happy-path test data ---
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
          expectedSectionHeading: "Submission and Application",
        });

        // --- Count the files each attachment section lists ---
        const fileCounts = new Map<string, number>();
        for (const [key, field] of Object.entries(form.formConfig.fields)) {
          if (field.type === "file" && testData[key]) {
            const fileName = path.basename(testData[key]);
            fileCounts.set(fileName, (fileCounts.get(fileName) ?? 0) + 1);
          }
        }
        attachmentChecks.push({ printUrl: buildPrintUrl(formUrl), fileCounts });
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

      // --- Attachment Validation ---
      // validateAttachmentPrintViewSection expects one file per section, and this
      // section lists every attachment. Count each file name, since one file is
      // attached to more than one question.
      for (const { printUrl, fileCounts } of attachmentChecks) {
        await navigateToPrintView(page, printUrl);
        const listItems = page
          .locator(`[id="${ATTACHMENT_SECTION_ID}"]`)
          .getByRole("listitem");
        for (const [fileName, count] of fileCounts) {
          await expect(listItems.filter({ hasText: fileName })).toHaveCount(
            count,
          );
        }
      }
    },
  );
}
