/**
 * @feature Apply - Attachment Form - Virus Scan Failure and Recovery Workflow
 * @scenario Validate that an infected upload is rejected and removed, and a subsequent valid
 * upload persists correctly through save, application history, submission, and print view.
 */

import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import {
  verifyVirusScanFailedAndRemoved,
  verifyVirusScanPassedAndUploaded,
} from "tests/e2e/utils/forms/file-upload-status-utils";
import { verifyFormStatusAfterSave } from "tests/e2e/utils/forms/verify-form-status-utils";
import { getApplicationHistoryActivities } from "tests/e2e/utils/submission/application-history-utils";
import { loadOpportunityConfig } from "tests/e2e/utils/submission/load-opportunity-config";
import type { FilledFormEntry } from "tests/e2e/utils/submission/opportunity-print-view.types";
import {
  buildPrintUrl,
  validateAllPrintViews,
  validateAttachmentPrintViewSection,
} from "tests/e2e/utils/submission/print-view-utils";
import {
  submitApplicationAndVerify,
  verifySubmissionConfirmation,
} from "tests/e2e/utils/submission/submit-application-utils";

const { APPLY, APPLY_FORMS, CORE_REGRESSION, SMOKE, GRANTEE } = VALID_TAGS;
const TAGS = [SMOKE, GRANTEE, APPLY, APPLY_FORMS, CORE_REGRESSION];

const { testOrgLabel } = playwrightEnv;

// Same opportunity/form as submission-printview-attachment-persistence-history.spec.ts
const OPPORTUNITY_NUMBER = "E2E-ATT-ORG-IND-01";
const opportunityConfig = loadOpportunityConfig(OPPORTUNITY_NUMBER);
const attachmentForm = opportunityConfig.forms[0];
const INFECTED_FIXTURE_PATH =
  "tests/e2e/test-upload-files/scenario-infected.pdf";

const INFECTED_FILE_NAME = "scenario-infected.pdf";

const VALID_FIXTURE_PATH =
  "tests/e2e/test-upload-files/SF424_4_0-V4.0-Instructions_0.pdf";

const VALID_FILE_NAME = "SF424_4_0-V4.0-Instructions_0.pdf";

test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

const applicantScenarios = [
  {
    applicantType: "Organization",
    orgLabel: testOrgLabel,
  },

  {
    applicantType: "Individual",
    orgLabel: undefined,
  },
] as const;

for (const { applicantType, orgLabel } of applicantScenarios) {
  test.describe
    .serial(`Attachment form - virus scan failure and recovery - ${applicantType}`, () => {
    // Declared at describe-scope (not test fixtures) so the SAME authenticated
    // page/context created in beforeAll carries through to the test below.
    // Previously these were closed at the end of beforeAll and the test used
    // Playwright's fixture-provided { page, context } instead — a fresh,
    // unauthenticated context — which is why goto(applicationUrl) timed out
    // waiting for application-form-link (redirected to an unauthenticated view).

    let browser: Browser;
    let context: BrowserContext;
    let page: Page;
    let applicationUrl: string;

    test.beforeAll(async ({ browser: b }, testInfo: TestInfo) => {
      browser = b;
      context = await browser.newContext();
      page = await context.newPage();
      const isMobile = testInfo.project.name.match(/[Mm]obile/);

      await authenticateE2eUser(page, context, !!isMobile);

      await createApplication(page, opportunityConfig.opportunityUrl, orgLabel);
      applicationUrl = page.url();
    });

    test.afterAll(async () => {
      await context.close();
    });

    test(
      `${applicantType}: infected upload is rejected and removed, valid upload persists`,
      { tag: TAGS },

      async () => {
        test.setTimeout(120_000);

        // Step 1: Open the application attachment form.
        await page.goto(applicationUrl);
        await page.waitForLoadState("domcontentloaded");

        // Wait for the application forms table to be visible, which contains the form link
        await expect(
          page.locator(".simpler-application-forms-table").first(),
        ).toBeVisible({ timeout: 30000 });

        // Explicitly wait for the form link to be clickable before clicking
        await page
          .getByTestId("application-form-link")
          .waitFor({ state: "visible", timeout: 15000 });

        await page.getByTestId("application-form-link").click();

        const attachmentField = attachmentForm.formConfig.fields.att1.field;

        // Step 2: Upload an infected file and verify that the virus scan
        // fails and the file is removed.

        await page
          .getByRole("button", {
            name: attachmentField,
            exact: true,
          })
          .setInputFiles(INFECTED_FIXTURE_PATH);

        await verifyVirusScanFailedAndRemoved(page, INFECTED_FILE_NAME, page);

        const dismissButton = page
          .locator("div")
          .filter({ hasText: /^Dismiss$/ });

        await expect(dismissButton).toBeVisible();
        await dismissButton.click();

        // Step 3: Upload a valid file into the same attachment field.

        await page
          .getByRole("button", {
            name: attachmentField,
            exact: true,
          })
          .setInputFiles(VALID_FIXTURE_PATH);

        await verifyVirusScanPassedAndUploaded(
          page,
          VALID_FILE_NAME,
          page,
          false,
        );

        // Step 4: Save the form and verify it completes successfully.

        await page.getByTestId("apply-form-save").click();

        await verifyFormStatusAfterSave(page, "complete");

        const formUrl = page.url();

        await expect(
          page.getByText("Form was saved", { exact: false }),
        ).toBeVisible();

        // Step 5: Verify Application History contains the valid attachment

        // and does not contain the rejected infected attachment.

        await page.goto(applicationUrl);

        await page.waitForLoadState("domcontentloaded");

        const activities = await getApplicationHistoryActivities(page);

        expect(
          activities.some((activity) =>
            activity.includes(`Attachment added: ${VALID_FILE_NAME}`),
          ),
        ).toBe(true);

        expect(
          activities.some((activity) => activity.includes(INFECTED_FILE_NAME)),
        ).toBe(false);

        expect(
          activities.some((activity) =>
            activity.includes("Application created"),
          ),
        ).toBe(true);

        if (applicantType === "Organization") {
          expect(
            activities.some((activity) =>
              activity.includes("Organization Added"),
            ),
          ).toBe(true);
        }

        // Step 6: Submit the application and verify the confirmation page.

        await submitApplicationAndVerify(page, "success");

        await verifySubmissionConfirmation(page);

        const postSubmitActivities =
          await getApplicationHistoryActivities(page);

        expect(postSubmitActivities[0]).toContain("Application submitted");

        expect(
          postSubmitActivities.some((activity) =>
            activity.includes(`Attachment added: ${VALID_FILE_NAME}`),
          ),
        ).toBe(true);

        // Step 7: Verify print view contains only the valid persisted

        // attachment.

        const printUrl = buildPrintUrl(formUrl);

        const filledForms: FilledFormEntry[] = [
          {
            formKey: attachmentForm.formKey,
            formName: attachmentForm.formConfig.formName,
            testData: {
              att1: VALID_FILE_NAME,
            },
            printUrl,
            expectedPrepopulatedFields:
              attachmentForm.expectedPrepopulatedFields,
            userEnteredFieldTestIds: attachmentForm.userEnteredFieldTestIds,
          },
        ];

        await validateAllPrintViews(page, filledForms);

        await expect(
          page.getByRole("heading", {
            name: "1) Attachment 1",
            exact: true,
          }),
        ).toBeVisible();

        await validateAttachmentPrintViewSection(
          page,
          "form-section-attachment1",
          VALID_FILE_NAME,
        );

        await expect(page.locator("#form-section-attachment1")).toContainText(
          VALID_FILE_NAME,
        );

        // Print view is a static snapshot and should not contain live

        // interactive elements or broken links.

        await expect(page.getByRole("button")).toHaveCount(0);

        await expect(page.locator('[href*="undefined"]')).toHaveCount(0);
      },
    );
  });
}
