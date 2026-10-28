/**
 * @feature User-initiated logout
 * @featureFile e2e/login/features/logout-user-initiated.feature
 * @scenario Logout via the Sign out option, protected-page lockout, no private data on public pages, re-login
 */

import { expect, test, type Page } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { openMobileNav } from "tests/e2e/playwrightUtils";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/auth/authenticate-e2e-user-utils";

const { SMOKE } = VALID_TAGS;
const { baseUrl, targetEnv, testOrgLabel } = playwrightEnv;

// Authenticated page that needs only a valid session token (not an email on the
// session), so it works with spoofed logins in every environment.
const AUTHENTICATED_PAGE = "/workspace/organizations";
// Public pages that render the header (and any user-specific state) for everyone.
const PUBLIC_PAGES = ["/", "/search"];
const ACCOUNT_MENU = 'button[aria-controls="Account"]';
const SIGN_IN = 'a:has-text("Sign In"), button:has-text("Sign In")';
const SIGN_OUT_LINK = 'a[href="/api/auth/logout"]';
const SESSION_ENDPOINT = "/api/auth/session";
const TIMEOUT = targetEnv === "local" ? 15000 : 60000;

// Seeded/provisioned user that belongs to an organization in every environment.
// Each authenticateE2eUser call mints its own token, so logging out only ends
// this test's session, not other specs using the same user.
const LOGOUT_TEST_USER = "primaryOrgAdmin" as const;

// Private user information we can see while logged in: the user's organization
// name (shown only to its members). It must not appear once logged out.
const PRIVATE_DATA = String(testOrgLabel);

// /api/auth/session intentionally exposes only login state (never PII).
type SessionState = { isLoggedIn?: boolean };

const getSessionState = async (page: Page): Promise<SessionState> => {
  const response = await page.request.get(SESSION_ENDPOINT);
  return response.ok() ? ((await response.json()) as SessionState) : {};
};

// Real Login.gov (staging) is called with client_id + post_logout_redirect_uri and
// no id_token_hint (see get_login_gov_logout_redirect_uri in the API), so it can show
// a "sign out" confirmation page instead of redirecting straight back. The app
// session is only cleared after that, so click it if shown. No-op when the logout
// chain stays on the app host or the IdP (local mock) redirects without a page.
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

// Open the Account menu (mobile: nav first) and return the Sign out link.
// Retries the open until the link is visible, so a click that lands before
// hydration is not lost, and only toggles while the link is hidden so an open
// menu is never closed.
const openAccountMenuAndGetSignOut = async (page: Page, isMobile: boolean) => {
  if (isMobile) await openMobileNav(page);
  const signOut = page.locator(SIGN_OUT_LINK);
  await expect(async () => {
    if (!(await signOut.isVisible())) {
      await page.locator(ACCOUNT_MENU).click({ timeout: 2000 });
    }
    await expect(signOut).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: TIMEOUT });
  return signOut;
};

const expectLoggedIn = async (page: Page) => {
  await expect(page.locator(ACCOUNT_MENU)).toHaveCount(1, { timeout: TIMEOUT });
};

const expectLoggedOut = async (page: Page) => {
  await expect(page.locator(ACCOUNT_MENU)).toHaveCount(0, { timeout: TIMEOUT });
  await expect(page.locator(SIGN_IN).first()).toBeAttached({
    timeout: TIMEOUT,
  });
};

// The authenticated page rendered and shows the user's private data.
const expectAuthenticatedContent = async (page: Page) => {
  await expect(page).toHaveURL(new RegExp(`${AUTHENTICATED_PAGE}$`));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
    timeout: TIMEOUT,
  });
  await expect(page.getByText(PRIVATE_DATA).first()).toBeVisible({
    timeout: TIMEOUT,
  });
};

test.describe("User-initiated logout", () => {
  test(
    "logs out via Sign out, blocks protected and private content, and allows re-login",
    { tag: [SMOKE] },
    async ({ page, context }, testInfo) => {
      const isMobile = !!testInfo.project.name.match(/[Mm]obile/);
      // Given the user is logged in to Simpler Grants.gov (seeded session, login.gov bypassed)
      await authenticateE2eUser(page, context, isMobile, LOGOUT_TEST_USER);

      // And the user navigates to an authenticated page that shows private data
      await page.goto(AUTHENTICATED_PAGE, { waitUntil: "domcontentloaded" });
      await expectLoggedIn(page);
      await expectAuthenticatedContent(page);

      // When the user initiates logout using the application's Sign out option
      const signOut = await openAccountMenuAndGetSignOut(page, isMobile);
      await signOut.click();

      // Then the logout chain (app -> API -> IdP -> API -> app) completes and the
      // app session is gone. The session cookie is only cleared by the app's
      // logout-callback, so "logged out" also proves the round trip finished.
      // Note: SignOutNavLink stores the current page as post-auth-redirect, so the
      // app may return the user to the authenticated page, where the auth gate now
      // blocks them. Assert on state, not on a specific landing URL.
      await expect
        .poll(
          async () => {
            await confirmLoginGovSignOutIfShown(page);
            return (await getSessionState(page)).isLoggedIn ?? false;
          },
          {
            timeout: TIMEOUT,
            message:
              "app session still active after Sign out; the logout round trip did not complete. " +
              "Locally, check AUTH_LOGOUT_URL (frontend) and LOGOUT_FINAL_DESTINATION (API) use the same host as baseURL; " +
              "on staging, check the failure screenshot for a Login.gov confirmation page",
          },
        )
        .toBe(false);
      // ...and the user is back on the application, not stranded at the IdP.
      // Cookies are host-scoped, so this must be the SAME origin Playwright seeded.
      await expect
        .poll(() => new URL(page.url()).origin, { timeout: TIMEOUT })
        .toBe(new URL(baseUrl).origin);
      const cookies = await context.cookies();
      expect(cookies.find((c) => c.name === "session")).toBeUndefined();
      if (isMobile) await openMobileNav(page).catch(() => undefined);
      await expectLoggedOut(page);

      // When the user attempts to revisit the previously accessed authenticated page
      await page.goto(AUTHENTICATED_PAGE, { waitUntil: "domcontentloaded" });

      // Then they are prevented from accessing protected content
      await expect(page.locator(".usa-alert--error")).toBeVisible({
        timeout: TIMEOUT,
      });
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
      await expect(page.getByText(PRIVATE_DATA)).toHaveCount(0);
      await expect(page.locator(SIGN_IN).first()).toBeAttached();

      // And private user information is not accessible on public pages
      for (const publicPage of PUBLIC_PAGES) {
        await page.goto(publicPage, { waitUntil: "domcontentloaded" });
        await expectLoggedOut(page);
        await expect(page.locator("body")).not.toContainText(PRIVATE_DATA);
      }

      // When the user logs in again (new seeded session token; the old one was revoked)
      await authenticateE2eUser(page, context, isMobile, LOGOUT_TEST_USER);

      // Then the user can access their authorized content
      await page.goto(AUTHENTICATED_PAGE, { waitUntil: "domcontentloaded" });
      await expectLoggedIn(page);
      await expectAuthenticatedContent(page);
      expect((await getSessionState(page)).isLoggedIn).toBe(true);
    },
  );
});
