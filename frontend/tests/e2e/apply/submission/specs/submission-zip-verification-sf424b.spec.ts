/**
 * @feature Apply - Submission zip content verification
 * @scenario Open a pre-submitted SF-424B application, check for the submission zip
 * to become available, then verify the zip contains a valid SF424B.pdf and a
 * GrantApplication.xml whose content matches the data that was filled in.
 */

import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { SF424B_ZIP_EXPECTED_DATA } from "tests/e2e/apply/fixtures/sf424b-data";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";
import {
  assertXmlContains,
  downloadAndUnzipSubmission,
  waitForSubmissionZipReady,
} from "tests/e2e/utils/submission/submission-zip-utils";

const { APPLY, CORE_REGRESSION, GRANTEE } = VALID_TAGS;

const APPLICATION_URL =
  "https://staging.simpler.grants.gov/workspace/applications/aa9da806-3764-4e98-8dd7-8e5a72b20bd8";

test.beforeEach(({ page: _ }, testInfo) => {
  test.skip(
    process.env.PLAYWRIGHT_TARGET_ENV === "local",
    "Submission ZIP verification runs only against staging",
  );
  skipNonChromeOnStaging(testInfo);
});

test(
  "Submission zip contains SF424B PDF and XML with correct form data",
  { tag: [APPLY, GRANTEE, CORE_REGRESSION] },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo,
  ) => {
    const isMobile = testInfo.project.name.match(/[Mm]obile/);
    await authenticateE2eUser(page, context, !!isMobile);

    // --- Open the pre-submitted application ---
    await page.goto(APPLICATION_URL);
    await page.waitForLoadState("domcontentloaded");

    // --- Check if the zip is downloadable, then download and unzip it ---
    await waitForSubmissionZipReady(page, APPLICATION_URL);
    const contents = await downloadAndUnzipSubmission(page);

    // --- Verify GrantApplication.xml contains the entered field values ---
    // Element names AND prefix confirmed against SF-424B's own _xml_config in
    // api/src/form_schema/forms/sf424b/1/0/form_json.py, which explicitly sets
    // "root_namespace_prefix": "SF424B" - every element in this form's body carries
    // that prefix, e.g. <SF424B:ApplicantOrganizationName>...</SF424B:ApplicantOrganizationName>.
    // (Cross-checked against a real generated SF-424 GrantApplication.xml sample, which
    // confirmed the same convention: prefix = the form's short_form_name/root_namespace_prefix.)
    //   title                  -> SF424B:RepresentativeTitle (via authorized_representative_wrapper)
    //   applicant_organization -> SF424B:ApplicantOrganizationName
    assertXmlContains(contents, [
      `<SF424B:RepresentativeName>${SF424B_ZIP_EXPECTED_DATA.representative_name}</SF424B:RepresentativeName>`,
      `<SF424B:RepresentativeTitle>${SF424B_ZIP_EXPECTED_DATA.title}</SF424B:RepresentativeTitle>`,
      `<SF424B:ApplicantOrganizationName>${SF424B_ZIP_EXPECTED_DATA.applicant_organization}</SF424B:ApplicantOrganizationName>`,
      `<SF424B:SubmittedDate>${SF424B_ZIP_EXPECTED_DATA.SubmittedDate}</SF424B:SubmittedDate>`,
    ]);
  },
);
