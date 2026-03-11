import { Locator, Page } from "@playwright/test";
import { authenticator } from "otplib";
import playwrightEnv from "tests/e2e/playwright-env";
import { openMobileNav } from "tests/e2e/playwrightUtils";

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
const TIMEOUT_HOME = playwrightEnv.targetEnv === "staging" ? 180000 : 60000;
const TIMEOUT_MFA = 120000;

// TOTP codes are valid for 30s windows. If we're within this many seconds
// of a window boundary, wait for the next window before generating a code.
// This prevents submitting a code that expires before login.gov processes it.
const TOTP_WINDOW_SECONDS = 30;
const TOTP_SAFE_THRESHOLD_SECONDS = 5;

/**
 * Waits until we are safely within a fresh TOTP time window (not within
 * the last TOTP_SAFE_THRESHOLD_SECONDS seconds of a window expiring).
 * This avoids submitting a code that login.gov will reject as expired.
 */
async function waitForFreshTotpWindow(page: Page): Promise<void> {
  const secondsRemaining =
    TOTP_WINDOW_SECONDS - (Math.floor(Date.now() / 1000) % TOTP_WINDOW_SECONDS);
  if (secondsRemaining <= TOTP_SAFE_THRESHOLD_SECONDS) {
    console.log(
      `waitForFreshTotpWindow: ${secondsRemaining}s left in TOTP window — waiting ${secondsRemaining + 1}s for next window`,
    );
    await page.waitForTimeout((secondsRemaining + 1) * 1000);
  }
}

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
  // Wait for a safe TOTP window before generating the code so it doesn't
  // expire before login.gov processes it.
  await waitForFreshTotpWindow(page);

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
  let isVisible = await signInButton
    .isVisible({ timeout: TIMEOUT_HOME })
    .catch(() => false);

  if (!isVisible) {
    signInButton = page
      .locator('a:has-text("Sign In")')
      .filter({ visible: true })
      .first();
    isVisible = await signInButton
      .isVisible({ timeout: TIMEOUT_HOME })
      .catch(() => false);
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
  if (isMobileProject) {
    await openMobileNav(page);
  }

  // If already logged in, return the sign-out button immediately.
  // This handles the case where authenticateE2eUser is called on a page
  // where a session is already active (e.g. storageState was injected).
  const existingSignOut = page.locator(
    'button:has-text("Sign out"), a:has-text("Sign out")',
  );
  if (await existingSignOut.isVisible({ timeout: 3000 }).catch(() => false)) {
    // console.warn("performStagingLogin: already logged in, skipping login flow");
    return existingSignOut;
  }

  const signInReady = await clickSignIn(page);
  if (!signInReady) {
    // console.error("unable to access login gov sign in");
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

      // Check if login.gov rejected the code (shown as an error on the MFA page)
      await page.waitForTimeout(2000);
      const invalidCodeError = page.locator(
        "text=/invalid|incorrect|try again|new code/i",
      );
      const codeWasRejected = await invalidCodeError
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (codeWasRejected) {
        console.warn(
          `performStagingLogin: MFA code rejected on attempt ${attempt} — waiting for next TOTP window`,
        );
        // Wait for the next full TOTP window so the next code is guaranteed fresh
        await page.waitForTimeout(TOTP_WINDOW_SECONDS * 1000);
        // Re-locate the MFA input (page may have reset it)
        mfaInput = await locateMfaInput(page);
        continue; // retry with a new code
      }

      signOutButton = await findSignOutButton(page, isMobileProject);
    } catch (e) {
      if (page.isClosed()) throw e;
      await page.waitForTimeout(3000);
      if (attempt === 3) throw e;
    }
  }
  return signOutButton;
};
