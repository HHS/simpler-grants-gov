// Load environment variables explicitly before any other imports
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });

import { expect, test } from "@playwright/test";
import { createSpoofedSessionCookie } from "../loginUtils";
import { initializeSessionSecrets } from "../loginUtils";

test("happy path apply workflow - Organization User (SF424B and SF-LLL)", async ({ page, context }) => {
  // Set test timeout to 2 minutes to allow for Next.js compilation on first run
  test.setTimeout(120000);
  
  // Initialize session secrets from environment
  initializeSessionSecrets();
  
  const envBase = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL;
  const baseUrl = envBase && envBase.trim().length > 0 ? envBase : "http://localhost:3000";

  // Read opportunity ID from environment variable (.env.local)
  // Falls back to hardcoded ID if env var is not set
  const opportunityId =
    process.env.PLAYWRIGHT_BR8037_ORG_OPPORTUNITY_ID ||
    "e7349d47-4c62-41e8-a92d-a2f219ebaf7c";
  console.log(`ENV vars available: PLAYWRIGHT_BR8037_ORG_OPPORTUNITY_ID=${process.env.PLAYWRIGHT_BR8037_ORG_OPPORTUNITY_ID}`);
  console.log(`Using opportunity ID: ${opportunityId}`);

  // --- Setup: User is able to login with all roles needed ---
  // 1. Create spoofed session cookie to maintain authentication (no UI login)
  await createSpoofedSessionCookie(context);

  // Session cookie is scoped to localhost by createSpoofedSessionCookie

  // --- Login: User is logged in ---
  // 2. First navigate to home page to establish session with feature flag
  console.log(`Navigating to home page to establish session...`);
  await page.goto(`${baseUrl}/?_ff=authOn:true`, {
    timeout: 120000,
    waitUntil: "domcontentloaded",
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  console.log(`Session established, now navigating to opportunity page...`);
  
  // 3. Navigate to the opportunity page (don't wait for networkidle, just domcontentloaded)
  await page.goto(
    `${baseUrl}/opportunity/${opportunityId}?_ff=authOn:true`,
    { timeout: 180000, waitUntil: "domcontentloaded" }
  );
  console.log(`Opportunity page loaded!`);
  await page.waitForTimeout(3000); // Wait for page to fully stabilize and API calls to complete

  // --- Starting Application: User clicks "Start Application" ---
  // 3. Open the Start Application modal
  const startAppButton = page.getByRole("button", {
    name: /start.*application/i,
  });
  console.log(`Found start button, clicking...`);
  await startAppButton.waitFor({ state: "visible" });
  await startAppButton.click();
  console.log(`Button clicked, waiting for modal...`);

  // Wait for the modal to be attached to DOM (it should open automatically after button click)
  const startAppModal = page.locator('[role="dialog"]#start-application, [role="dialog"][id*="start-application"]').first();
  
  // Wait for modal to be attached and then wait for its content to be accessible
  await startAppModal.waitFor({ state: "attached", timeout: 10000 });
  console.log(`Modal is open!`);
  
  // Give modal time to animate in and become fully interactive
  await page.waitForTimeout(500);

  // --- Modal: "Start a new application" modal opens ---
  // --- Organization Selection: User selects "Sally's Soup Emporium" in "Who's applying" dropdown ---
  // 4. Select applicant org inside the modal (avoids test user dropdown on page)
  console.log(`Looking for "Who's applying?" dropdown...`);
  const whoApplyingSelect = startAppModal.locator('select[name*="applicant"], select[aria-label*="applying"]').first();
  try {
    await whoApplyingSelect.waitFor({ state: "attached", timeout: 5000 });
    console.log(`Found dropdown, selecting "Sally's Soup Emporium"...`);
    await whoApplyingSelect.selectOption({ label: "Sally's Soup Emporium" });
  } catch (err) {
    console.log(`First selector failed, trying fallback...`);
    const fallbackSelect = startAppModal.locator('select').first();
    await fallbackSelect.selectOption("Sally's Soup Emporium");
  }
  console.log(`Organization selected!`);

  // --- Application Name: User enters the application name ---
  // 5. Enter application name inside the modal
  console.log(`Looking for application name input...`);
  const appNameInput = startAppModal.locator('input[type="text"]').last(); // Use last text input in modal (should be the app name one)
  await appNameInput.waitFor({ state: "attached", timeout: 5000 });
  await appNameInput.fill("TEST-BR-8037-ORG-APP");
  console.log(`Application name entered: "TEST-BR-8037-ORG-APP"`);

  // --- Create Application: User clicks "Create Application" ---
  // 6. Click "Create Application" inside the modal
  console.log(`Looking for Create Application button...`);
  const createAppButton = startAppModal.getByRole("button", {
    name: /create application/i,
  });
  await createAppButton.waitFor({ state: "attached", timeout: 5000 });
  await createAppButton.click();
  console.log(`Create Application button clicked!`);

  // --- Application Created: Wait for navigation to application page ---
  console.log(`Waiting for navigation to /applications/ page...`);
  try {
    await page.waitForURL(/\/applications\//, { timeout: 15000 });
  } catch (err) {
    console.log(`Navigation timeout. Current URL: ${page.url()}`);
    console.log(`Error: ${err.message}`);
    throw err;
  }
  console.log(`Application created and navigated! Current URL: ${page.url()}`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1000);

  // --- Application Landing Page: Application landing page loads with navigation and forms list ---
  // 7. Verify application landing page loads with SF-424B form visible
  console.log(`Verifying application landing page loaded...`);
  // Wait for "Assurances for Non-Construction Programs (SF-424B)" form to appear in Required Forms
  const sf424bForm = page.getByRole("link", {
    name: /Assurances.*SF-424B/i,
  });
  await expect(sf424bForm).toBeVisible({ timeout: 10000 });
  console.log(`Application landing page verified with SF-424B form!`);

  // --- Completing Required Forms: User completes "Assurances for Non-Construction Programs (SF-424B)" ---
  // 8. Click on "Assurances for Non-Construction Programs (SF-424B)" form
  console.log(`Current page before clicking form: ${page.url()}`);
  console.log(`Clicking on SF-424B form link...`);
  
  // First verify the link is clickable
  await sf424bForm.waitFor({ state: "visible", timeout: 5000 });
  console.log(`SF-424B form link is visible, clicking...`);
  await sf424bForm.click();
  
  console.log(`Waiting for URL to change to form page...`);
  await page.waitForURL(/\/form\//, { timeout: 15000 });
  console.log(`Now on form page: ${page.url()}`);
  
  console.log(`Waiting for form page to fully load...`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(2000);
  
  console.log(`Looking for form inputs...`);
  // Debug: log all input labels
  const allLabels = await page.locator('label').allTextContents();
  console.log(`Available labels: ${allLabels.join(', ')}`);
  
  // Try to find any text input
  const allInputs = await page.locator('input[type="text"]').count();
  console.log(`Found ${allInputs} text inputs on page`);

  // 9. Fill in form details - Title and Organization
  console.log(`Looking for Title and Applicant Organization input fields...`);
  
  // Get all text inputs on the form
  const textInputs = page.locator('input[type="text"]');
  const inputCount = await textInputs.count();
  console.log(`Found ${inputCount} text input fields on form`);
  
  // The inputs should be in order: Signature (disabled), Title, Applicant Organization, Date Signed (disabled)
  // So we want to fill index 1 (Title) and index 2 (Applicant Organization)
  
  // Fill Title field (should be second input after disabled Signature)
  console.log(`Filling Title field with "TESTER"...`);
  const titleField = textInputs.nth(1);
  await titleField.waitFor({ state: "attached", timeout: 5000 });
  await titleField.fill("TESTER");
  console.log(`Title filled: "TESTER"`);
  
  // Scroll down to see Applicant Organization field
  console.log(`Scrolling down to find Applicant Organization field...`);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(500);
  
  // Fill Applicant Organization field (should be third input)
  console.log(`Filling Applicant Organization field with "Sally's Soup Emporium"...`);
  const appOrgField = textInputs.nth(2);
  await appOrgField.waitFor({ state: "visible", timeout: 5000 });
  await appOrgField.fill("Sally's Soup Emporium");
  console.log(`Applicant Organization filled: "Sally's Soup Emporium"`);

  // 10. Scroll up and click 'Save'
  console.log(`Scrolling to top and clicking Save button...`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500); // Wait for scroll to complete
  const saveButton = page.getByRole("button", { name: /save/i }).first();
  await saveButton.waitFor({ state: "visible", timeout: 5000 });
  await saveButton.click();
  console.log(`Save button clicked!`);
  await page.waitForTimeout(500);

  // 11. Form shows success message
  console.log(`Waiting for save response...`);
  await page.waitForTimeout(1000);
  
  // Check for validation errors or success
  const formSavedHeading = page.getByText(/form was saved/i);
  const headingExists = await formSavedHeading.count();
  
  if (headingExists > 0) {
    console.log(`Form save message appeared`);
    
    // Check if there are validation errors
    const errorAlert = page.locator('alert:has-text("is required")');
    const errorsExist = await errorAlert.count();
    
    if (errorsExist > 0) {
      console.log(`Found validation errors, looking for Applicant Organization field...`);
      
      // Try to fill the Applicant Organization field
      const appOrgInput = page.locator('textbox').filter({ hasText: /Applicant Organization/i }).last();
      const appOrgExists = await appOrgInput.count();
      
      if (appOrgExists > 0) {
        console.log(`Found Applicant Organization field, filling...`);
        await appOrgInput.fill("Sally's Soup Emporium");
        console.log(`Applicant Organization filled: "Sally's Soup Emporium"`);
        
        // Scroll up and save again
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(500);
        const saveButton2 = page.getByRole("button", { name: /save/i }).first();
        await saveButton2.click();
        console.log(`Save button clicked again!`);
        await page.waitForTimeout(1000);
      }
    }
  }
  
  // Verify success messages
  const successMessage = page.getByText(/form was saved/i);
  await expect(successMessage).toBeVisible({ timeout: 10000 });
  console.log(`Form saved successfully!`);

  // 12. Click on breadcrumb showing application name
  console.log(`Clicking breadcrumb to return to application landing page...`);
  const appNameBreadcrumb = page.getByRole("link", {
    name: /TEST-BR-8037-ORG-APP/i,
  });
  await appNameBreadcrumb.click();
  await page.waitForLoadState("domcontentloaded");
  console.log(`Back on application landing page`);

  // 13. Wait for page to load and just verify we're on the application page
  // (Don't check for specific message as it may vary)
  const requiredFormsHeading = page.getByRole("heading", { name: /^Required Forms$/i });
  await expect(requiredFormsHeading).toBeVisible({ timeout: 10000 });
  console.log(`Application landing page loaded with forms list!`);

  // --- Completing Conditionally Required Forms: User completes "Disclosure of Lobbying Activities (SF-LLL)" ---
  // 14. Look for text 'Conditionally-Required Forms'
  console.log(`Looking for Conditionally-Required Forms section...`);
  const conditionallyRequiredHeading = page.getByRole("heading", { name: /^Conditionally-Required Forms$/i });
  await expect(conditionallyRequiredHeading).toBeVisible({ timeout: 10000 });
  console.log(`Found Conditionally-Required Forms section`);

  // 15. Click on form "Disclosure of Lobbying Activities (SF-LLL)"
  console.log(`Clicking on SF-LLL form link...`);
  const sfLLLForm = page.getByRole("link", {
    name: /Disclosure.*Lobbying.*SF-LLL/i,
  });
  await sfLLLForm.waitFor({ state: "visible", timeout: 5000 });
  await sfLLLForm.click();
  console.log(`SF-LLL form link clicked, waiting for form page to load...`);
  
  await page.waitForURL(/\/form\//, { timeout: 15000 });
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(2000);
  console.log(`SF-LLL form page loaded: ${page.url()}`);

  // 16. Fill in 'Type of Federal Action' - select 'Grant'
  console.log(`Looking for form selects...`);
  const allSelects = await page.locator("select:not([id*='test-users'])").count();
  console.log(`Found ${allSelects} form selects on page`);
  
  const typeOfActionSelect = page.locator("select:not([id*='test-users'])").nth(0);
  await typeOfActionSelect.waitFor({ state: "visible", timeout: 5000 });
  console.log(`Selecting 'Grant' for Type of Federal Action...`);
  await typeOfActionSelect.selectOption("Grant");
  console.log(`Selected Grant`);

  // 17. Fill in 'Status of Federal Action' - select 'InitialAward'
  const statusSelect = page.locator("select:not([id*='test-users'])").nth(1);
  await statusSelect.waitFor({ state: "visible", timeout: 5000 });
  console.log(`Selecting 'InitialAward' for Status of Federal Action...`);
  await statusSelect.selectOption("InitialAward");
  console.log(`Selected InitialAward`);

  // 18. Fill in 'Report Type' - select 'InitialFiling'
  const reportTypeSelect = page.locator("select:not([id*='test-users'])").nth(2);
  await reportTypeSelect.waitFor({ state: "visible", timeout: 5000 });
  console.log(`Selecting 'InitialFiling' for Report Type...`);
  await reportTypeSelect.selectOption("InitialFiling");
  console.log(`Selected InitialFiling`);

  // 19. Fill in 'Entity Type' - select 'Prime'
  const entityTypeSelect = page.locator("select:not([id*='test-users'])").nth(3);
  await entityTypeSelect.waitFor({ state: "visible", timeout: 5000 });
  console.log(`Selecting 'Prime' for Entity Type...`);
  await entityTypeSelect.selectOption("Prime");
  console.log(`Selected Prime`);

  // 20. Fill in 'Organization Name' - enter 'SIMPLER GG'
  const orgNameInputs = page.locator('input[type="text"]');
  await orgNameInputs.nth(0).fill("SIMPLER GG");

  // 21. Fill in 'Street 1' - enter "TEST STREET"
  await orgNameInputs.nth(1).fill("TEST STREET");

  // 22. Fill in 'City' - enter "TEST CITY"
  await orgNameInputs.nth(2).fill("TEST CITY");

  // 23. Fill in 'State' dropdown - select Alabama
  const stateSelects = page.locator("select:not([id*='test-users'])");
  await stateSelects.nth(4).selectOption("Alabama");

  // 24. Fill in 'Zip / Postal Code' - enter '207440000'
  await orgNameInputs.nth(3).fill("207440000");

  // 25. Fill in 'Congressional District' - enter 'MD'
  await orgNameInputs.nth(4).fill("MD");

  // 26. Fill in 'Federal Department/Agency' - enter 'TEST'
  await orgNameInputs.nth(5).fill("TEST");

  // 27. Fill in '10a. Name and Address of Lobbying Registrant - First Name' - enter 'BR'
  await orgNameInputs.nth(6).fill("BR");

  // 28. Fill in 'Last Name' - enter 'TESTER'
  await orgNameInputs.nth(7).fill("TESTER");

  // 29. Fill in 'Street 1' - enter "TEST STREET"
  await orgNameInputs.nth(8).fill("TEST STREET");

  // 30. Fill in 'City' - enter "TEST CITY"
  await orgNameInputs.nth(9).fill("TEST CITY");

  // 31. Fill in 'State' dropdown - select Alabama
  await stateSelects.nth(5).selectOption("Alabama");

  // 32. Fill in 'Zip / Postal Code' - enter '207440000'
  await orgNameInputs.nth(10).fill("207440000");

  // 33. Fill in '10b. Individual Performing Services - First Name' - enter 'BR'
  await orgNameInputs.nth(11).fill("BR");

  // 34. Fill in 'Last Name' - enter 'TESTER'
  await orgNameInputs.nth(12).fill("TESTER");

  // 35. Fill in 'Street 1' - enter "TEST STREET"
  await orgNameInputs.nth(13).fill("TEST STREET");

  // 36. Fill in 'City' - enter "TEST CITY"
  await orgNameInputs.nth(14).fill("TEST CITY");

  // 37. Fill in 'State' dropdown - select Alabama
  await stateSelects.nth(6).selectOption("Alabama");

  // 38. Fill in 'Zip / Postal Code' - enter '207440000'
  await orgNameInputs.nth(15).fill("207440000");

  // 39. Fill in '11. Signature - First Name' - enter 'BR'
  await orgNameInputs.nth(16).fill("BR");

  // 40. Fill in 'Last Name' - enter 'TESTER'
  await orgNameInputs.nth(17).fill("TESTER");

  // 41. Scroll to top and click 'Save'
  await page.evaluate(() => window.scrollTo(0, 0));
  const saveSFLLLButton = page.getByRole("button", { name: /save/i }).first();
  await saveSFLLLButton.click();
  await page.waitForTimeout(500);

  // 42. Page returns success message
  await expect(
    page.getByText(/form was saved/i)
  ).toBeVisible();
  await expect(
    page.getByText(/no errors were detected/i)
  ).toBeVisible();

  // 43. Click on breadcrumb 'application name'
  const appNameBreadcrumb2 = page.getByRole("link", {
    name: /TEST-BR-8037-ORG-APP/i,
  });
  await appNameBreadcrumb2.click();
  await page.waitForLoadState("domcontentloaded");

  // 44. Application landing page should say 'No issues detected.'
  await expect(
    page.getByText(/no issues detected/i)
  ).toBeVisible();

  // --- Confirm Optional Form for Submission: User selects "Yes" to submit SF-LLL with application ---
  // 45. Look for 'Submit with application' radio button in Conditionally-Required Forms table
  // Find the row with SF-LLL form and the radio button for "Yes"
  const submitWithAppRadio = page
    .locator("table")
    .getByLabel(/yes/i)
    .last();
  await submitWithAppRadio.click();

  // --- Submitting Application: User clicks "Submit Application" ---
  // 46. Click on 'Submit Application'
  const submitAppButton = page.getByRole("button", {
    name: /submit application/i,
  });
  await submitAppButton.click();
  await page.waitForLoadState("domcontentloaded");

  // --- Confirmation Page: User validates the confirmation page ---
  // 47. Success message shows up with application ID
  const successHeading = page.getByText(/your application has been submitted/i);
  await expect(successHeading).toBeVisible();

  const appIdMessage = page.getByText(/application id/i);
  await expect(appIdMessage).toBeVisible();

  // Verify application ID format (UUID)
  const appIdText = await appIdMessage.textContent();
  expect(appIdText).toMatch(
    /Application ID #: [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );
});
