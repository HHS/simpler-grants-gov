import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import {
  fillSf424bForm,
  SF424B_FORM_MATCHER,
} from "tests/e2e/utils/forms/fill-sf424b-form-utils";
import { openForm } from "tests/e2e/utils/forms/form-navigation-utils";
import { saveForm } from "tests/e2e/utils/forms/save-form-utils";
import { selectFormInclusionOption } from "tests/e2e/utils/forms/select-form-inclusion-utils";
import { verifyFormStatusAfterSave } from "tests/e2e/utils/forms/verify-form-status-utils";
import { submitApplicationAndVerify } from "tests/e2e/utils/submit-application-utils";

const { testOrgLabel } = playwrightEnv;
const OPPORTUNITY_ID = "f7a1c2b3-4d5e-6789-8abc-1234567890ab"; // TEST-APPLY-ORG-IND-ON01
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;

// Added @auth tag to login-dependent tests so workflows can select them automatically.
test(
  "Application submission happy path - application with required SF424B and unsubmitted conditional SFLLL",
  { tag: "@auth" },
  async (
    { page, context }: { page: Page; context: BrowserContext },
    testInfo: TestInfo,
  ) => {
    test.setTimeout(300_000); // 5 min timeout

    const isMobile = testInfo.project.name.match(/[Mm]obile/);

    await authenticateE2eUser(page, context, !!isMobile);

    // Call reusable create application function from utils
    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
    const applicationUrl = page.url();

    if (!(await openForm(page, SF424B_FORM_MATCHER))) {
      throw new Error(
        "Could not find or open SF-424B form link on the application forms page",
      );
    }

    // Fill SF-424B form fields using helper
    await fillSf424bForm(page, "TESTER", testOrgLabel);

    // Save the form using helper
    await saveForm(page);

    // Verify form status after save
    await verifyFormStatusAfterSave(
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
    await submitApplicationAndVerify(page);
    // Application ID is now available in appId variable for further use if needed
  },
);
