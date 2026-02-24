import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { createSpoofedSessionCookie } from "tests/e2e/loginUtils";
import playwrightEnv from "tests/e2e/playwright-env";
import { openMobileNav } from "tests/e2e/playwrightUtils";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import {
  fillSf424bForm,
  getSf424bFormLink,
  verifySf424bFormVisible,
} from "tests/e2e/utils/forms/fill-sf424b-form-utils";
import { saveForm } from "tests/e2e/utils/forms/save-form-utils";
import { selectFormInclusionOption } from "tests/e2e/utils/forms/select-form-inclusion-utils";
import { verifyFormStatusAfterSave } from "tests/e2e/utils/forms/verify-form-status-utils";
import { performStagingLogin } from "tests/e2e/utils/perform-login-utils";
import { selectLocalTestUser } from "tests/e2e/utils/select-local-test-user-utils";
import { submitApplicationAndVerify } from "tests/e2e/utils/submit-application-utils";

const { baseUrl, targetEnv, localTestOrgLabel, stagingTestOrgLabel } =
  playwrightEnv;
const OPPORTUNITY_ID = "f7a1c2b3-4d5e-6789-8abc-1234567890ab"; // TEST-APPLY-ORG-IND-ON01
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;

test("happy path apply workflow - Organization User (SF424B and SF-LLL)", async ({
  page,
  context,
}: { page: Page; context: BrowserContext }, testInfo: TestInfo) => {
  test.setTimeout(300_000); // 5 min timeout

  const isMobile = testInfo.project.name.match(/[Mm]obile/);

  // Navigate to home page
  if (targetEnv === "local") {
    // Use test-user spoofing
    await createSpoofedSessionCookie(context);
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

    await selectLocalTestUser(page, "many_app_user");
  } else if (targetEnv === "staging") {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const signOutButton = await performStagingLogin(page, !!isMobile);
    if (!signOutButton) {
      throw new Error("signOutButton was not found after performStagingLogin");
    }
    await expect(signOutButton).toHaveCount(1, { timeout: 120_000 });
  } else {
    throw new Error(`Unsupported env ${targetEnv}`);
  }

  // Open mobile nav if needed
  if (isMobile) {
    await openMobileNav(page);
  }

  // Call reusable create application function from utils
  const orgLabel =
    targetEnv === "staging"
      ? stagingTestOrgLabel ||
        "Automatic staging Organization for UEI AUTOHQDCCHBY"
      : localTestOrgLabel || "Sally's Soup Emporium";

  await createApplication(page, OPPORTUNITY_URL, orgLabel);
  const applicationUrl = page.url();

  // Verify SF-424B form is visible on the application page
  await verifySf424bFormVisible(page);

  // Click on SF-424B form to fill it
  const sf424bLink = getSf424bFormLink(page);

  if ((await sf424bLink.count()) > 0) {
    await sf424bLink.first().waitFor({ state: "visible", timeout: 60000 });
    await Promise.all([
      page.waitForURL(/\/applications\/[a-f0-9-]+\/form\/[a-f0-9-]+/, {
        timeout: 30000,
      }),
      sf424bLink.first().click(),
    ]);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // Fill SF-424B form fields using helper
    await fillSf424bForm(page, "TESTER", orgLabel);

    // Save the form using helper
    await saveForm(page);

    // Verify form status after save
    await verifyFormStatusAfterSave(page, "SF-424B", applicationUrl);

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
  }
});
