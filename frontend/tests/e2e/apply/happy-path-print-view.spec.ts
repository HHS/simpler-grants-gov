/**
 * @feature Apply - Print View Authentication
 * @featureFile frontend/tests/e2e/apply/features/happy-path-forms.feature
 * @scenario Application print view accessible via session JWT and renders filled field values
 */

import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import { fillForm } from "tests/e2e/utils/forms/general-forms-filling";

import { selectFormInclusionOption } from "tests/e2e/utils/forms/select-form-inclusion-utils";
import { submitApplicationAndVerify } from "tests/e2e/utils/submit-application-utils";

import { SF424B_FORM_CONFIG } from "./fixtures/sf424b-field-definitions";
import { sf424BHappyPathTestData } from "./fixtures/sf424b-fill-data";

const { APPLY } = VALID_TAGS;
const { testOrgLabel, targetEnv, baseUrl } = playwrightEnv;

// SF-424B opportunity (TEST-APPLY-ORG-IND-ON01) — same as happy-path-sf424b.spec.ts
const OPPORTUNITY_ID = "f7a1c2b3-4d5e-6789-8abc-1234567890ab";
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;

// Skip non-Chrome browsers in staging
test.beforeEach(({ page: _ }, testInfo) => {
  if (targetEnv === "staging") {
    test.skip(
      testInfo.project.name !== "Chrome",
      "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
    );
  }
});

test(
  "Print view renders filled form data when accessed via session JWT (no internal token)",
  { tag: [APPLY] },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo,
  ) => {
    test.setTimeout(300_000); // 5 min timeout

    const fillData = sf424BHappyPathTestData(testOrgLabel);

    // Given the user is logged in
    await authenticateE2eUser(page, context, false);

    // Create a new application
    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
    const applicationUrl = page.url();

    // Fill the SF-424B form with known values and save, returning to application page
    await fillForm(testInfo, page, SF424B_FORM_CONFIG, fillData, true);

    // Navigate back to the application page to submit
    await page.goto(applicationUrl, { waitUntil: "domcontentloaded" });

    // Select 'No' for the conditional SF-LLL form before submitting
    await selectFormInclusionOption(
      page,
      "Disclosure of Lobbying Activities (SF-LLL)",
      "No",
    );

    // Submit the application and verify success
    await submitApplicationAndVerify(page, "success");

    // Extract applicationId from the current page URL after submission
    // The URL at this point is still the application page: /workspace/applications/{applicationId}
    const appPageUrl = page.url();
    const appIdMatch = appPageUrl.match(/\/applications\/([a-f0-9-]+)/);
    if (!appIdMatch) {
      throw new Error(`Could not extract applicationId from URL: ${appPageUrl}`);
    }
    const applicationId = appIdMatch[1];

    // Find the SF-424B form link to get the appFormId
    // Form links have pattern /workspace/applications/{applicationId}/form/{appFormId}
    const formLink = page
      .locator('a[href*="/applications/"][href*="/form/"]')
      .filter({ hasText: /SF-424B|Non-Construction/i })
      .first();
    await formLink.waitFor({ state: "visible", timeout: 30_000 });
    const formHref = await formLink.getAttribute("href");
    const formHrefMatch = formHref?.match(/\/form\/([a-f0-9-]+)/);
    if (!formHrefMatch) {
      throw new Error(`Could not extract appFormId from form link: ${formHref}`);
    }
    const appFormId = formHrefMatch[1];

    // Navigate to the print view URL without an internal token header (session JWT path)
    const printUrl = `${baseUrl}/en/print/application/${applicationId}/form/${appFormId}`;
    await page.goto(printUrl, { waitUntil: "domcontentloaded" });

    // The print page should render successfully — not redirect to /unauthenticated or show an error
    await expect(page).not.toHaveURL(/\/unauthenticated/);
    await expect(page).not.toHaveURL(/\/error/);

    // The page heading should show the form name
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible({ timeout: 30_000 });
    await expect(heading).not.toBeEmpty();

    // The print view should render the filled field values
    await expect(page.getByText(fillData.title)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(fillData.organization)).toBeVisible({
      timeout: 15_000,
    });
  },
);
