import {
  expect,
  test,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";
import { authenticator } from "otplib";

// Tagging the test for config separation
test.describe("@login Login.gov tests", () => {
  // --- Environment Variables ---
  const email = process.env.STAGING_TEST_USER_EMAIL;
  const password = process.env.STAGING_TEST_USER_PASSWORD;
  const authKey = process.env.STAGING_TEST_USER_MFA_KEY;
  const baseUrl = process.env.STAGING_BASE_URL;

  // Skip test if env missing
  const envMissing = !email || !password || !authKey || !baseUrl;
  test.skip(envMissing, "Login E2E env not configured; skipping spec");

  // --- Helper to require env variables ---
  const requireEnv = (value: string | undefined, name: string): string => {
    if (!value) throw new Error(`${name} is not defined`);
    return value;
  };

  // --- Timeouts ---
  const TIMEOUT_HOME = 60000;
  const TIMEOUT_MFA = 120000;
  const TIMEOUT_REDIRECT = 90000;

  // --- Test ---
  test("Login.gov authentication with MFA (PR CI)", async ({
    page,
    context,
  }: {
    page: Page;
    context: BrowserContext;
  }) => {
    // Validate and load envs inside the test so we don't throw at import time
    const loginEmail: string = requireEnv(email, "STAGING_TEST_USER_EMAIL");
    const loginPassword: string = requireEnv(
      password,
      "STAGING_TEST_USER_PASSWORD",
    );
    const loginAuthKey: string = requireEnv(
      authKey,
      "STAGING_TEST_USER_MFA_KEY",
    );
    const playwriteBaseUrl: string = requireEnv(baseUrl, "STAGING_BASE_URL");
    // Optional tracing for CI debugging
    await context.tracing.start({ screenshots: true, snapshots: true });

    // --- Step 1: Navigate to staging ---
    await page.goto(playwriteBaseUrl, { waitUntil: "domcontentloaded" });
    const step1Path = test.info().outputPath("step1-homepage.png");
    await page.screenshot({ path: step1Path, fullPage: true });
    await test
      .info()
      .attach("step1-homepage", { path: step1Path, contentType: "image/png" });

    // --- Step 2: Click Sign In ---
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
    }

    if (!isVisible) {
      const debugNoSignInPath = test
        .info()
        .outputPath("step1-debug-no-signin.png");
      await page.screenshot({ path: debugNoSignInPath, fullPage: true });
      await test.info().attach("step1-debug-no-signin", {
        path: debugNoSignInPath,
        contentType: "image/png",
      });
      throw new Error("Could not find Sign In button or link");
    }

    await signInButton.click();

    // --- Step 3: Fill login form ---
    await page.waitForSelector('input[name="user[email]"]', {
      state: "visible",
      timeout: TIMEOUT_HOME,
    });
    await page.fill('input[name="user[email]"]', loginEmail);
    await page.fill('input[name="user[password]"]', loginPassword);

    const submitButton: Locator = page
      .locator('button[type="submit"]')
      .filter({ visible: true })
      .first();
    await submitButton.click();

    // --- Step 4: Wait for MFA input ---
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const preMfaScreenshot = test.info().outputPath("before-mfa.png");
    await page.screenshot({ path: preMfaScreenshot, fullPage: true });
    await test.info().attach("before-mfa", {
      path: preMfaScreenshot,
      contentType: "image/png",
    });

    // --- Step 5: Locate MFA input with retries ---
    let mfaInput: Locator | undefined;

    for (let attempt = 1; attempt <= 3; attempt++) {
      await test.step(`MFA retry attempt ${attempt}`, async () => {
        try {
          let inputCandidate: Locator = page.locator(
            'input[autocomplete="one-time-code"]',
          );
          if (!(await inputCandidate.isVisible().catch(() => false))) {
            // Check frames if input is inside iframe
            for (const frame of page.frames()) {
              const frameInput = frame.locator(
                'input[autocomplete="one-time-code"]',
              );
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
          mfaInput = inputCandidate;
        } catch (err) {
          if (page.isClosed()) throw err;
          await page.waitForTimeout(3000);
          if (attempt === 3) throw err;
        }
      });
    }

    if (!mfaInput) throw new Error("MFA input field was not found");

    const step3Path = test.info().outputPath("step3-mfa-prompt.png");
    await page.screenshot({ path: step3Path, fullPage: true });
    await test.info().attach("step3-mfa-prompt", {
      path: step3Path,
      contentType: "image/png",
    });

    // --- Step 6: Generate OTP and submit ---
    const oneTimeCode: string = authenticator.generate(loginAuthKey);
    await mfaInput.fill(oneTimeCode);

    const mfaSubmitButton: Locator = page
      .locator('button[type="submit"]:not(:has-text("Cancel"))')
      .filter({ visible: true })
      .first();
    await mfaSubmitButton.click();

    // --- Step 7: Handle mobile dropdown if needed and confirm login success ---
    const viewport = page.viewportSize();
    const isMobile = viewport ? viewport.width <= 480 : false;

    if (isMobile) {
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

    // --- Step 8: Confirm Account element is visible ---
    const signInButtonLocator = page.locator(
      'button:has-text("Sign In"), a:has-text("Sign In")',
    );
    await expect(signInButtonLocator).toHaveCount(0, {
      timeout: TIMEOUT_REDIRECT,
    });

    // --- Step 9: Final success screenshot ---
    await page.screenshot({
      path: test.info().outputPath("step4-login-success.png"),
      fullPage: true,
    });
    await test.info().attach("step4-login-success", {
      path: test.info().outputPath("step4-login-success.png"),
      contentType: "image/png",
    });

    // --- Step 10: Stop tracing ---
    await context.tracing.stop({ path: test.info().outputPath("trace.zip") });
  });
});
