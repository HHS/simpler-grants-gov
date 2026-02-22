import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { fillSf424bForm } from "../utils/forms/fill-sf424b-form-utils";
import { saveForm } from "../utils/forms/save-form-utils";
import { createApplication } from "../utils/create-application-utils";
import { createSpoofedSessionCookie } from "tests/e2e/loginUtils";
import playwrightEnv from "tests/e2e/playwright-env";
import { openMobileNav } from "tests/e2e/playwrightUtils";
import { performStagingLogin } from "tests/e2e/utils/perform-login-utils";

const { baseUrl, targetEnv } = playwrightEnv;
const OPPORTUNITY_ID = "f7a1c2b3-4d5e-6789-8abc-1234567890ab"; // TEST-BR-8037-OU-ON01
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;

test("happy path apply workflow - Organization User (SF424B and SF-LLL)", async ({
  page,
  context,
}: { page: Page; context: BrowserContext }, testInfo: TestInfo) => {
  test.setTimeout(300_000); // 5 min timeout

  const isMobile = testInfo.project.name.match(/[Mm]obile/);

  // Step 1: Navigate to home page
  // console.log("Step 1: Navigating to home page to establish session...");
  if (targetEnv === "local") {
    // Use test-user spoofing
    await createSpoofedSessionCookie(context);
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    // console.log("✓ Local test user session established");

    // Fallback: use test-user dropdown if present
    const testUserSelect = page.locator(
      'select[id*="test-user"], select[aria-label*="test-user"], combobox[aria-label*="test"]',
    );
    if ((await testUserSelect.count()) > 0) {
      await testUserSelect
        .first()
        .waitFor({ state: "visible", timeout: 10_000 });
      await testUserSelect.first().selectOption("many_app_user");
      await page.waitForTimeout(2000);
      // console.log("✓ Test user selected via dropdown fallback");
    } else {
      // console.log("ℹ No test user dropdown found - proceeding with cookie session");
    }
  } else if (targetEnv === "staging") {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const signOutButton = await performStagingLogin(page, !!isMobile);
    if (!signOutButton) {
      throw new Error("signOutButton was not found after performStagingLogin");
    }
    await expect(signOutButton).toHaveCount(1, { timeout: 120_000 });
    // console.log("✓ Staging user logged in");
  } else {
    throw new Error(`Unsupported env ${targetEnv}`);
  }

  // ---------------- Step 2: Open mobile nav if needed ----------------
  if (isMobile) {
    await openMobileNav(page);
  }


  // Call reusable create application function from utils
  await createApplication(
    page as Page,
    OPPORTUNITY_URL,
    "Sally",
    "Automatic staging Organization for UEI AUTOHQDCCHBY"
  );

  // Step 10: Click on SF-424B form to fill it
  // console.log("Step 10: Opening SF-424B form...");
  const sf424bLink = page.locator("a, button").filter({
    hasText: /SF-424B|Assurances for Non-Construction Programs/i,
  });

  if ((await sf424bLink.count()) > 0) {
    await sf424bLink.first().click();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    // Fill SF-424B form fields using helper
    await fillSf424bForm(page, "TESTER", "Sally's Soup Emporium");
    // Save the form using helper
    await saveForm(page);

    // After saving, verify 'No issues detected' under the form name on the application landing page
    await page.goBack();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(10000);
    // const landingHtml = await page.content(); // eslint-disable-line @typescript-eslint/no-unused-vars

    // Scroll to find status message
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(5000);
    // console.log("[DEBUG] Application landing page HTML after saving SF-424B:\n", landingHtml);

    // Use a global text locator for the status message
    await expect(page.getByText(/no issues detected/i)).toBeVisible({
      timeout: 10000,
    });
    // console.log("✓ 'No issues detected' is visible for SF-424B form");
    await page.waitForTimeout(10000);

    // Look for 'No' radio button in the same row as 'Disclosure of Lobbying Activities (SF-LLL)'
    const sfLllRow = page.locator("tr", {
      hasText: /Disclosure of Lobbying Activities \(SF-LLL\)/i,
    });
    await expect(sfLllRow).toBeVisible({ timeout: 12000 });
    // Print SF-LLL row HTML for debug
    // const sfLllRowHtml = await sfLllRow.innerHTML(); // eslint-disable-line @typescript-eslint/no-unused-vars
    // console.log("[DEBUG] SF-LLL row HTML:\n", sfLllRowHtml);
    // Find all radio buttons in this row
    const radioInputs = sfLllRow.locator('input[type="radio"]');
    const radioCount = await radioInputs.count();
    // After clicking 'No', print checked state for all radios
    for (let i = 0; i < radioCount; i++) {
      // const radio = radioInputs.nth(i); // eslint-disable-line @typescript-eslint/no-unused-vars
      // const label = await radio.evaluate(node => {
      //   if (node instanceof HTMLInputElement && node.labels && node.labels.length > 0) {
      //     return node.labels[0].textContent || '';
      //   }
      //   return '';
      // }); // eslint-disable-line @typescript-eslint/no-unused-vars
      // const checked = await radio.isChecked(); // eslint-disable-line @typescript-eslint/no-unused-vars
      // console.log(`[DEBUG] Radio #${i} label='${label}' checked=${checked}`);
    }
    // Directly click the 'No' label in the SF-LLL row
    const noLabelLocator = sfLllRow.locator("label.usa-radio__label", {
      hasText: /^No$/i,
    });
    const noLabelCount = await noLabelLocator.count();
    if (noLabelCount > 0) {
      await noLabelLocator.first().scrollIntoViewIfNeeded();
      await expect(noLabelLocator.first()).toBeVisible({ timeout: 5000 });
      const includeFormResponsePromise = page.waitForResponse((response) => {
        const url = response.url();
        return (
          response.request().method() === "PUT" &&
          url.includes("/api/applications/") &&
          url.includes("/forms/")
        );
      });
      await noLabelLocator.first().click();
      const includeFormResponse = await includeFormResponsePromise;
      if (includeFormResponse.status() !== 200) {
        throw new Error(
          `Include-in-submission update returned status ${includeFormResponse.status()}`,
        );
      }
      // console.log("[DEBUG] 'No' label clicked for SF-LLL row.");
    } else {
      // Fallback: try selector from debug info
      const fallbackLabel = sfLllRow.locator("label", { hasText: /^No$/i });
      if ((await fallbackLabel.count()) > 0) {
        await fallbackLabel.first().scrollIntoViewIfNeeded();
        await expect(fallbackLabel.first()).toBeVisible({ timeout: 10000 });
        const includeFormResponsePromise = page.waitForResponse((response) => {
          const url = response.url();
          return (
            response.request().method() === "PUT" &&
            url.includes("/api/applications/") &&
            url.includes("/forms/")
          );
        });
        await fallbackLabel.first().click();
        const includeFormResponse = await includeFormResponsePromise;
        if (includeFormResponse.status() !== 200) {
          throw new Error(
            `Include-in-submission update returned status ${includeFormResponse.status()}`,
          );
        }
        // console.log("[DEBUG] Fallback 'No' label clicked for SF-LLL row.");
      } else {
        throw new Error("Could not find 'No' label for SF-LLL row");
      }
    }

    const noRadio = sfLllRow.getByRole("radio", { name: /^No$/i });
    await expect(noRadio).toBeChecked({ timeout: 10000 });

    // Only select 'No' radio button under 'Submit with application' for SF-LLL
    // Do not fill or open SF-LLL form

    // Step 13: Submit the application
    // console.log("Step 13: Submitting the application...");
    const submitAppButton = page.getByRole("button", {
      name: /submit application/i,
    });
    await submitAppButton.waitFor({ state: "visible", timeout: 15000 });
    const submitResponsePromise = page.waitForResponse((response) => {
      const url = response.url();
      return (
        response.request().method() === "POST" &&
        url.includes("/api/applications/") &&
        url.includes("/submit")
      );
    });
    await submitAppButton.click();
    const submitResponse = await submitResponsePromise;
    if (submitResponse.status() !== 200) {
      throw new Error(
        `Application submission returned status ${submitResponse.status()}`,
      );
    }
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5000);

    // Debug: print page HTML after submission
    // const postSubmitHtml = await page.content(); // eslint-disable-line @typescript-eslint/no-unused-vars
    // console.log("[DEBUG] Page HTML after submitting application:\n", postSubmitHtml);

    // Step 14: Success message shows up with application ID
    const successHeading = page.getByRole("heading", {
      name: /your application has been submitted/i,
    });
    const validationHeading = page.getByRole("heading", {
      name: /your application could not be submitted/i,
    });
    await Promise.race([
      successHeading.waitFor({ state: "visible", timeout: 120000 }),
      validationHeading.waitFor({ state: "visible", timeout: 120000 }),
    ]);
    if (await validationHeading.isVisible()) {
      throw new Error(
        "Application submission validation errors were displayed after submit",
      );
    }
    await expect(successHeading).toBeVisible({ timeout: 120000 });
    await page.waitForTimeout(5000);

    // Find the Application ID element more specifically
    const appIdMessages = await page.locator("div.usa-summary-box__text").all();
    let appIdMessage = null;
    for (const el of appIdMessages) {
      const text = await el.textContent();
      if (
        /Application ID #: [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(
          text || "",
        )
      ) {
        appIdMessage = el;
        break;
      }
    }
    if (!appIdMessage) {
      throw new Error("Could not find Application ID element");
    }
    await expect(appIdMessage).toBeVisible();
    // Verify application ID format (UUID)
    const appIdText = await appIdMessage.textContent();
    expect(appIdText).toMatch(
      /Application ID #: [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
  }

  // console.log("\n✓ Test completed successfully!");
  // console.log(`Final URL: ${page.url()}`);
});