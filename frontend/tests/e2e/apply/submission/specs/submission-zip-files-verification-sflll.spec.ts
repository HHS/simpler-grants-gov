/**
 * @feature Apply - Submission zip content verification
 * @scenario Complete the SF-LLL application end to end (create, fill, submit),
 * download the generated submission zip from the application page, then verify
 * SFLLL_2_0.pdf and GrantApplication.xml contain the data entered during this run.
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { SFLLL_FORM_MATCHER } from "tests/e2e/apply/fixtures/sfLLL-field-definitions";
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
  getUsEasternDateString,
} from "tests/e2e/utils/submission/submission-field-utils";
import {
  assertPdfContainsText,
  assertXmlContainsFields,
  downloadAndUnzipSubmission,
  PDF_SERIALIZATION_LEAKS,
} from "tests/e2e/utils/submission/submission-zip-utils";
import {
  submitApplicationAndVerify,
  verifySubmissionConfirmation,
} from "tests/e2e/utils/submission/submit-application-utils";

const { APPLY_FORMS, FULL_REGRESSION } = VALID_TAGS;

const { testOrgLabel } = playwrightEnv;

const OPPORTUNITY_NUMBER = "E2E-SFLLL-ORG-IND-01";
const opportunityConfig = loadOpportunityConfig(OPPORTUNITY_NUMBER);

// Zip entry is "<form.short_form_name>.pdf" (SFLLL_2_0 in the API form definition).
const SFLLL_ZIP_PDF_NAME = "SFLLL_2_0.pdf";
// System post-populated signature (SignatureBlock/Signature): the e2e user's email.
const SIGNATURE_VALUE = "simpler-grants-e2e-tester@navapbc.com";

// Text that must not appear in the PDF. The generic "is required" check catches leaked
// validation messages ("<Field> is required"), but the SF-LLL certification text itself
// reads "This disclosure is required pursuant to 31 U.S.C. 1352", so that phrase is excluded.
const SFLLL_UNEXPECTED_PDF_TEXT = [
  ...PDF_SERIALIZATION_LEAKS,
  /\bis required\b(?! pursuant)/i,
];

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
  "Downloaded Submission ZIP contains expected SFLLL XML and PDF data",
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

    // --- Create a new application for the SF-LLL opportunity ---
    await createApplication(
      page,
      opportunityConfig.opportunityUrl,
      testOrgLabel,
    );
    const applicationUrl = page.url();

    // --- Fill every form on the opportunity with unique, per-run data ---
    let sflllTestData: Record<string, string> | undefined;
    let sflllForm: ResolvedPrintViewForm | undefined;

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

      if (form.formKey === "sfLLL") {
        sflllTestData = testData;
        sflllForm = form;
      }
    }

    if (!sflllTestData || !sflllForm) {
      throw new Error(
        `SF-LLL form not found for opportunity ${OPPORTUNITY_NUMBER}`,
      );
    }
    const d = sflllTestData;

    // --- Submit ---
    await page.goto(applicationUrl);
    await page.waitForLoadState("domcontentloaded");

    await submitApplicationAndVerify(page, "success");
    await verifySubmissionConfirmation(page);

    // DateReceived / DateSigned are the submission date in US Eastern time.
    const submittedDate = getUsEasternDateString();

    // --- Download and unzip the generated submission zip ---
    // The zip is generated on demand after submission, so return to the
    // application page, where the download button becomes enabled.
    await page.goto(applicationUrl);
    await page.waitForLoadState("domcontentloaded");

    const contents = await downloadAndUnzipSubmission(page);

    // System post-populated at submission; not part of the typed test data.
    const systemValues = {
      signature: SIGNATURE_VALUE,
      signed_date: submittedDate,
    };

    await test.step("Verify GrantApplication.xml field values", () => {
      assertXmlContainsFields(
        contents,
        buildExpectedXmlFields(sflllForm, d, systemValues),
      );
    });

    await test.step("Verify SFLLL_2_0.pdf form title and field values", async () => {
      await assertPdfContainsText(
        contents,
        SFLLL_ZIP_PDF_NAME,
        [
          SFLLL_FORM_MATCHER,
          ...buildExpectedPdfText(sflllForm, d, systemValues),
        ],
        SFLLL_UNEXPECTED_PDF_TEXT,
      );
    });
  },
);
