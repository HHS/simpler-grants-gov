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
const { targetEnv } = playwrightEnv;

const AUTHENTICATED_PAGE = "/workspace";
// Public pages that render the header (and any user-specific state) for everyone.
const PUBLIC_PAGES = ["/", "/search"];
const ACCOUNT_MENU = 'button[aria-controls="Account"]';
const SIGN_IN = 'a:has-text("Sign In"), button:has-text("Sign In")';
const SESSION_ENDPOINT = "/api/auth/session";
const TIMEOUT = targetEnv === "local" ? 15000 : 60000;

const SIGN_OUT_LINK = 'a[href="/api/auth/logout"]';
const SETTINGS_PAGE = "/settings";
const EMAIL_INPUT = "input#email";

// Use "orgMember": locally it is the seeded user with a linked login.gov
// identity (so its session carries an email), and each authenticateE2eUser
// call mints its own token, so logging out only ends this test's session.
const LOGOUT_TEST_USER = "orgMember" as const;

// /api/auth/session intentionally exposes only login state (never PII/email).
type SessionState = { isLoggedIn?: boolean };

const getSessionState = async (page: Page): Promise<SessionState> => {
  const response = await page.request.get(SESSION_ENDPOINT);
  return response.ok() ? ((await response.json()) as SessionState) : {};
};

// The email is private user info, so read it where the app shows it to the
// logged-in user: the (disabled) email field on the Settings page.
const getAccountEmail = async (page: Page): Promise<string> => {
  await page.goto(SETTINGS_PAGE, { waitUntil: "domcontentloaded" });
  const emailInput = page.locator(EMAIL_INPUT);
  await expect(emailInput).toBeVisible({ timeout: TIMEOUT });
  return emailInput.inputValue();
};

// Open the Account menu (mobile: nav first) and return the Sign out link.
// The shared findSignOutButton does a one-shot isVisible() check (Playwright
// ignores its timeout option), so a click that lands before React hydrates is
// lost and the menu stays closed. Retry the open until the link is visible, and
// only click the toggle while the link is hidden so we never close an open menu.
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

test.describe("User-initiated logout", () => {
  test(
    "logs out via Sign out, blocks protected and private content, and allows re-login",
    { tag: [SMOKE] },
    async ({ page, context }, testInfo) => {
      const isMobile = !!testInfo.project.name.match(/[Mm]obile/);
      // Given the user is logged in to Simpler Grants.gov (seeded session, login.gov bypassed)
      await authenticateE2eUser(page, context, isMobile, LOGOUT_TEST_USER);

      // And the user navigates to an authenticated page
      await page.goto(AUTHENTICATED_PAGE, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(new RegExp(`${AUTHENTICATED_PAGE}$`));
      // Session accepted by the auth gate / header...
      await expectLoggedIn(page);
      // ...and the dashboard actually rendered. /workspace renders nothing when
      // the session has no email, so a missing h1 means the seeded user has no
      // linked email (see seed_e2e.py / create_e2e_token.py).
      await expect(
        page.getByRole("heading", { level: 1 }),
        "workspace h1 missing: session likely has no email (seeded user needs a linked login.gov identity)",
      ).toBeVisible({ timeout: TIMEOUT });

      // Capture identity so we can prove it disappears from public pages later.
      const email = await getAccountEmail(page);
      expect(
        email,
        "seeded user should have an email shown on the Settings page",
      ).toBeTruthy();
      // Return to the authenticated page we want to be "on" when logging out.
      await page.goto(AUTHENTICATED_PAGE, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(new RegExp(`${AUTHENTICATED_PAGE}$`));

      // When the user initiates logout using the application's Sign out option
      const signOut = await openAccountMenuAndGetSignOut(page, isMobile);
      await signOut.click();

      // The logout chain (app -> API -> IdP -> API -> app) must come back on the
      // SAME host Playwright seeded the session cookie for. Cookies are host-scoped,
      // so if the app is configured for "localhost" (AUTH_LOGOUT_URL on the frontend,
      // LOGOUT_FINAL_DESTINATION on the API) but baseURL is "127.0.0.1", the logout
      // callback clears a cookie on the wrong host and the seeded session survives.
      await page.waitForURL(
        (url) =>
          url.pathname.endsWith("/logout") && !url.pathname.startsWith("/api/"),
        { timeout: TIMEOUT },
      );
      expect(
        new URL(page.url()).hostname,
        "logout chain returned on a different host than Playwright baseURL; " +
          "align AUTH_LOGOUT_URL (frontend) and LOGOUT_FINAL_DESTINATION (API) with the test host",
      ).toBe(new URL(playwrightEnv.baseUrl).hostname);

      // Then the application transitions the user to the logged-out state.
      // Note: SignOutNavLink stores the current page as post-auth-redirect, so the
      // app returns the user to /workspace, where the auth gate now blocks them.
      // Assert on state, not on a specific landing URL.
      await expect
        .poll(async () => (await getSessionState(page)).isLoggedIn ?? false, {
          timeout: TIMEOUT,
        })
        .toBe(false);
      const cookies = await context.cookies();
      expect(cookies.find((c) => c.name === "session")).toBeUndefined();
      if (isMobile) await openMobileNav(page).catch(() => undefined);
      await expectLoggedOut(page);

      // When the user attempts to revisit the previously accessed authenticated page
      await page.goto(AUTHENTICATED_PAGE, { waitUntil: "domcontentloaded" });

      // Then they are prevented from accessing protected content
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
      await expect(page.locator(".usa-alert--error")).toBeVisible({
        timeout: TIMEOUT,
      });
      await expect(page.locator(SIGN_IN).first()).toBeAttached();

      // And the account settings page no longer exposes the user's email
      await page.goto(SETTINGS_PAGE, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".usa-alert--error")).toBeVisible({
        timeout: TIMEOUT,
      });
      await expect(page.locator(EMAIL_INPUT)).toHaveCount(0);

      // And private user information is not accessible on public pages
      for (const publicPage of PUBLIC_PAGES) {
        await page.goto(publicPage, { waitUntil: "domcontentloaded" });
        await expectLoggedOut(page);
        await expect(page.locator("body")).not.toContainText(email);
      }

      // When the user logs in again (new seeded session token; the old one was revoked)
      await authenticateE2eUser(page, context, isMobile, LOGOUT_TEST_USER);

      // Then the user can access their authorized content
      await page.goto(AUTHENTICATED_PAGE, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(new RegExp(`${AUTHENTICATED_PAGE}$`));
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: TIMEOUT,
      });
      await expectLoggedIn(page);
      expect((await getSessionState(page)).isLoggedIn).toBe(true);
    },
  );
});
