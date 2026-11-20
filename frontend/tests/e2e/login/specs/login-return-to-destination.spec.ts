/**
 * @feature Sign in returns to the original page
 * @featureFile e2e/login/features/login-return-to-destination.feature
 * @scenario Local mock Login.gov round trip from an auth-gated page (including a "Sign in" click before hydration), and browser Back from the IdP
 */

import { expect, test, type Page } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";

const { SMOKE, FULL_REGRESSION } = VALID_TAGS;
const { baseUrl, targetEnv } = playwrightEnv;

const TIMEOUT = 30000;

// The local API returns to http://localhost:3000/api/auth/callback
// (LOGIN_FINAL_DESTINATION in api/local.env and ci-frontend-e2e.yml). sessionStorage
// and cookies do not carry over between 127.0.0.1 and localhost, so the flow has to
// start on localhost.
const appOrigin = (() => {
  const url = new URL(baseUrl);
  if (url.hostname === "127.0.0.1") url.hostname = "localhost";
  return url.origin;
})();

const ORIGINAL_PATH = "/workspace?utm_source=e2e&example=value";
const ORIGINAL_URL = `${appOrigin}${ORIGINAL_PATH}`;

// The API creates this user on first login.
const MOCK_IDP_SUBJECT = "e2e-login-return-to-destination";

const ACCOUNT_MENU = 'button[aria-controls="Account"]';

const mockIdpUsernameInput = (page: Page) =>
  page.locator('input[name="username"]');

const signedOutAlert = (page: Page) =>
  page.locator(".usa-alert--error").filter({ hasText: "Not signed in" });

// The page's own "Sign in" button, not the header's "Sign In" link.
const pageSignInLink = (page: Page) =>
  page.getByRole("main").getByRole("link", { name: "Sign in", exact: true });

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
    await page.goto(ORIGINAL_URL, { waitUntil: "domcontentloaded" });
    await expectSignedOutGatedPage(page);

    // Deliberately no hydration wait: a click before hydration must still return
    // the user, via the Referer fallback in /api/auth/login.
    await pageSignInLink(page).click();

    await expect(mockIdpUsernameInput(page)).toBeVisible({ timeout: TIMEOUT });
  });

  test(
    "signing in returns to the exact original pathname and query",
    { tag: [SMOKE] },
    async ({ page }) => {
      await mockIdpUsernameInput(page).fill(MOCK_IDP_SUBJECT);
      await page.getByRole("button", { name: "Sign-in" }).click();

      await expect(page).toHaveURL(ORIGINAL_URL, { timeout: TIMEOUT });
      expect(new URL(page.url()).searchParams.get("utm_source")).toBe("e2e");

      await expect(page.locator(ACCOUNT_MENU)).toHaveCount(1, {
        timeout: TIMEOUT,
      });
      await expect(signedOutAlert(page)).toHaveCount(0);
    },
  );

  test(
    "browser Back from Login.gov returns to the original page, still signed out",
    { tag: [FULL_REGRESSION] },
    async ({ page }) => {
      const mainFrameNavigations: string[] = [];
      page.on("framenavigated", (frame) => {
        if (frame === page.mainFrame()) mainFrameNavigations.push(frame.url());
      });

      await page.goBack({ waitUntil: "domcontentloaded" });

      await expectSignedOutGatedPage(page);

      // let any automatic sign-in restart or redirect loop surface before asserting
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(ORIGINAL_URL);
      expect(
        mainFrameNavigations.filter((url) => url !== ORIGINAL_URL),
      ).toEqual([]);
    },
  );
});
