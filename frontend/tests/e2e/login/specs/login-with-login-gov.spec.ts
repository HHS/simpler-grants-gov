/**
 * @feature Sign in with Login.gov
 * @featureFile e2e/login/features/login-with-login-gov.feature
 * @scenario Login.gov authentication with MFA
 */

import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { openMobileNav } from "tests/e2e/playwrightUtils";
import { VALID_TAGS } from "tests/e2e/tags";
import {
  clickSignIn,
  findSignOutButton,
  performStagingLogin,
} from "tests/e2e/utils/auth/perform-login-utils";
import { skipNonChromeOnStaging } from "tests/e2e/utils/auth/skip-non-chrome-staging-utils";

const { SMOKE, FULL_REGRESSION } = VALID_TAGS;

const { baseUrl, targetEnv, testUserAuthKey, testUserEmail, testUserPassword } =
  playwrightEnv;

const TIMEOUT_REDIRECT = 90000;

const ACCOUNT_MENU = 'button[aria-controls="Account"]';
const SIGN_OUT_LINK = 'a[href="/api/auth/logout"]';
const LOGIN_GOV_EMAIL_INPUT = 'input[name="user[email]"]';
const WORKSPACE_PAGE = "/workspace";

// Open the Account menu (mobile: nav first) and return the Sign out link.
// Retries the open until the link is visible, so a click that lands before
// hydration is not lost, and only toggles while the link is hidden so an open
// menu is never closed.
const openAccountMenuAndGetSignOut = async (
  page: Page,
  isMobileProject: boolean,
) => {
  if (isMobileProject) await openMobileNav(page);
  const signOut = page.locator(SIGN_OUT_LINK);
  await expect(async () => {
    if (!(await signOut.isVisible())) {
      await page.locator(ACCOUNT_MENU).click({ timeout: 2000 });
    }
    await expect(signOut).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: TIMEOUT_REDIRECT });
  return signOut;
};

// Login.gov's logout is called with client_id + post_logout_redirect_uri and no
// id_token_hint (see get_login_gov_logout_redirect_uri in the API), so Login.gov
// shows a "sign out" confirmation page instead of signing the user out immediately.
// The app session is only cleared after that confirmation, so click it if shown.
const LOGIN_GOV_CONFIRM_SIGN_OUT = /sign out|log out/i;
const confirmLoginGovSignOutIfShown = async (page: Page) => {
  try {
    if (new URL(page.url()).hostname === new URL(baseUrl).hostname) return;
    const confirm = page
      .getByRole("button", { name: LOGIN_GOV_CONFIRM_SIGN_OUT })
      .first();
    if (await confirm.isVisible()) await confirm.click();
  } catch {
    // Page was mid-navigation; the next poll iteration retries.
  }
};

const isLoggedInOnServer = async (page: Page): Promise<boolean> => {
  const response = await page.request.get("/api/auth/session");
  if (!response.ok()) return false;
  const { isLoggedIn } = (await response.json()) as { isLoggedIn?: boolean };
  return !!isLoggedIn;
};

test.describe("Login.gov based authentication tests", () => {
  // Skip non-Chrome browsers in staging
  test.beforeEach(({ page: _ }, testInfo) => {
    skipNonChromeOnStaging(testInfo);
  });

  // Skip test if env missing
  const envMissing =
    targetEnv === "local" ||
    !testUserEmail ||
    !testUserPassword ||
    !testUserAuthKey;
  test.skip(envMissing, "Login E2E env not configured; skipping spec");

  // Scenario: signs in with Login.gov MFA and reaches an authenticated state
  test(
    "Login.gov authentication with MFA",
    { tag: [SMOKE] },
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
        // Given the user launches the application
        await page.goto(baseUrl, {
          waitUntil: "domcontentloaded",
          timeout: targetEnv !== "local" ? 180000 : 60000,
        });

        // When the user clicks the "Sign in" button
        // And the user enters a valid email and password
        // And the user submits the login form
        // And the user enters the authentication code
        // And the user submits the MFA form
        await performStagingLogin(page, isMobileProject);

        // Then the sign out button is visible — the user is successfully logged in
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

  // Scenario: signs out through the real Login.gov end-session round trip.
  // Staging only: the seeded logout spec covers the app side against the mock
  // IdP; this covers app -> API -> Login.gov endsession -> API -> app, and that
  // the Login.gov session itself ended (Sign In asks for credentials again).
  test(
    "Login.gov logout ends the app and Login.gov sessions",
    { tag: [FULL_REGRESSION] },
    async ({ page, context }: { page: Page; context: BrowserContext }) => {
      test.skip(
        targetEnv !== "staging",
        "Real Login.gov logout flow is limited to staging",
      );
      // Login with MFA (+ possible TOTP-window wait) plus the IdP round trip
      // does not fit the default 120s.
      test.setTimeout(240000);
      const isMobileProject = !!test.info().project.name.match(/[Mm]obile/);

      const isFirstAttempt = test.info().retry === 0;
      if (isFirstAttempt) {
        await context.tracing.start({ screenshots: true, snapshots: true });
      }

      try {
        // Given the user is logged in through Login.gov (with MFA)
        await page.goto(baseUrl, {
          waitUntil: "domcontentloaded",
          timeout: 180000,
        });
        await performStagingLogin(page, isMobileProject);
        await expect(page.locator(ACCOUNT_MENU)).toHaveCount(1, {
          timeout: TIMEOUT_REDIRECT,
        });
        expect(await isLoggedInOnServer(page)).toBe(true);

        // When the user initiates logout using the Sign out option
        const signOut = await openAccountMenuAndGetSignOut(
          page,
          isMobileProject,
        );
        await signOut.click();

        // Then the round trip completes and the app session is gone
        await expect
          .poll(
            async () => {
              await confirmLoginGovSignOutIfShown(page);
              return isLoggedInOnServer(page);
            },
            {
              timeout: TIMEOUT_REDIRECT,
              message:
                "app session still active after Sign out; the Login.gov logout round trip did not complete (check the failure screenshot for a Login.gov confirmation page)",
            },
          )
          .toBe(false);
        // ...and the user is back on the application, not stranded at the IdP
        await expect
          .poll(() => new URL(page.url()).origin, { timeout: TIMEOUT_REDIRECT })
          .toBe(new URL(baseUrl).origin);
        const cookies = await context.cookies();
        expect(cookies.find((c) => c.name === "session")).toBeUndefined();

        // And protected content is no longer accessible
        await page.goto(WORKSPACE_PAGE, { waitUntil: "domcontentloaded" });
        await expect(page.locator(ACCOUNT_MENU)).toHaveCount(0, {
          timeout: TIMEOUT_REDIRECT,
        });
        await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);

        // And the Login.gov session ended: Sign In asks for credentials again
        // instead of silently signing the user back in
        if (isMobileProject) await openMobileNav(page);
        expect(await clickSignIn(page)).toBe(true);
        await expect(
          page.locator(LOGIN_GOV_EMAIL_INPUT),
          "Login.gov did not prompt for credentials; its session may still be active after logout",
        ).toBeVisible({ timeout: TIMEOUT_REDIRECT });
      } finally {
        if (isFirstAttempt) {
          await context.tracing
            .stop({ path: test.info().outputPath("trace.zip") })
            .catch(() => undefined);
        }
      }
    },
  );
});
