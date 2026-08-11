/**
 * @feature Apply - Attachment Form - Unsaved Upload, Save, and Resubmission Workflow
 * @scenario Validate attachment persistence, abandonment, history, and submission behavior throughout the application lifecycle.
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
import { fillForm } from "tests/e2e/utils/forms/general-forms-filling";
import {
  verifyFormStatusAfterSave,
  verifyFormStatusOnApplication,
} from "tests/e2e/utils/forms/verify-form-status-utils";
import { getApplicationHistoryActivities } from "tests/e2e/utils/submission/application-history-utils";
import { loadOpportunityConfig } from "tests/e2e/utils/submission/load-opportunity-config";
import type { FilledFormEntry } from "tests/e2e/utils/submission/opportunity-print-view.types";
import {
  buildHappyPathTestData,
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

const OPPORTUNITY_NUMBER = "E2E-ATT-ORG-IND-01";
const opportunityConfig = loadOpportunityConfig(OPPORTUNITY_NUMBER);
const attachmentForm = opportunityConfig.forms[0];

const applicantScenarios = [
  {
    scenarioName: "Organization applicant",
    orgLabel: testOrgLabel,
    expectedApplicantAddedActivity: "Organization Added",
  },
  {
    scenarioName: "Individual applicant",
    orgLabel: undefined,
    expectedApplicantAddedActivity: "User added:",
  },
] as const;

test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

async function verifyVirusScanPassedAndUploaded(page: Page, fileName: string) {
  await expect(
    page.getByRole("progressbar", { name: "Loading!" }),
  ).toBeVisible();
  await expect(page.getByTestId("file-input-existing-files")).toContainText(
    fileName,
    { timeout: 30_000 },
  );
  await expect(
    page.getByTestId("file-input-existing-files").getByTestId("button"),
  ).toContainText("Delete");
}

for (const {
  scenarioName,
  orgLabel,
  expectedApplicantAddedActivity,
} of applicantScenarios) {
  test.describe.serial(scenarioName, () => {
    let browser: Browser;
    let context: BrowserContext;
    let page: Page;
    let applicationUrl: string;
    let formUrl: string;
    let testData: Record<string, string>;

    test.beforeAll(async ({ browser: b }, testInfo: TestInfo) => {
      browser = b;
      context = await browser.newContext();
      page = await context.newPage();

      const isMobile = testInfo.project.name.match(/[Mm]obile/);
      await authenticateE2eUser(page, context, !!isMobile);

      await createApplication(page, opportunityConfig.opportunityUrl, orgLabel);
      applicationUrl = page.url();
      testData = buildHappyPathTestData(attachmentForm, Date.now());
    });

    test.afterAll(async () => {
      await context.close();
    });

    test(
      `${scenarioName} - abandoned attachment upload is not saved`,
      { tag: TAGS },
      async () => {
        test.setTimeout(120_000);

        await page.getByTestId("application-form-link").click();
        formUrl = page.url();

        await page
          .getByRole("button", {
            name: attachmentForm.formConfig.fields.att1.field,
            exact: true,
          })
          .setInputFiles(testData.att1);

        await verifyVirusScanPassedAndUploaded(page, "sample-upload-kb.pdf");

        // Emulate the browser closing: discard this tab's unsaved client state entirely
        // and open a fresh page from the same authenticated context.
        const newPage = await context.newPage();
        await page.close();
        page = newPage;

        await page.goto(applicationUrl);
        await page.waitForLoadState("domcontentloaded");

        const activities = await getApplicationHistoryActivities(page);
        expect(activities.some((a) => a.includes("Attachment added"))).toBe(
          false,
        );
        expect(
          activities.some((a) => a.includes(expectedApplicantAddedActivity)),
        ).toBe(true);
        expect(activities.some((a) => a.includes("Application created"))).toBe(
          true,
        );
      },
    );

    test(
      `${scenarioName} - re-uploaded attachment saves and appears in history`,
      { tag: TAGS },
      async ({ page: _ }: { page: Page }, testInfo: TestInfo) => {
        test.setTimeout(120_000);

        await fillForm(
          testInfo,
          page,
          attachmentForm.formConfig,
          testData,
          false,
        );
        await verifyFormStatusAfterSave(page, "complete");
        formUrl = page.url();

        await verifyFormStatusOnApplication(
          page,
          "complete",
          attachmentForm.formConfig.formName,
          applicationUrl,
        );

        const activities = await getApplicationHistoryActivities(page);
        expect(
          activities.some((a) =>
            a.includes("Attachment added: sample-upload-kb.pdf"),
          ),
        ).toBe(true);
      },
    );

    test(
      `${scenarioName} - submits and print view reflects the persisted attachment only`,
      { tag: TAGS },
      async () => {
        test.setTimeout(120_000);

        await page.goto(applicationUrl);
        await page.waitForLoadState("domcontentloaded");
        await submitApplicationAndVerify(page, "success");
        await verifySubmissionConfirmation(page);

        // Third history checkpoint: confirm submission itself was recorded, and that
        // the attachment activity from the previous test is still present alongside it.
        const postSubmitActivities =
          await getApplicationHistoryActivities(page);
        expect(postSubmitActivities[0]).toContain("Application submitted");
        expect(
          postSubmitActivities.some((a) =>
            a.includes("Attachment added: sample-upload-kb.pdf"),
          ),
        ).toBe(true);

        const printUrl = buildPrintUrl(formUrl);

        const filledForms: FilledFormEntry[] = [
          {
            formKey: attachmentForm.formKey,
            formName: attachmentForm.formConfig.formName,
            testData,
            printUrl,
            expectedPrepopulatedFields:
              attachmentForm.expectedPrepopulatedFields,
            userEnteredFieldTestIds: attachmentForm.userEnteredFieldTestIds,
          },
        ];

        // Standard print-view validation (matches submission-printview-attachment.spec.ts):
        // print-view wrapper present, no visible enabled/editable inputs, form title,
        // prepopulated fields, and user-entered fields (attachment fields are excluded
        // here since they have no testId - validated separately below).
        await validateAllPrintViews(page, filledForms);

        // Confirm the full form layout rendered, not just the filled section - the
        // unfilled "Attachment 2" section should still be present.
        await expect(
          page.getByRole("heading", { name: "1) Attachment 1", exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText("Attachment 2", { exact: true }),
        ).toBeVisible();
        await expect(page.locator("#form-section-attachment2")).toContainText(
          "Attachment 2",
        );

        // Only the persisted attachment shows up as user-entered content.
        await validateAttachmentPrintViewSection(
          page,
          "form-section-attachment1",
          testData.att1,
        );
        await expect(page.locator("#form-section-attachment1")).toContainText(
          "sample-upload-kb.pdf",
        );

        // Print view is a static snapshot - no live interactive elements should render.
        await expect(page.getByRole("button")).toHaveCount(0);
        await expect(page.locator('[href*="undefined"]')).toHaveCount(0);
      },
    );
  });
}
