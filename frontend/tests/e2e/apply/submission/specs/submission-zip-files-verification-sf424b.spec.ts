/**
 * @feature Apply - Submission zip content verification
 * @scenario Complete the SF-424B application end to end (create, fill,
 * submit), download the generated submission zip from the application page,
 * then verify the SF424B.pdf and GrantApplication.xml contain the data that
 * was entered during this run.
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  fieldDefinitionsSF424B,
  SF424B_FORM_MATCHER,
} from "tests/e2e/apply/fixtures/sf424b-field-definitions";
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
import { buildHappyPathTestData } from "tests/e2e/utils/submission/print-view-utils";
import {
  assertPdfContainsText,
  assertXmlContainsFields,
  downloadAndUnzipSubmission,
} from "tests/e2e/utils/submission/submission-zip-utils";
import {
  submitApplicationAndVerify,
  verifySubmissionConfirmation,
} from "tests/e2e/utils/submission/submit-application-utils";
import { buildExpectedXmlFields } from "tests/e2e/utils/submission/xml-field-utils";

const { APPLY_FORMS, FULL_REGRESSION } = VALID_TAGS;

const { testOrgLabel } = playwrightEnv;

// Same opportunity as the SF-424B print view spec; all opportunity/form
// details are resolved from the per-form data files.
const OPPORTUNITY_NUMBER = "E2E-SF424B-ORG-IND-01";
const opportunityConfig = loadOpportunityConfig(OPPORTUNITY_NUMBER);

const SF424B_ZIP_PDF_NAME = "SF424B.pdf";
// System post-populated signature (SF424B:RepresentativeName): the e2e user's email.
const SIGNATURE_VALUE = "simpler-grants-e2e-tester@navapbc.com";

test.beforeEach(({ page: _ }, testInfo) => {
  test.skip(
    playwrightEnv.targetEnv !== "staging",
    "Submission ZIP verification runs only against staging",
  );
  skipNonChromeOnStaging(testInfo);
});

test(
  "Downloaded Submission ZIP contains expected SF424B XML and PDF data",
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

    // --- Create a new application for the SF-424B opportunity ---
    await createApplication(
      page,
      opportunityConfig.opportunityUrl,
      testOrgLabel,
    );
    const applicationUrl = page.url();

    // --- Fill the SF-424B form with unique, per-run data ---
    const form = opportunityConfig.forms.find((f) => f.formKey === "sf424b");
    if (!form) {
      throw new Error(
        `SF-424B form not found for opportunity ${OPPORTUNITY_NUMBER}`,
      );
    }

    const testData = buildHappyPathTestData(form, baseSuffix);

    await fillForm(testInfo, page, form.formConfig, testData, false);
    await verifyFormStatusAfterSave(page, "complete");
    await verifyFormStatusOnApplication(
      page,
      "complete",
      form.formConfig.formName,
      applicationUrl,
    );

    // --- Submit ---
    await page.goto(applicationUrl);
    await page.waitForLoadState("domcontentloaded");

    await submitApplicationAndVerify(page, "success");
    await verifySubmissionConfirmation(page);

    // SubmittedDate in the XML/PDF is the server (UTC) submission date.
    const submittedDate = new Date().toISOString().slice(0, 10);

    // --- Download and unzip the generated submission zip ---
    // The zip is generated on demand after submission, so return to the
    // application page, where downloadAndUnzipSubmission waits for the
    // download button to become enabled.
    await page.goto(applicationUrl);
    await page.waitForLoadState("domcontentloaded");

    const contents = await downloadAndUnzipSubmission(page);

    await test.step("Verify GrantApplication.xml field values", () => {
      assertXmlContainsFields(
        contents,
        buildExpectedXmlFields(form, testData, {
          signature: SIGNATURE_VALUE,
          date_signed: submittedDate,
        }),
      );
    });

    await test.step("Verify SF424B.pdf form title and field values", async () => {
      const { title, applicant_organization, signature } =
        fieldDefinitionsSF424B;

      await assertPdfContainsText(contents, SF424B_ZIP_PDF_NAME, [
        SF424B_FORM_MATCHER,
        signature.field,
        SIGNATURE_VALUE,
        `${title.field}* ${testData.title}`,
        `${applicant_organization.field}* ${testData.applicant_organization}`,
        submittedDate,
      ]);
    });
  },
);
