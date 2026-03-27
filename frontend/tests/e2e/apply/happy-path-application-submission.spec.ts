import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import {
  fillForm,
  verifyFormLinkVisible,
} from "tests/e2e/utils/forms/general-forms-filling";
import { selectFormInclusionOption } from "tests/e2e/utils/forms/select-form-inclusion-utils";
import {
  verifyFormStatusAfterSave,
  verifyFormStatusOnApplication,
} from "tests/e2e/utils/forms/verify-form-status-utils";
import { submitApplicationAndVerify } from "tests/e2e/utils/submit-application-utils";

import {
  SF424B_FORM_CONFIG,
  SF424B_FORM_MATCHER,
} from "./fixtures/sf424b-field-definitions";
import { sf424BHappyPathTestData } from "./fixtures/sf424b-fill-data";

const { APPLY, SMOKE, GRANTEE } = VALID_TAGS;

const { testOrgLabel, targetEnv } = playwrightEnv;
const OPPORTUNITY_ID = "f7a1c2b3-4d5e-6789-8abc-1234567890ab"; // TEST-APPLY-ORG-IND-ON01
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
  "Application submission happy path - application with required SF424B and unsubmitted conditional SFLLL",
  { tag: [SMOKE, GRANTEE, APPLY] },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo,
  ) => {
    test.setTimeout(300_000); // 5 min timeout

    const isMobile = testInfo.project.name.match(/[Mm]obile/);

    await authenticateE2eUser(page, context, !!isMobile);

    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
    const applicationUrl = page.url();

    await verifyFormLinkVisible(page, SF424B_FORM_MATCHER);

    // Fill and save, stay on form page to verify save success
    await fillForm(
      testInfo,
      page,
      SF424B_FORM_CONFIG,
      sf424BHappyPathTestData(testOrgLabel),
      false,
    );

    // Verify save success alert on form page
    await verifyFormStatusAfterSave(page, "complete");

    // On application page — verify form row shows "No issues detected"
    await verifyFormStatusOnApplication(
      page,
      "complete",
      "SF-424B",
      applicationUrl,
    );

    // Extra wait for page to fully render forms table after navigation
    await page.waitForTimeout(10000);

    // Select 'No' for including SF-LLL form in submission
    await selectFormInclusionOption(
      page,
      "Disclosure of Lobbying Activities (SF-LLL)",
      "No",
    );

    // Submit the application and verify success
    await submitApplicationAndVerify(page, "success");
  },
);
