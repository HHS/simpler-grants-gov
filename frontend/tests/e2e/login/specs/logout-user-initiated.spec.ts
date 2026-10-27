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
import { findSignOutButton } from "tests/e2e/utils/auth/perform-login-utils";

const { SMOKE } = VALID_TAGS;
const { targetEnv } = playwrightEnv;

const AUTHENTICATED_PAGE = "/workspace";
// Public pages that render the header (and any user-specific state) for everyone.
const PUBLIC_PAGES = ["/", "/search"];
const ACCOUNT_MENU = 'button[aria-controls="Account"]';
const SIGN_IN = 'a:has-text("Sign In"), button:has-text("Sign In")';
const SESSION_ENDPOINT = "/api/auth/session";
const TIMEOUT = targetEnv === "local" ? 15000 : 60000;

// Use a seeded user that no other spec depends on concurrently. Logging out
// ends that user's server-side session, so do NOT use "primaryOrgAdmin" here:
// it is shared across workers/shards and would log out unrelated tests.
const LOGOUT_TEST_USER = "orgMember" as const;

type SessionState = { isLoggedIn?: boolean; email?: string | null };

const getSessionState = async (page: Page): Promise<SessionState> => {
  const response = await page.request.get(SESSION_ENDPOINT);
  return response.ok() ? ((await response.json()) as SessionState) : {};
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
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: TIMEOUT,
      });
      await expectLoggedIn(page);

      // Capture identity so we can prove it disappears from public pages later.
      const { email } = await getSessionState(page);
      expect(
        email,
        "seeded user should have an email on its session",
      ).toBeTruthy();

      // When the user initiates logout using the application's Sign out option
      const signOut = await findSignOutButton(page, isMobile);
      await expect(signOut).toBeVisible();
      await signOut.click();

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

      // And private user information is not accessible on public pages
      for (const publicPage of PUBLIC_PAGES) {
        await page.goto(publicPage, { waitUntil: "domcontentloaded" });
        await expectLoggedOut(page);
        await expect(page.locator("body")).not.toContainText(email as string);
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
