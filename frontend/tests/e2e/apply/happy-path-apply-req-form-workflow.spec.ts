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
import { performStagingLogin } from "tests/e2e/utils/perform-login-utils";

const { targetEnv } = playwrightEnv;
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
    await page.goto("/", { waitUntil: "domcontentloaded" });
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
    await page.goto("/", { waitUntil: "domcontentloaded" });
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

  // Step 3: Navigate to opportunity page
  // console.log("Step 3: Navigating to opportunity page...");
  await page.goto(OPPORTUNITY_URL, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(3000); // Wait for page to fully load

  // console.log("✓ Opportunity page loaded!");

  // Step 4: Click "Start new application" button
  // console.log("Step 4: Clicking 'Start new application' button...");
  const startAppButton = page.getByRole("button", {
    name: /start.*application/i,
  });
  await startAppButton.waitFor({ state: "visible", timeout: 15000 });
  await startAppButton.click();
  // console.log("Button clicked");

  // Step 5: Wait for the Start Application modal to appear
  // console.log("Step 5: Waiting for Start Application modal...");

  // Wait for the select element inside the modal to be visible
  const modal = page.locator(
    '[role="dialog"].is-visible, #start-application.is-visible',
  );
  await expect(modal.locator("select")).toBeVisible({ timeout: 15000 });
  // const modalHtml = await modal.innerHTML();
  // console.log("[DEBUG] Modal HTML:\n", modalHtml);
  // console.log("✓ Modal appeared!");

  // Step 6: Fill all required fields in Start Application modal
  // console.log("Step 6: Filling required fields in Start Application modal...");
  // Select 'Sally's Soup Emporium' for Who's applying
  // Use the existing modal locator from earlier in the test
  // ...existing code...

  // 4. Select applicant org inside the modal (avoids test user dropdown on page)
  // console.log("Step 6: Filling application details...");

  // Select applicant organization (should pre-select if user has only one org)
  const orgSelect = modal.locator(
    'select[name*="applicant"], select:nth-of-type(1)',
  );
  const orgSelectCount = await orgSelect.count();
  // console.log(`  Found ${orgSelectCount} organization selects`);

  if (orgSelectCount > 0) {
    await orgSelect.first().waitFor({ state: "visible", timeout: 5000 });
    // Get available options
    const options = await orgSelect.first().locator("option").allTextContents();
    // console.log(`  Available organizations: ${options.join(", ")}`);

    // Select "Sally's Soup Emporium" or the first available option
    const sallysOption = options.find(
      (opt) => opt.includes("Sally") || opt.includes("Soup"),
    );
    if (sallysOption) {
      await orgSelect.first().selectOption({ label: sallysOption });
      // console.log(`  ✓ Selected: ${sallysOption}`);
    }
  }

  // Enter application name
  const nameInput = modal.locator(
    'input[name*="name"], input[placeholder*="application"], input[type="text"]:nth-of-type(1)',
  );
  if ((await nameInput.count()) > 0) {
    await nameInput.first().waitFor({ state: "visible", timeout: 5000 });
    const uniqueAppName = `TEST-APPLY-ORG-IND-APP${Date.now()}`;
    await nameInput.first().fill(uniqueAppName);
    // console.log(`  ✓ Application name entered: ${uniqueAppName}`);
  }

  // Fill 'Name of this application'

  // Step 7: Click Create Application button
  // console.log("Step 7: Clicking Create Application button...");
  const createButton = modal.locator('button:has-text("Create")');
  if ((await createButton.count()) === 0) {
    // Fallback: look for primary button
    const anyCreateBtn = page
      .getByRole("button")
      .filter({ hasText: /Create|Submit|Start|Next/ });
    await anyCreateBtn.first().click();
  } else {
    await createButton.first().click();
  }
  await page.waitForTimeout(3000);

  // Continue workflow after clicking the button
  // console.log("Step 8: Waiting for application page...");
  await page.waitForURL(/\/applications\/[a-f0-9-]+/, { timeout: 30000 });
  // const appUrl = page.url();
  // console.log(`✓ Application created: ${appUrl}`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);

  // Step 9: Verify we're on the application page
  // console.log("Step 9: Verifying application page loaded...");
  const mainContent = page.locator("main");
  await expect(mainContent).toBeVisible();

  // Look for the required forms section
  const requiredFormsHeading = page.locator(
    "text=/Required Forms/i, text=/forms required/i",
  );
  if ((await requiredFormsHeading.count()) > 0) {
    // console.log("✓ Application page loaded with forms section");
  }

  // Step 10: Click on SF-424B form to fill it
  // console.log("Step 10: Opening SF-424B form...");
  const sf424bLink = page.locator("a, button").filter({
    hasText: /SF-424B|Assurances for Non-Construction Programs/i,
  });

  if ((await sf424bLink.count()) > 0) {
    await sf424bLink.first().click();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    // console.log("✓ SF-424B form page loaded");

    // Step 11: Fill SF-424B form fields
    // console.log("Step 11: Filling SF-424B form...");
    // Log the SF-424B form section HTML
    const formSection = page.locator(
      'form, [data-testid*="sf-424b"], section:has-text("SF-424B")',
    );
    if ((await formSection.count()) > 0) {
      // const formHtml = await formSection.first().innerHTML();
      // console.log("[DEBUG] SF-424B form HTML:\n", formHtml);
    } else {
      // console.log("[DEBUG] SF-424B form section not found");
    }

    // Scroll to find form fields
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(5000);

    // Find and fill the Title field
    // Try multiple strategies to find the Title field
    let titleFieldFilled = false;
    // 1. Try input[name*="title"]
    const titleInputs = page.locator(
      'input[name*="title" i], input[placeholder*="title" i]',
    );
    const titleCount = await titleInputs.count();
    // console.log(`[DEBUG] Found ${titleCount} title input(s)`);
    for (let i = 0; i < titleCount; i++) {
      // const inputType = await titleInputs.nth(i).getAttribute('type');
      // const inputName = await titleInputs.nth(i).getAttribute('name'); // eslint-disable-line @typescript-eslint/no-unused-vars
      // const inputPlaceholder = await titleInputs.nth(i).getAttribute('placeholder'); // eslint-disable-line @typescript-eslint/no-unused-vars
      // console.log(`[DEBUG] Title input #${i}: type=${inputType}, name=${inputName}, placeholder=${inputPlaceholder}`);
    }
    if (titleCount > 0) {
      const titleField = titleInputs.first();
      await titleField.waitFor({ state: "visible", timeout: 3000 });
      await titleField.fill("TESTER");
      titleFieldFilled = true;
      // console.log("  ✓ Title field filled");
    }
    // 2. Fallback: Try label-based locator if not filled
    if (!titleFieldFilled) {
      try {
        const titleLabelInput = page.getByLabel(/title/i).first();
        await titleLabelInput.waitFor({ state: "visible", timeout: 3000 });
        await titleLabelInput.fill("TESTER");
        titleFieldFilled = true;
        // console.log("  ✓ Title field filled via label");
      } catch (err) {
        // console.log("[DEBUG] Could not find title field via label.");
      }
    }
    // 3. If still not filled, print form HTML for debug
    if (!titleFieldFilled) {
      // const formHtml = await formSection.first().innerHTML(); // eslint-disable-line @typescript-eslint/no-unused-vars
      // console.log("[DEBUG] SF-424B form HTML for title field fallback:\n", formHtml);
      throw new Error("Could not fill SF-424B Title field");
    }

    // Scroll down to find Applicant Organization field
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(5000);

    // Find and fill Applicant Organization
    const orgInputs = page.locator(
      'input[name*="applicant" i], input[name*="organization" i]',
    );
    const orgCount = await orgInputs.count();
    // console.log(`[DEBUG] Found ${orgCount} organization input(s)`);
    for (let i = 0; i < orgCount; i++) {
      // const inputType = await orgInputs.nth(i).getAttribute('type'); // eslint-disable-line @typescript-eslint/no-unused-vars
      // const inputName = await orgInputs.nth(i).getAttribute('name'); // eslint-disable-line @typescript-eslint/no-unused-vars
      // const inputPlaceholder = await orgInputs.nth(i).getAttribute('placeholder'); // eslint-disable-line @typescript-eslint/no-unused-vars
      // console.log(`[DEBUG] Org input #${i}: type=${inputType ?? ""}, name=${inputName ?? ""}, placeholder=${inputPlaceholder ?? ""}`);
    }
    if (orgCount > 0) {
      const orgField = orgInputs.first();
      await orgField.fill("Sally's Soup Emporium");
      // console.log("  ✓ Organization field filled");
    }

    // Step 12: Save the form
    // console.log("Step 12: Saving SF-424B form...");
    const saveButton = page.getByRole("button", { name: /save/i }).first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await page.waitForTimeout(2000);
      // console.log("✓ Form saved");
      // Verify success and no error messages
      await expect(page.getByText(/form was saved/i)).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText(/no errors were detected/i)).toBeVisible({
        timeout: 10000,
      });
      // console.log("✓ 'Form was saved' and 'No errors were detected.' messages are visible");
    }

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
    await expect(sfLllRow).toBeVisible({ timeout: 10000 });
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
      await noLabelLocator.first().click();
      // console.log("[DEBUG] 'No' label clicked for SF-LLL row.");
    } else {
      // Fallback: try selector from debug info
      const fallbackLabel = sfLllRow.locator("label", { hasText: /^No$/i });
      if ((await fallbackLabel.count()) > 0) {
        await fallbackLabel.first().scrollIntoViewIfNeeded();
        await expect(fallbackLabel.first()).toBeVisible({ timeout: 5000 });
        await fallbackLabel.first().click();
        // console.log("[DEBUG] Fallback 'No' label clicked for SF-LLL row.");
      } else {
        throw new Error("Could not find 'No' label for SF-LLL row");
      }
    }

    // Only select 'No' radio button under 'Submit with application' for SF-LLL
    // Do not fill or open SF-LLL form

    // Step 13: Submit the application
    // console.log("Step 13: Submitting the application...");
    const submitAppButton = page.getByRole("button", {
      name: /submit application/i,
    });
    await submitAppButton.click();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5000);

    // Debug: print page HTML after submission
    // const postSubmitHtml = await page.content(); // eslint-disable-line @typescript-eslint/no-unused-vars
    // console.log("[DEBUG] Page HTML after submitting application:\n", postSubmitHtml);

    // Step 14: Success message shows up with application ID
    const successHeading = page.getByText(
      /your application has been submitted/i,
    );
    await expect(successHeading).toBeVisible();
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
