/**
 * @feature Apply - Happy Path - SF-424 Attachment Upload, Upload Status, and History Workflow
 * @scenario Populate the SF-424 form's single- and multi-file attachment fields, verify each
 *           upload's status individually, confirm the resulting activities in the Application History
 *           table, then submit and validate the print view. Repeated for Organization and Individual
 *           applicants.
 */

import fs from "fs";
import path from "path";
import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  SF424_FORM_CONFIG,
  SF424_FORM_MATCHER,
} from "tests/e2e/apply/fixtures/sf424-field-definitions";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { createApplication } from "tests/e2e/utils/application/create-application-utils";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import { verifyVirusScanPassedAndUploaded } from "tests/e2e/utils/forms/file-upload-status-utils";
import { openForm } from "tests/e2e/utils/forms/form-navigation-utils";
import { fillFormPartial } from "tests/e2e/utils/forms/general-forms-filling";
import { clickSaveButton } from "tests/e2e/utils/forms/save-form-utils";
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

const OPPORTUNITY_NUMBER = "E2E-SF424-ORG-IND-01";
const opportunityConfig = loadOpportunityConfig(OPPORTUNITY_NUMBER);
const sf424Form = opportunityConfig.forms[0];

const UPLOAD_SOURCE_FILE = path.join(
  process.cwd(),
  "tests/e2e/test-upload-files/sample-upload-kb.pdf",
);

const applicantScenarios = [
  { scenarioName: "Organization applicant", orgLabel: testOrgLabel },
  { scenarioName: "Individual applicant", orgLabel: undefined },
] as const;

test.beforeEach(({ page: _ }, testInfo) => {
  skipNonChromeOnStaging(testInfo);
});

/** Extracts the display filename from a full path, matching how the app renders it. */
function fileNameOf(filePath: string): string {
  return filePath.split(/[/\\]/).pop() ?? filePath;
}

/**
 * Creates a uniquely named copy of the shared upload fixture.
 *
 * Example:
 * sample-upload-kb-1.pdf
 * sample-upload-kb-2.pdf
 * sample-upload-kb-3.pdf
 */
function createNumberedUploadFile(
  sourceFile: string,
  counter: number,
  uniqueSuffix: string,
): string {
  const directory = path.dirname(sourceFile);
  const extension = path.extname(sourceFile);
  const baseName = path.basename(sourceFile, extension);

  const numberedFile = path.join(
    directory,
    `${baseName}-${uniqueSuffix}-${counter}${extension}`,
  );

  fs.copyFileSync(sourceFile, numberedFile);

  return numberedFile;
}

for (const { scenarioName, orgLabel } of applicantScenarios) {
  test(
    `${scenarioName} - SF-424 attachment upload, status, and history validation`,
    { tag: TAGS },
    async (
      { page, context }: { page: Page; context: BrowserContext },
      testInfo: TestInfo,
    ) => {
      test.setTimeout(300_000); // 5-min timeout

      const isMobile = testInfo.project.name.match(/[Mm]obile/);
      await authenticateE2eUser(page, context, !!isMobile);

      await createApplication(page, opportunityConfig.opportunityUrl, orgLabel);
      const applicationUrl = page.url();

      const testData = buildHappyPathTestData(sf424Form, Date.now());

      // Use a unique suffix so parallel test runs do not overwrite each other's files.
      const uniqueSuffix = `${testInfo.parallelIndex}-${Date.now()}`;
      let fileCounter = 1;

      const areasAffectedFile = createNumberedUploadFile(
        UPLOAD_SOURCE_FILE,
        fileCounter++,
        uniqueSuffix,
      );

      const congressionalFile = createNumberedUploadFile(
        UPLOAD_SOURCE_FILE,
        fileCounter++,
        uniqueSuffix,
      );

      const firstProjectTitleFile = createNumberedUploadFile(
        UPLOAD_SOURCE_FILE,
        fileCounter++,
        uniqueSuffix,
      );

      const secondProjectTitleFile = createNumberedUploadFile(
        UPLOAD_SOURCE_FILE,
        fileCounter++,
        uniqueSuffix,
      );

      // Replace the attachment fixture paths with uniquely named copies.
      testData.areas_affected_attachment = areasAffectedFile;
      testData.additional_congressional_attachment = congressionalFile;
      testData.additional_project_title_attachment = firstProjectTitleFile;

      // --- Fill the form, holding back the multi-file field for a manual step below ---
      const {
        additional_project_title_attachment: _firstProjectTitleFile,
        ...restOfTestData
      } = testData;

      const opened = await openForm(page, SF424_FORM_MATCHER);
      if (!opened) {
        throw new Error(
          "Could not find or open the SF-424 form link on the application page",
        );
      }

      await fillFormPartial(
        testInfo,
        page,
        SF424_FORM_CONFIG.fields,
        restOfTestData,
      );

      // --- Verify upload status for each single-file attachment ---
      await verifyVirusScanPassedAndUploaded(
        page,
        fileNameOf(testData.areas_affected_attachment),
        page.locator("#form-section-areas_affected"),
        false,
      );

      await verifyVirusScanPassedAndUploaded(
        page,
        fileNameOf(testData.additional_congressional_attachment),
        page.locator("#form-section-congressional_districts"),
        false,
      );

      // --- Multi-file attachment: raw upload, since fillForm only supports one file per field ---
      const additionalProjectTitleField =
        SF424_FORM_CONFIG.fields.additional_project_title_attachment;

      const additionalProjectTitleLocator = additionalProjectTitleField.selector
        ? page.locator(additionalProjectTitleField.selector)
        : page.getByTestId(additionalProjectTitleField.testId as string);

      const projectTitleSection = page.locator("#form-section-project_title");

      await additionalProjectTitleLocator.setInputFiles([
        firstProjectTitleFile,
        secondProjectTitleFile,
      ]);

      await verifyVirusScanPassedAndUploaded(
        page,
        fileNameOf(firstProjectTitleFile),
        projectTitleSection,
      );

      await expect(projectTitleSection).toContainText(
        fileNameOf(secondProjectTitleFile),
      );

      await clickSaveButton(page, SF424_FORM_CONFIG.saveButtonTestId);
      await verifyFormStatusAfterSave(page, "complete");

      const formUrl = page.url();

      await verifyFormStatusOnApplication(
        page,
        "complete",
        SF424_FORM_CONFIG.formName,
        applicationUrl,
      );

      // --- History checkpoint: every attachment upload was recorded, once each ---
      const activities = await getApplicationHistoryActivities(page);

      const expectedAttachmentFiles = [
        testData.areas_affected_attachment,
        testData.additional_congressional_attachment,
        firstProjectTitleFile,
        secondProjectTitleFile,
      ];

      for (const filePath of expectedAttachmentFiles) {
        const fileName = fileNameOf(filePath);

        const actualCount = activities.filter((activity) =>
          activity.includes(`Attachment added: ${fileName}`),
        ).length;

        expect(actualCount).toBe(1);
      }

      // --- Submit and confirm ---
      await submitApplicationAndVerify(page, "success");
      await verifySubmissionConfirmation(page);

      // --- Print view validation ---
      const filledForms: FilledFormEntry[] = [
        {
          formKey: sf424Form.formKey,
          formName: SF424_FORM_CONFIG.formName,
          testData,
          printUrl: buildPrintUrl(formUrl),
          expectedPrepopulatedFields: sf424Form.expectedPrepopulatedFields,
          userEnteredFieldTestIds: sf424Form.userEnteredFieldTestIds,
        },
      ];

      await validateAllPrintViews(page, filledForms);

      // --- Attachment-specific print view sections ---
      const sf424AttachmentSections = [
        {
          fieldKey: "areas_affected_attachment",
          sectionId: "form-section-areas_affected",
        },
        {
          fieldKey: "additional_congressional_attachment",
          sectionId: "form-section-congressional_districts",
        },
      ] as const;

      for (const { fieldKey, sectionId } of sf424AttachmentSections) {
        await validateAttachmentPrintViewSection(
          page,
          sectionId,
          testData[fieldKey],
        );
      }

      // --- Additional Project Title section holds both uploaded files ---
      const printProjectTitleSection = page.locator(
        "#form-section-project_title",
      );

      await expect(printProjectTitleSection).toContainText(
        fileNameOf(firstProjectTitleFile),
      );

      await expect(printProjectTitleSection).toContainText(
        fileNameOf(secondProjectTitleFile),
      );
    },
  );
}
