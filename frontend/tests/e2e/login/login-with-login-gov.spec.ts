import {
  expect,
  test,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import {
  clickSignIn,
  fillSignInForm,
  findSignOutButton,
  generateMfaAndSubmit,
  locateMfaInput,
} from "tests/e2e/utils/perform-login-utils";

const { baseUrl, targetEnv, testUserAuthKey, testUserEmail, testUserPassword } =
  playwrightEnv;
// --- Timeouts ---
const TIMEOUT_REDIRECT = 90000;

// Tagging the test for config separation
test.describe("Login.gov based authentication tests", () => {
  // Skip non-Chrome browsers in staging
  test.beforeEach(({ page: _ }, testInfo) => {
    if (targetEnv === "staging") {
      test.skip(
        testInfo.project.name !== "Chrome",
        "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
      );
    }
  });

  // Skip test if env missing
  const envMissing =
    targetEnv !== "staging" ||
    !testUserEmail ||
    !testUserPassword ||
    !testUserAuthKey;
  test.skip(envMissing, "Login E2E env not configured; skipping spec");

  test(
    "Login.gov authentication with MFA",
    { tag: ["@smoke", "@auth"] },
    async ({ page, context }: { page: Page; context: BrowserContext }) => {
      const isChrome = !!test.info().project.name.match(/^Chrome/);
      const isMobileProject = !!test.info().project.name.match(/[Mm]obile/);

      // for now MFA is failing if we run this test too frequently, so limiting to one browser until we can figure that out
      if (!isChrome) {
        return;
      }

      // Only start tracing manually on the first attempt. On retries, Playwright's
      // config (trace: "on-first-retry") has already started tracing, and calling
      // tracing.start() again throws "Tracing has been already started".
      const isFirstAttempt = test.info().retry === 0;
      if (isFirstAttempt) {
        await context.tracing.start({ screenshots: true, snapshots: true });
      }

      try {
        // --- Step 1: Navigate to staging ---
        await page.goto(baseUrl, {
          waitUntil: "domcontentloaded",
          timeout: targetEnv === "staging" ? 180000 : 60000,
        });
        const step1Path = test.info().outputPath("step1-homepage.png");
        await page.screenshot({ path: step1Path, fullPage: true });

        await test.info().attach("step1-homepage", {
          path: step1Path,
          contentType: "image/png",
        });

        // --- Step 2: Check if already logged in ---
        // When run as part of a suite with --workers=1, the browser is reused
        // and the session from the previous test may still be active. In that
        // case skip straight to verifying the Sign Out button is present.
        const signOutLocator = page.locator(
          'button:has-text("Sign out"), a:has-text("Sign out")',
        );
        const isAlreadyLoggedIn = await signOutLocator
          .isVisible({ timeout: 15000 })
          .catch(() => false);

        if (isAlreadyLoggedIn) {
          //  console.log(
          //    "login-with-login-gov: session already active, skipping MFA login",
          //  );
          await expect(signOutLocator).toHaveCount(1, {
            timeout: TIMEOUT_REDIRECT,
          });
          return;
        }

        // --- Step 3: Click Sign In ---
        const isVisible = await clickSignIn(page);
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

        await fillSignInForm(page);

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

        for (let attempt = 1; attempt <= 3 && !mfaInput; attempt++) {
          await test.step(`MFA retry attempt ${attempt}`, async () => {
            try {
              const inputCandidate: Locator = await locateMfaInput(page);
              mfaInput = inputCandidate;
            } catch (e) {
              if (page.isClosed()) throw e;
              await page.waitForTimeout(3000);
              if (attempt === 3) throw e;
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
        await generateMfaAndSubmit(page, mfaInput);

        // --- Step 7: Handle mobile dropdown if needed ---
        if (isMobileProject) {
          const dropdownButton = page
            .locator(
              'header >> role=button[name="User menu"], header >> [aria-label*="menu"], header >> [aria-label*="User"]',
            )
            .first();

          if (await dropdownButton.isVisible().catch(() => false)) {
            await dropdownButton.click();
            await page.waitForTimeout(300);
          }
        }

        // --- Step 8: Confirm Sign Out button is visible (login success) ---
        const signOutButton = await findSignOutButton(page, isMobileProject);
        await expect(signOutButton).toHaveCount(1, {
          timeout: TIMEOUT_REDIRECT,
        });

        // --- Step 9: Final success screenshot ---
        const successPath = test.info().outputPath("step4-login-success.png");
        await page.screenshot({ path: successPath, fullPage: true });
        await test.info().attach("step4-login-success", {
          path: successPath,
          contentType: "image/png",
        });
      } finally {
        // Always stop tracing if we started it, whether the test passed or failed.
        // On retries tracing is managed by Playwright config so we skip this.
        if (isFirstAttempt) {
          await context.tracing
            .stop({ path: test.info().outputPath("trace.zip") })
            .catch(() => undefined); // ignore if tracing was never started
        }
      }
    },
  );
});
