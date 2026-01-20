import {
  expect,
  test,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";
import {
  clickSignIn,
  fillSignInForm,
  findSignOutButton,
  generateMfaAndSubmit,
  locateMfaInput,
  testUserAuthKey,
  testUserEmail,
  testUserPassword,
} from "tests/e2e/utils/perform-login-utils";
import { baseUrl, targetEnv } from "tests/playwright.config";

// --- Timeouts ---
const TIMEOUT_REDIRECT = 90000;

// Tagging the test for config separation
test.describe("@login Login.gov tests", () => {
  // Skip test if env missing
  const envMissing =
    targetEnv !== "staging" ||
    !testUserEmail ||
    !testUserPassword ||
    !testUserAuthKey;
  test.skip(envMissing, "Login E2E env not configured; skipping spec");

  // --- Test ---
  test("Login.gov authentication with MFA", async ({
    page,
    context,
  }: {
    page: Page;
    context: BrowserContext;
  }) => {
    const isMobileProject = !!test.info().project.name.match(/[Mm]obile/);

    // Optional tracing for CI debugging
    await context.tracing.start({ screenshots: true, snapshots: true });

    // --- Step 1: Navigate to staging ---
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const step1Path = test.info().outputPath("step1-homepage.png");
    await page.screenshot({ path: step1Path, fullPage: true });
    await test
      .info()
      .attach("step1-homepage", { path: step1Path, contentType: "image/png" });

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

    // --- Step 7: Handle mobile dropdown if needed and confirm login success ---
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

    // --- Step 8: Confirm Account element is visible ---
    const signOutButton = await findSignOutButton(page, isMobileProject);
    await expect(signOutButton).toHaveCount(1, {
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
