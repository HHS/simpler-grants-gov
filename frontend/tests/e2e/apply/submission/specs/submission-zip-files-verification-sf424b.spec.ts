/**
 * @feature Apply - Submission zip content verification
 * @scenario Open a pre-submitted application with SF-424B, download the
 * submission zip, then verify the SF424B.pdf and GrantApplication.xml
 * contain the expected form data.
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import {
  SF424B_ZIP_ALL_FIELDS_DATA,
  SF424B_ZIP_APPLICATION_PATH,
  SF424B_ZIP_PDF_EXPECTED_TEXT,
  SF424B_ZIP_PDF_NAME,
} from "tests/e2e/apply/fixtures/sf424b-data";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import {
  assertPdfContainsText,
  assertXmlContainsFields,
  downloadAndUnzipSubmission,
} from "tests/e2e/utils/submission/submission-zip-utils";

const { APPLY_FORMS, FULL_REGRESSION } = VALID_TAGS;

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
    const isMobile = testInfo.project.name.match(/[Mm]obile/);
    await authenticateE2eUser(page, context, !!isMobile);

    await page.goto(SF424B_ZIP_APPLICATION_PATH);
    await page.waitForLoadState("domcontentloaded");

    const contents = await downloadAndUnzipSubmission(page);

    await test.step("Verify GrantApplication.xml field values", () => {
      assertXmlContainsFields(contents, SF424B_ZIP_ALL_FIELDS_DATA);
    });

    await test.step("Verify SF424B.pdf form title and field values", async () => {
      await assertPdfContainsText(
        contents,
        SF424B_ZIP_PDF_NAME,
        SF424B_ZIP_PDF_EXPECTED_TEXT,
      );
    });
  },
);
