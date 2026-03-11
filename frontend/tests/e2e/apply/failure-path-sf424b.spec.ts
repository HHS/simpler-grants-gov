import {
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import { SF424B_FORM_MATCHER } from "tests/e2e/utils/forms/fill-sf424b-form-utils";
import { openForm } from "tests/e2e/utils/forms/form-navigation-utils";
import { saveForm } from "tests/e2e/utils/forms/save-form-utils";
import { verifyFormStatusAfterSave } from "tests/e2e/utils/forms/verify-form-status-utils";

const { testOrgLabel } = playwrightEnv;
const OPPORTUNITY_ID = "f7a1c2b3-4d5e-6789-8abc-1234567890ab"; // TEST-APPLY-ORG-IND-ON01
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;

const sf424bErrors = [
  { fieldId: "title", message: "Title is required" },
  {
    fieldId: "applicant_organization",
    message: "Applicant Organization is required",
  },
];

test("SF-424B error validation - required fields and inline errors @auth", async ({
  page,
  context,
}: { page: Page; context: BrowserContext }, testInfo: TestInfo) => {
  test.setTimeout(300_000); // 5 min timeout

  const isMobile = testInfo.project.name.match(/[Mm]obile/);

  await authenticateE2eUser(page, context, !!isMobile);

  await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
  const applicationUrl = page.url();

  if (await openForm(page, SF424B_FORM_MATCHER)) {
    // Do not enter anything and click save
    await saveForm(page, true); // expect validation errors

    // Checks error alert list at top of form page
    // Scrolls down and checks inline field errors on form page
    // Navigates to application landing page
    // Scrolls down and checks "Some issues found" in form row
    await verifyFormStatusAfterSave(
      page,
      "incomplete",
      "SF-424B",
      applicationUrl,
      sf424bErrors,
    );
  }
});
