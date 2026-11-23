/**
 * @feature Apply - Submission zip content verification
 * @scenario Complete the Project Narrative Attachment application end to end (create,
 * fill, submit), download the generated submission zip from the application page, then
 * verify GrantApplication.xml, the form PDF and the attached file contain the data
 * entered during this run. Covers the legacy form (E2E-PNA-ORG-IND-01) only; the
 * generated form (E2E-PNAG-ORG-IND-01) is not covered.
 */

import fs from "fs";
import path from "path";
import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  PROJECT_NARRATIVE_OPPORTUNITY_DATA,
  PROJECT_NARRATIVE_ZIP_PDF_NAME,
  projectNarrativeDerivedValues,
} from "tests/e2e/apply/fixtures/project-narrative-attachment-data";
import { PROJECT_NARRATIVE_ATTACHMENT_FORM_MATCHER } from "tests/e2e/apply/fixtures/project-narrative-attachment-field-definitions";
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
import type { ResolvedPrintViewForm } from "tests/e2e/utils/submission/opportunity-print-view.types";
import { buildHappyPathTestData } from "tests/e2e/utils/submission/print-view-utils";
import {
  buildExpectedPdfText,
  buildExpectedXmlFields,
} from "tests/e2e/utils/submission/submission-field-utils";
import {
  assertFileInZip,
  assertPdfContainsText,
  assertXmlContainsFields,
  downloadAndUnzipSubmission,
} from "tests/e2e/utils/submission/submission-zip-utils";
import {
  submitApplicationAndVerify,
  verifySubmissionConfirmation,
} from "tests/e2e/utils/submission/submit-application-utils";

const { APPLY_FORMS, FULL_REGRESSION } = VALID_TAGS;

const { testOrgLabel } = playwrightEnv;

const { opportunityNumber, formKey } = PROJECT_NARRATIVE_OPPORTUNITY_DATA;

const opportunityConfig = loadOpportunityConfig(opportunityNumber);

// Runs only against staging, in Chrome. The submission zip is built by the
// submission consumer/task, which does not run in the local e2e environment.
test.beforeEach(({ page: _ }, testInfo) => {
  test.skip(
    playwrightEnv.targetEnv !== "staging",
    "Submission ZIP verification runs only against staging",
  );
  skipNonChromeOnStaging(testInfo);
});

test(
  "Downloaded Submission ZIP contains expected Project Narrative Attachment Form XML, PDF and attached file",
  { tag: [APPLY_FORMS, FULL_REGRESSION] },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo,
  ) => {
    test.setTimeout(300_000); // 5-min timeout (create + fill + submit + zip)

    const isMobile = testInfo.project.name.match(/[Mm]obile/);
    const baseSuffix = Date.now();

    // --- Login ---
    await authenticateE2eUser(page, context, !!isMobile);

    // --- Create a new application for this Project Narrative opportunity ---
    await createApplication(
      page,
      opportunityConfig.opportunityUrl,
      testOrgLabel,
    );
    const applicationUrl = page.url();

    // --- Fill every form on the opportunity ---
    let narrativeTestData: Record<string, string> | undefined;
    let narrativeForm: ResolvedPrintViewForm | undefined;

    for (const [index, form] of opportunityConfig.forms.entries()) {
      const testData = buildHappyPathTestData(form, baseSuffix + index);

      await fillForm(testInfo, page, form.formConfig, testData, false);
      await verifyFormStatusAfterSave(page, "complete");
      await verifyFormStatusOnApplication(
        page,
        "complete",
        form.formConfig.formName,
        applicationUrl,
      );

      if (form.formKey === formKey) {
        narrativeTestData = testData;
        narrativeForm = form;
      }
    }

    if (!narrativeTestData || !narrativeForm) {
      throw new Error(
        `Project Narrative Attachment Form not found for opportunity ${opportunityNumber}`,
      );
    }
    const d = narrativeTestData;

    // --- Submit ---
    await page.goto(applicationUrl);
    await page.waitForLoadState("domcontentloaded");

    await submitApplicationAndVerify(page, "success");
    await verifySubmissionConfirmation(page);

    // --- Download and unzip the generated submission zip ---
    // The zip is built asynchronously after submission, so return to the
    // application page, where the download button appears once it is ready.
    await page.goto(applicationUrl);
    await page.waitForLoadState("domcontentloaded");

    const contents = await downloadAndUnzipSubmission(page);

    // MIME type and hash of the uploaded file; not part of the typed test data.
    const systemValues = projectNarrativeDerivedValues(d);

    await test.step("Verify GrantApplication.xml field values", () => {
      assertXmlContainsFields(
        contents,
        buildExpectedXmlFields(narrativeForm, d, systemValues),
      );
    });

    await test.step(`Verify ${PROJECT_NARRATIVE_ZIP_PDF_NAME} form title and file name`, async () => {
      await assertPdfContainsText(contents, PROJECT_NARRATIVE_ZIP_PDF_NAME, [
        PROJECT_NARRATIVE_ATTACHMENT_FORM_MATCHER,
        ...buildExpectedPdfText(narrativeForm, d, systemValues),
      ]);
    });

    await test.step("Verify the attached file is in the zip, unchanged", () => {
      assertFileInZip(
        contents,
        path.basename(d.attachments),
        new Uint8Array(fs.readFileSync(d.attachments)),
      );
    });
  },
);
