import { Locator, Page } from "@playwright/test";
import { authenticator } from "otplib";
import playwrightEnv from "tests/e2e/playwright-env";

// Error if env missing and running against staging
if (
  playwrightEnv.targetEnv === "staging" &&
  (!playwrightEnv.testUserEmail ||
    !playwrightEnv.testUserPassword ||
    !playwrightEnv.testUserAuthKey)
) {
  throw new Error("login credentials missing for staging test run");
}

// --- Timeouts ---
const TIMEOUT_HOME = 60000;
const TIMEOUT_MFA = 120000;

export const findSignOutButton = async (
  page: Page,
  isMobileProject: boolean,
): Promise<Locator> => {
  // --- Handle mobile dropdown if needed and confirm login success ---
  if (isMobileProject) {
    const dropdownButton = page
      .locator(
        'header >> role=button[name="User menu"], header >> [aria-label*="menu"], header >> [aria-label*="User"]',
      )
      .first();

    if (await dropdownButton.isVisible().catch(() => false)) {
      await dropdownButton.click();
      await page.waitForTimeout(300); // wait for menu to open
    }
  }

  // --- Confirm Account element is visible ---
  const signOutButton = page.locator(
    'button:has-text("Sign out"), a:has-text("Sign out")',
  );

  return signOutButton;
};

export const generateMfaAndSubmit = async (page: Page, mfaInput: Locator) => {
  const oneTimeCode: string = authenticator.generate(
    playwrightEnv.testUserAuthKey,
  );
  await mfaInput.fill(oneTimeCode);

  const mfaSubmitButton: Locator = page
    .locator('button[type="submit"]:not(:has-text("Cancel"))')
    .filter({ visible: true })
    .first();
  await mfaSubmitButton.click();
};

export const locateMfaInput = async (page: Page): Promise<Locator> => {
  let inputCandidate: Locator = page.locator(
    'input[autocomplete="one-time-code"]',
  );
  if (!(await inputCandidate.isVisible().catch(() => false))) {
    // Check frames if input is inside iframe
    for (const frame of page.frames()) {
      const frameInput = frame.locator('input[autocomplete="one-time-code"]');
      if (await frameInput.isVisible().catch(() => false)) {
        inputCandidate = frameInput;
        break;
      }
    }
  }

  await inputCandidate.waitFor({
    state: "visible",
    timeout: TIMEOUT_MFA,
  });
  return inputCandidate;
};

export const fillSignInForm = async (page: Page) => {
  await page.waitForSelector('input[name="user[email]"]', {
    state: "visible",
    timeout: TIMEOUT_HOME,
  });
  await page.fill('input[name="user[email]"]', playwrightEnv.testUserEmail);
  await page.fill(
    'input[name="user[password]"]',
    playwrightEnv.testUserPassword,
  );

  const submitButton: Locator = page
    .locator('button[type="submit"]')
    .filter({ visible: true })
    .first();
  await submitButton.click();
};

export const clickSignIn = async (page: Page): Promise<boolean> => {
  let signInButton: Locator = page
    .locator('button:has-text("Sign In")')
    .filter({ visible: true })
    .first();
  let isVisible = await signInButton.isVisible().catch(() => false);

  if (!isVisible) {
    signInButton = page
      .locator('a:has-text("Sign In")')
      .filter({ visible: true })
      .first();
    isVisible = await signInButton.isVisible().catch(() => false);
    if (!isVisible) {
      return false;
    }
  }
  await signInButton.click();
  return true;
};

// assumes user has navigated to staging home page
// returns a reference to the sign out button which can be used to confirm successful login
export const performStagingLogin = async (
  page: Page,
  isMobileProject: boolean,
) => {
  const signInReady = await clickSignIn(page);
  if (!signInReady) {
    console.error("unable to access login gov sign in");
    throw new Error("unable to access login gov sign in");
  }
  await fillSignInForm(page);
  let mfaInput: Locator | undefined;
  for (let attempt = 1; attempt <= 3 && !mfaInput; attempt++) {
    try {
      const inputCandidate: Locator = await locateMfaInput(page);
      mfaInput = inputCandidate;
    } catch (e) {
      if (page.isClosed()) throw e;
      await page.waitForTimeout(3000);
      if (attempt === 3) throw e;
    }
  }
  if (!mfaInput) throw new Error("MFA input field was not found");

  let signOutButton: Locator | undefined;
  for (let attempt = 1; attempt <= 3 && !signOutButton; attempt++) {
    try {
      await generateMfaAndSubmit(page, mfaInput);
      signOutButton = await findSignOutButton(page, isMobileProject);
      if (!signOutButton) {
        await page.waitForTimeout(TIMEOUT_MFA);
      }
    } catch (e) {
      if (page.isClosed()) throw e;
      await page.waitForTimeout(TIMEOUT_MFA);
      if (attempt === 3) throw e;
    }
  }
  return signOutButton;
};
