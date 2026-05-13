import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import {
  findSignOutButton,
  performStagingLogin,
} from "tests/e2e/utils/perform-login-utils";

const { SMOKE, AUTH } = VALID_TAGS;

const { baseUrl, targetEnv, testUserAuthKey, testUserEmail, testUserPassword } =
  playwrightEnv;

const TIMEOUT_REDIRECT = 90000;

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
    { tag: [SMOKE, AUTH] },
    async ({ page, context }: { page: Page; context: BrowserContext }) => {
      const isMobileProject = !!test.info().project.name.match(/[Mm]obile/);

      // Only start tracing manually on the first attempt. On retries, Playwright's
      // config (trace: "on-first-retry") has already started tracing, and calling
      // tracing.start() again throws "Tracing has been already started".
      const isFirstAttempt = test.info().retry === 0;
      if (isFirstAttempt) {
        await context.tracing.start({ screenshots: true, snapshots: true });
      }

      try {
        await page.goto(baseUrl, {
          waitUntil: "domcontentloaded",
          timeout: targetEnv === "staging" ? 180000 : 60000,
        });

        await performStagingLogin(page, isMobileProject);

        // findSignOutButton opens the Account dropdown (and mobile nav if needed)
        // then returns the sign-out locator.
        // Use toHaveCount(1) rather than toBeVisible: the Sign out link lives
        // inside a collapsed dropdown. Its presence in the DOM is sufficient
        // proof of a successful login; visibility depends on dropdown state.
        const signOutButton = await findSignOutButton(page, isMobileProject);
        await expect(signOutButton).toHaveCount(1, {
          timeout: TIMEOUT_REDIRECT,
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
