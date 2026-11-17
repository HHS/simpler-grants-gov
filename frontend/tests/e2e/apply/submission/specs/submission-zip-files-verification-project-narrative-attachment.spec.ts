/**
 * @feature Apply - Submission zip content verification
 * @scenario Complete the Project Narrative Attachment application end to end (create,
 * fill, submit), download the generated submission zip from the application page, then
 * verify GrantApplication.xml, ProjectNarrativeAttachments_1_2.pdf and the attached
 * file contain the data entered during this run.
 */

import fs from "fs";
import path from "path";
import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { pnaDerivedValues } from "tests/e2e/apply/fixtures/project-narrative-attachment-data";
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

const OPPORTUNITY_NUMBER = "E2E-PNA-ORG-IND-01";
const opportunityConfig = loadOpportunityConfig(OPPORTUNITY_NUMBER);

// Zip entry is "<form.short_form_name>.pdf" (ProjectNarrativeAttachments_1_2 in the API form definition).
const PNA_ZIP_PDF_NAME = "ProjectNarrativeAttachments_1_2.pdf";

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
  "Downloaded Submission ZIP contains expected Project Narrative Attachment XML, PDF and attached file",
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

    // --- Create a new application for the Project Narrative Attachment opportunity ---
    await createApplication(
      page,
      opportunityConfig.opportunityUrl,
      testOrgLabel,
    );
    const applicationUrl = page.url();

    // --- Fill every form on the opportunity ---
    let pnaTestData: Record<string, string> | undefined;
    let pnaForm: ResolvedPrintViewForm | undefined;

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

      if (form.formKey === "projectNarrativeAttachment") {
        pnaTestData = testData;
        pnaForm = form;
      }
    }

    if (!pnaTestData || !pnaForm) {
      throw new Error(
        `Project Narrative Attachment form not found for opportunity ${OPPORTUNITY_NUMBER}`,
      );
    }
    const d = pnaTestData;

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
    const systemValues = pnaDerivedValues(d);

    await test.step("Verify GrantApplication.xml field values", () => {
      assertXmlContainsFields(
        contents,
        buildExpectedXmlFields(pnaForm, d, systemValues),
      );
    });

    await test.step("Verify ProjectNarrativeAttachments_1_2.pdf form title and file name", async () => {
      await assertPdfContainsText(contents, PNA_ZIP_PDF_NAME, [
        PROJECT_NARRATIVE_ATTACHMENT_FORM_MATCHER,
        ...buildExpectedPdfText(pnaForm, d, systemValues),
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
