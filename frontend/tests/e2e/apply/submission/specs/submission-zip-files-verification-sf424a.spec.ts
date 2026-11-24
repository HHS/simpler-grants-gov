/**
 * @feature Apply - Submission zip content verification
 * @scenario Complete the SF-424A application end to end (create, fill, submit),
 * download the generated submission zip from the application page, then verify
 * SF424A.pdf and GrantApplication.xml contain the data entered during this run.
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { sf424aComputedValues } from "tests/e2e/apply/fixtures/sf424a-data";
import { SF424A_FORM_MATCHER } from "tests/e2e/apply/fixtures/sf424a-field-definitions";
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

const OPPORTUNITY_NUMBER = "E2E-SF424A-ORG-IND-01";
const opportunityConfig = loadOpportunityConfig(OPPORTUNITY_NUMBER);

// Zip entry is "<form.short_form_name>.pdf" (SF424A in the API form definition).
const SF424A_ZIP_PDF_NAME = "SF424A.pdf";
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
  "Downloaded Submission ZIP contains expected SF424A XML and PDF data",
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

    // --- Create a new application for the SF-424A opportunity ---
    await createApplication(
      page,
      opportunityConfig.opportunityUrl,
      testOrgLabel,
    );
    const applicationUrl = page.url();

    // --- Fill every form on the opportunity with unique, per-run data ---
    let sf424aTestData: Record<string, string> | undefined;
    let sf424aForm: ResolvedPrintViewForm | undefined;

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

      if (form.formKey === "sf424a") {
        sf424aTestData = testData;
        sf424aForm = form;
      }
    }

    if (!sf424aTestData || !sf424aForm) {
      throw new Error(
        `SF-424A form not found for opportunity ${OPPORTUNITY_NUMBER}`,
      );
    }
    const d = sf424aTestData;

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

    // Rule-computed totals (sum_monetary) are not part of the typed test data.
    const systemValues = sf424aComputedValues(d);

    await test.step("Verify GrantApplication.xml field values", () => {
      assertXmlContainsFields(
        contents,
        buildExpectedXmlFields(sf424aForm, d, systemValues),
      );
    });

    await test.step("Verify SF424A.pdf form title and field values", async () => {
      await assertPdfContainsText(contents, SF424A_ZIP_PDF_NAME, [
        SF424A_FORM_MATCHER,
        ...buildExpectedPdfText(sf424aForm, d, systemValues),
      ]);
    });
  },
);
