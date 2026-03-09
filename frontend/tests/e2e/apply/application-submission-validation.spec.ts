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
import { submitApplicationAndVerify, verifyApplicationStatusSubmitted } from "tests/e2e/utils/submit-application-utils";

const { baseUrl, targetEnv, testOrgLabel } = playwrightEnv;
const OPPORTUNITY_ID = "f7a1c2b3-4d5e-6789-8abc-1234567890ab"; // TEST-APPLY-ORG-IND-ON01
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;

test("Application submission validation - required and conditional forms", async ({
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

  // Create application
  await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
  const applicationUrl = page.url();

  // Verify SF-424B form is visible
  await verifySf424bFormVisible(page);

  // Use dynamic locator for Submit application button
  const submitButton = page.locator(
    '[data-testid*="information-card" i] button, div[class*="information-card" i] button, section[class*="information-card" i] button'
  ).filter({ hasText: /submit/i });
  await submitButton.first().click();

  // Use dynamic locator for error message
  const errorMessage = page.locator('div, section, [role="alert"]').filter({ hasText: /your application could not be submitted/i });
  await expect(errorMessage).toBeVisible();

  // Use dynamic locator for alert heading
  const alertHeading = page.locator('[data-testid*="alert" i], [role="alert"]').locator('h1, h2, h3, h4, h5, h6');
  await expect(alertHeading).toContainText('Your application could not be submitted');

  // Use dynamic locator for SF-424B incomplete message
  const sf424bIncomplete = page.locator('div, section, [role="alert"]').filter({ hasText: /assurances for non-construction programs.*incomplete/i });
  await expect(sf424bIncomplete).toBeVisible();

  // Use dynamic locator for alert list
  const alertList = page.locator('[data-testid*="alert" i], [role="alert"]').locator('ul, ol');
  await expect(alertList).toContainText('Assurances for Non-Construction Programs (SF-424B) is incomplete. Answer all required questions to submit.');

  // Use dynamic locator for SF-LLL incomplete message
  const sflllIncomplete = page.locator('div, section, [role="alert"]').filter({ hasText: /disclosure of lobbying activities.*select yes or no/i });
  await expect(sflllIncomplete).toBeVisible();
  await expect(alertList).toContainText('Disclosure of Lobbying Activities (SF-LLL) Select Yes or No for "Submit with application?" column in Conditionally-Required Forms section.');

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
    await saveForm(page, true); // expect validation errors
    await expect(page.getByText("Title is required")).toBeVisible();
    await expect(page.getByText("Applicant Organization is required")).toBeVisible();

    // Fill SF-424B form fields using helper
    await fillSf424bForm(page, "TESTER", testOrgLabel);

    // Save the form using helper
    await saveForm(page);

    // Verify form status after save
    await verifyFormStatusAfterSave(page, "complete", "SF-424B", applicationUrl);

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

// Post submission
   await page.getByTestId('information-card').getByTestId('button').click();
  // Use utility for status check
  await verifyApplicationStatusSubmitted(page);
  // Use dynamic locator for Application History heading
  const historyHeading = page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: /application history/i });
  await expect(historyHeading).toBeVisible();

  // Dynamic locator for history entries
  const historyEntries = [
    { text: 'Application created' },
    { text: 'Organization Added' },
    { text: 'Form updated: Assurances for Non-Construction Programs (SF-424B)' },
    { text: 'Application submission failed' },
    { text: 'Form updated: Assurances for Non-Construction Programs (SF-424B)' },
    { text: 'Form updated: Disclosure of Lobbying Activities (SF-LLL)' },
    { text: 'Application submitted' },
  ];
  for (const entry of historyEntries) {
    const entryLocator = page.locator('[data-testid^="responsive-data-"]', { hasText: new RegExp(entry.text, 'i') });
    await expect(entryLocator).toBeVisible();
    await expect(entryLocator).toContainText(entry.text);
  }

  // --- Open the SF424B form again ---
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


  const titleField = page.getByTestId("title");
  const orgField = page.getByTestId("applicant_organization");

  // Verify values remain
  await expect(titleField).toHaveValue("Tester");
  await expect(orgField).toHaveValue(testOrgLabel);

  // Verify editing is disabled
  await expect(titleField).toBeDisabled();
  await expect(orgField).toBeDisabled();
  }
});
