/**
 * @feature Apply - Happy Path - SF-424 Application Submission and Print View Workflow
 * @scenario Complete the SF-424 Application Submission and Print View workflow for an <user type> user
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  SF424_GENERATED_OPPORTUNITY_DATA,
  SF424_OPPORTUNITIES,
} from "tests/e2e/apply/fixtures/sf424-data";
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
import type { FilledFormEntry } from "tests/e2e/utils/submission/opportunity-print-view.types";
import {
  buildHappyPathTestData,
  buildPrintUrl,
  navigateToPrintView,
  validateAllPrintViews,
  validateAttachmentPrintViewSection,
} from "tests/e2e/utils/submission/print-view-utils";
import { scenariosForEachForm } from "tests/e2e/utils/submission/scenarios-for-each-form";
import {
  submitApplicationAndVerify,
  verifySubmissionConfirmation,
} from "tests/e2e/utils/submission/submit-application-utils";

const { APPLY_FORMS, SMOKE } = VALID_TAGS;

const { testOrgLabel } = playwrightEnv;

// The opportunities live in sf424-data.ts; load-opportunity-config.ts resolves each one.
const applicantScenarios = scenariosForEachForm(SF424_OPPORTUNITIES, [
  {
    testName: `Complete the SF-424 Application Submission and Print View workflow for an Organization user`,
    orgLabel: testOrgLabel,
  },
  {
    testName: `Complete the SF-424 Application Submission and Print View workflow for an Individual user`,
    orgLabel: undefined,
  },
] as const);

// Skip non-Chrome browsers in staging to avoid MFA OTP rate-limiting.
test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

for (const { testName, orgLabel, opportunityConfig } of applicantScenarios) {
  test(
    testName,
    { tag: [APPLY_FORMS, SMOKE] },
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
      // And the user launches the URL for an opportunity with an open SF-424 competition
      // When the user clicks "Start Application", selects applicant type and creates the application
      await createApplication(page, opportunityConfig.opportunityUrl, orgLabel);
      const applicationUrl = page.url();

      // --- Fill required forms and collect print URLs ---
      // For each form on this opportunity: fill it, verify status, then capture the
      // form URL *before* verifyFormStatusOnApplication navigates away to the app page.
      const filledForms: FilledFormEntry[] = [];

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
      await validateAllPrintViews(page, filledForms);

      // --- SF-424 Attachment-Specific Validation ---
      for (const { formKey, testData, printUrl } of filledForms) {
        // SF-424 attachments - filenames are in the section, not testId elements
        if (formKey === "sf424") {
          await navigateToPrintView(page, printUrl);

          const sf424AttachmentSections = [
            {
              fieldKey: "areas_affected_attachment",
              sectionId: "form-section-areas_affected",
            },
            {
              fieldKey: "additional_project_title_attachment",
              sectionId: "form-section-project_title",
            },
            {
              fieldKey: "additional_congressional_attachment",
              sectionId: "form-section-congressional_districts",
            },
          ] as const;

          for (const { fieldKey, sectionId } of sf424AttachmentSections) {
            if (testData[fieldKey]) {
              await validateAttachmentPrintViewSection(
                page,
                sectionId,
                testData[fieldKey],
              );
            }
          }
        }

        // The generated form lists all three attachments in its Project Information section
        if (formKey === SF424_GENERATED_OPPORTUNITY_DATA.formKey) {
          await navigateToPrintView(page, printUrl);

          for (const fieldKey of [
            "areas_affected_attachment",
            "additional_project_title_attachment",
            "additional_congressional_attachment",
          ]) {
            if (testData[fieldKey]) {
              await validateAttachmentPrintViewSection(
                page,
                "form-section-project-information",
                testData[fieldKey],
              );
            }
          }
        }
      }
    },
  );
}
