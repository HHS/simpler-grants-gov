/**
 * @feature Apply - Submission zip content verification
 * @scenario Verify that the downloaded submission zip contains a valid SF-424B PDF
 *           and GrantApplication.xml with data matching what was filled in the form
 *
 * This test navigates to a previously-submitted staging application, downloads the
 * submission zip, unzips it in memory, and asserts:
 *   1. SF424B.pdf exists and its text contains the fill-data values
 *   2. GrantApplication.xml exists and contains the expected field values
 *
 * The staging application used here (d1b64ad4-...) must already be in "Submitted" state.
 * It was created by the standard SF-424B happy-path test with org label
 * "Automatic staging Organization for UEI AUTOHQDCCHBY".
 */

import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import {
  assertPdfContains,
  assertXmlContains,
  downloadAndUnzipSubmission,
} from "tests/e2e/utils/submission-zip-utils";

import { sf424BHappyPathTestData } from "./fixtures/sf424b-fill-data";

const { APPLY } = VALID_TAGS;
const { targetEnv, baseUrl, testOrgLabel } = playwrightEnv;

// The submitted staging application to verify against.
// Must be an application that was submitted with SF-424B fill data matching sf424BHappyPathTestData.
// For local runs a submitted application ID must be provided via LOCAL_SUBMITTED_APP_ID env var.
const SUBMITTED_APP_ID =
  targetEnv === "staging"
    ? "d1b64ad4-6ae8-45c8-bb59-eeaeef82e3eb"
    : process.env.LOCAL_SUBMITTED_APP_ID;

// The short_form_name used by the backend when naming the PDF in the zip
const SF424B_PDF_NAME = "SF424B.pdf";

// Skip non-Chrome browsers in staging
test.beforeEach(({ page: _ }, testInfo) => {
  if (targetEnv === "staging") {
    test.skip(
      testInfo.project.name !== "Chrome",
      "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
    );
  }
  if (!SUBMITTED_APP_ID) {
    test.skip(true, "No submitted application ID configured for this environment");
  }
});

test(
  "Submission zip contains SF424B PDF and XML with correct form data",
  { tag: [APPLY] },
  async ({ page, context }: { page: Page; context: BrowserContext }) => {
    test.setTimeout(300_000); // 5 min — zip generation can be slow

    // Log in
    await authenticateE2eUser(page, context, false);

    // Navigate directly to the submitted application page
    await page.goto(`${baseUrl}/workspace/applications/${SUBMITTED_APP_ID}`, {
      waitUntil: "domcontentloaded",
    });

    // Confirm the application is in "Submitted" state
    await expect(
      page.getByRole("heading", { name: /your application has been submitted/i }),
    ).toBeVisible({ timeout: 30_000 });

    // Wait for the download button to become enabled (zip may still be generating)
    const downloadButton = page.getByTestId("application-submission-download");
    await expect(downloadButton).toBeVisible({ timeout: 30_000 });
    await expect(downloadButton).toBeEnabled({ timeout: 120_000 });

    // Download and unzip
    const contents = await downloadAndUnzipSubmission(page);

    // --- Verify SF424B.pdf ---
    const fillData = sf424BHappyPathTestData(testOrgLabel);
    await assertPdfContains(contents, SF424B_PDF_NAME, [
      fillData.title,        // "TESTER" — title/authorized representative title
      fillData.organization, // org label — applicant organization name
    ]);

    // --- Verify GrantApplication.xml ---
    // The XML uses ApplicantOrganizationName and RepresentativeTitle elements
    assertXmlContains(contents, [
      `<ApplicantOrganizationName>${fillData.organization}</ApplicantOrganizationName>`,
      `<RepresentativeTitle>${fillData.title}</RepresentativeTitle>`,
    ]);
  },
);
