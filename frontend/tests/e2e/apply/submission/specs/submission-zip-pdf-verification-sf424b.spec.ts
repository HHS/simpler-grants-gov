/**
 * @feature Apply - Submission zip PDF content verification
 * @scenario Open a pre-submitted application with SF-424B, download the
 * submission zip, then verify the SF424B.pdf in it contains the expected
 * form title and field values.
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { SF424B_ZIP_ALL_FIELDS_DATA } from "tests/e2e/apply/fixtures/sf424b-data";
import {
  fieldDefinitionsSF424B,
  SF424B_FORM_MATCHER,
} from "tests/e2e/apply/fixtures/sf424b-field-definitions";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import {
  assertPdfContainsText,
  downloadAndUnzipSubmission,
} from "tests/e2e/utils/submission/submission-zip-utils";

const { APPLY, CORE_REGRESSION, GRANTEE } = VALID_TAGS;

const APPLICATION_URL =
  "https://staging.simpler.grants.gov/workspace/applications/aa9da806-3764-4e98-8dd7-8e5a72b20bd8";

const SF424B_PDF_NAME = "SF424B.pdf";

const { title, applicant_organization, representative_name, SubmittedDate } =
  SF424B_ZIP_ALL_FIELDS_DATA;

const SF424B_PDF_EXPECTED_TEXT = [
  SF424B_FORM_MATCHER,
  fieldDefinitionsSF424B.signature.field,
  representative_name.value,
  `${fieldDefinitionsSF424B.title.field}* ${title.value}`,
  `${fieldDefinitionsSF424B.applicant_organization.field}* ${applicant_organization.value}`,
  SubmittedDate.value,
];

test.beforeEach(({ page: _ }, testInfo) => {
  test.skip(
    process.env.PLAYWRIGHT_TARGET_ENV === "local",
    "Submission ZIP verification runs only against staging",
  );
  skipNonChromeOnStaging(testInfo);
});

test(
  "Downloaded Submission ZIP contains SF424B PDF with expected form data",
  { tag: [APPLY, GRANTEE, CORE_REGRESSION] },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo,
  ) => {
    const isMobile = testInfo.project.name.match(/[Mm]obile/);
    await authenticateE2eUser(page, context, !!isMobile);

    await page.goto(APPLICATION_URL);
    await page.waitForLoadState("domcontentloaded");

    const contents = await downloadAndUnzipSubmission(page);

    // Same fixed values the XML spec asserts on. SubmittedDate is left out:
    // the PDF's date format isn't confirmed yet.
    await assertPdfContainsText(
      contents,
      SF424B_PDF_NAME,
      SF424B_PDF_EXPECTED_TEXT,
    );
  },
);
