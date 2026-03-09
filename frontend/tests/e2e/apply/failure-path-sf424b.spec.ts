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
  getSf424bFormLink,
  verifySf424bFormVisible,
} from "tests/e2e/utils/forms/fill-sf424b-form-utils";
import { saveForm } from "tests/e2e/utils/forms/save-form-utils";
import { verifyFormStatusAfterSave } from "tests/e2e/utils/forms/verify-form-status-utils";
import { performStagingLogin } from "tests/e2e/utils/perform-login-utils";

const { baseUrl, targetEnv, testOrgLabel } = playwrightEnv;
const OPPORTUNITY_ID = "f7a1c2b3-4d5e-6789-8abc-1234567890ab"; // TEST-APPLY-ORG-IND-ON01
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;

const sf424bErrors = [
  { fieldId: "title", message: "Title is required" },
  {
    fieldId: "applicant_organization",
    message: "Applicant Organization is required",
  },
];

test.only("SF-424B error validation - required fields and inline errors", async ({
  page,
  context,
}: { page: Page; context: BrowserContext }, testInfo: TestInfo) => {
  test.setTimeout(300_000); // 5 min timeout

  const isMobile = testInfo.project.name.match(/[Mm]obile/);

  // Navigate to home page
  if (targetEnv === "local") {
    await createSpoofedSessionCookie(context);
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
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

  if (isMobile) {
    await openMobileNav(page);
  }

  await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
  const applicationUrl = page.url();

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

    // Do not enter anything and click save
    await saveForm(page); // expect validation errors

    // Checks error alert list at top of form page
    // Scrolls down and checks inline field errors on form page
    // Navigates to application landing page
    // Scrolls down and checks "Some issues found" in form row
    await verifyFormStatusAfterSave(page, "incomplete", "SF-424B", applicationUrl, sf424bErrors);
  }
});
