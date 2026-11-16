/**
 * @feature Sign in returns to the original page
 * @featureFile e2e/login/features/login-return-to-destination.feature
 * @scenario Local mock Login.gov round trip from an auth-gated page, and browser Back from the IdP
 */

import { expect, test, type Page } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";

const { SMOKE, FULL_REGRESSION } = VALID_TAGS;
const { baseUrl, targetEnv } = playwrightEnv;

const TIMEOUT = 30000;

// The local API sends the browser back to LOGIN_FINAL_DESTINATION, which is
// http://localhost:3000/api/auth/callback (api/local.env and ci-frontend-e2e.yml).
// The saved destination (sessionStorage) and the session cookie are both scoped to
// the origin, so the flow has to start on that same origin rather than 127.0.0.1.
const appOrigin = (() => {
  const url = new URL(baseUrl);
  if (url.hostname === "127.0.0.1") url.hostname = "localhost";
  return url.origin;
})();

// Auth-gated page, with a query string that must survive the round trip.
const ORIGINAL_PATH = "/workspace?utm_source=e2e&example=value";
const ORIGINAL_URL = `${appOrigin}${ORIGINAL_PATH}`;

// Subject entered on the mock IdP form. The API creates the user on first login.
const MOCK_IDP_SUBJECT = "e2e-login-return-to-destination";

const ACCOUNT_MENU = 'button[aria-controls="Account"]';

const mockIdpUsernameInput = (page: Page) =>
  page.locator('input[name="username"]');

const signedOutAlert = (page: Page) =>
  page.locator(".usa-alert--error").filter({ hasText: "Not signed in" });

// The page's own "Sign in" button, not the header's "Sign In" link.
const pageSignInLink = (page: Page) =>
  page.getByRole("main").getByRole("link", { name: "Sign in", exact: true });

// KNOWN PRODUCTION RACE: "Sign in" is a plain link that saves the current page as
// the post-sign-in destination only in its client-side click handler
// (LoginLink in src/components/core/LoginButton.tsx). A click before hydration
// still navigates to Login.gov but saves nothing, and the user comes back to "/".
// Nothing visible distinguishes the two cases, so the usual "re-click until it
// works" pattern cannot apply. Wait for the network to go idle instead: the app's
// mounted-only session fetch keeps the page busy until the client app is running.
// Remove this wait once the race is fixed in the app.
const waitForPageInteractive = async (page: Page) => {
  await page.waitForLoadState("networkidle");
};

const expectSignedOutGatedPage = async (page: Page) => {
  await expect(page).toHaveURL(ORIGINAL_URL);
  await expect(signedOutAlert(page)).toBeVisible({ timeout: TIMEOUT });
  await expect(pageSignInLink(page)).toBeVisible();
  await expect(page.locator(ACCOUNT_MENU)).toHaveCount(0);
};

test.describe("Sign in returns to the original page", () => {
  test.skip(
    targetEnv !== "local",
    "Uses the local mock Login.gov server, which only exists in the local stack",
  );
  // WebKit applies the app's CSP upgrade-insecure-requests to http://localhost, so
  // the page's scripts never load and "Sign in" never hydrates. Firefox has not
  // been validated against the local stack.
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Local sign-in round trip runs only on Chromium",
  );

  test.beforeEach(async ({ page }) => {
    // Given I am signed out on an auth-gated page whose URL has a query string
    await page.goto(ORIGINAL_URL, { waitUntil: "domcontentloaded" });
    await expectSignedOutGatedPage(page);

    // When I choose to sign in
    await waitForPageInteractive(page);
    await pageSignInLink(page).click();

    // Then I reach the Login.gov sign-in page (local mock)
    await expect(mockIdpUsernameInput(page)).toBeVisible({ timeout: TIMEOUT });
  });

  // Scenario: signing in returns to the exact original page, including its query string
  test(
    "signing in returns to the exact original pathname and query",
    { tag: [SMOKE] },
    async ({ page }) => {
      // When I complete sign-in on Login.gov
      await mockIdpUsernameInput(page).fill(MOCK_IDP_SUBJECT);
      await page.getByRole("button", { name: "Sign-in" }).click();

      // Then I return to the exact original pathname and query, not /login or /
      await expect(page).toHaveURL(ORIGINAL_URL, { timeout: TIMEOUT });
      expect(new URL(page.url()).searchParams.get("utm_source")).toBe("e2e");

      // And I see the signed-in version of the page
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: TIMEOUT,
      });
      await expect(signedOutAlert(page)).toHaveCount(0);
      await expect(page.locator(ACCOUNT_MENU)).toHaveCount(1);
    },
  );

  // Scenario: browser Back from Login.gov returns to the signed-out page without restarting sign-in
  test(
    "browser Back from Login.gov returns to the original page, still signed out",
    { tag: [FULL_REGRESSION] },
    async ({ page }) => {
      // Record every page load from here on, to catch a sign-in restart or loop
      const navigations: string[] = [];
      page.on("framenavigated", (frame) => {
        if (frame === page.mainFrame()) navigations.push(frame.url());
      });

      // When I use the browser Back button
      await page.goBack({ waitUntil: "domcontentloaded" });

      // Then I am back on the original page in the signed-out state
      await expectSignedOutGatedPage(page);

      // And sign-in does not start again on its own
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(ORIGINAL_URL);
      expect(navigations.filter((url) => url !== ORIGINAL_URL)).toEqual([]);
    },
  );
});
