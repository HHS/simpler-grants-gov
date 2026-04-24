/**
 * authenticateE2eUser is a high-level helper for E2E test authentication.
 *
 * - Local: spoofs a session using loginUtils.ts with a fake JWT cookie.
 * - Staging (standalone run): spoofs a session using loginUtils.ts with a
 *   fake JWT cookie or if spoofing is turned off (in the case where we want
 *   to specifically test the login process, for example, performs a real login
 *   with credentials and MFA using perform-login-utils.ts.
 *
 * This means tests can be run individually or as part of the full suite
 * without any changes — authentication is handled correctly in both cases.
 */

import { expect, type BrowserContext, type Page } from "@playwright/test";
import { createSpoofedSessionCookie } from "tests/e2e/loginUtils";
import playwrightEnv from "tests/e2e/playwright-env";
import { openMobileNav } from "tests/e2e/playwrightUtils";
import { performStagingLogin } from "tests/e2e/utils/perform-login-utils";
import { selectLocalTestUser } from "tests/e2e/utils/select-local-test-user-utils";

const { baseUrl, targetEnv, testUserLabel } = playwrightEnv;

// used to simulate a staging login without performing any login actions
// calls dedicated API endpoint to fetch session token for a test user
// and creates a frontend session based on the token from the response
// requires STAGING_TEST_USER_API_KEY to be set in env vars
const attemptStagingSpoof = async (
  context: BrowserContext,
): Promise<boolean> => {
  if (!playwrightEnv.stagingTestUserApiKey) {
    return false;
  }
  // get server side staging user JWT token
  try {
    const response = await fetch(
      `${playwrightEnv.apiUrl}/v1/internal/e2e-token`,
      {
        headers: { "X-API-Key": playwrightEnv.stagingTestUserApiKey },
        method: "POST",
      },
    );
    if (!response.ok) {
      throw new Error(
        `unable to fetch e2e staging user token: ${response.status}`,
      );
    }
    const json = (await response.json()) as { data: { token: string } };
    // encode it as a client JWT and set it on cookies
    await createSpoofedSessionCookie(context, json.data.token);
    return true;
  } catch (e) {
    console.error(`unable to spoof session cookie: ${(e as Error).message}`);
    throw e;
  }
};

export async function authenticateE2eUser(
  page: Page,
  context: BrowserContext,
  isMobile: boolean,
  attemptSpoof = true,
): Promise<void> {
  if (targetEnv === "local") {
    await createSpoofedSessionCookie(context);
    await page.waitForTimeout(1000);
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

    // Always switch to the org user so apply flow tests have org associations.
    // selectLocalTestUser is a no-op if the dev quick-login dropdown is absent.
    await selectLocalTestUser(page, testUserLabel);
    await page.waitForTimeout(2000);
  } else if (targetEnv === "staging") {
    if (attemptSpoof) {
      try {
        const spoofSuccessful = await attemptStagingSpoof(context);
        if (spoofSuccessful) {
          await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
          return;
        }
      } catch (e) {
        console.warn("unable to spoof staging login", (e as Error).message);
      }
    }
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

    // Check whether the user is already logged in before attempting MFA login.
    // This covers two cases:
    //   1. CI / full suite run with --workers=1: the browser is reused across
    //      tests so the session from the previous test is still active.
    //   2. storageState injected via the setup project in playwright.config.ts.
    //
    // Use a generous timeout — CI page hydration is slower than local, and the
    // nav Sign Out button may take several seconds to appear after domcontentloaded.
    const signOutLocator = page.locator(
      'button:has-text("Sign out"), a:has-text("Sign out")',
    );
    const isAlreadyLoggedIn = await signOutLocator
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (isAlreadyLoggedIn) {
      console.warn(
        "authenticateE2eUser: session already active, skipping MFA login",
      );
    } else {
      // No active session — perform full MFA login.
      // Do NOT clear cookies: login.gov tracks OAuth state across the redirect
      // flow and clearing cookies mid-suite can break the handshake.
      const freshSignOutButton = await performStagingLogin(page, isMobile);
      if (!freshSignOutButton) {
        throw new Error(
          "signOutButton was not found after performStagingLogin",
        );
      }

      // After OAuth callback (/api/auth/callback), the app must redirect back
      // to the home page and re-render the nav before Sign Out appears.
      // Wait for the URL to leave the callback path before asserting Sign Out.
      await page
        .waitForURL((url) => !url.pathname.includes("/api/auth/callback"), {
          timeout: 30000,
        })
        .catch(() => {
          // If still on callback URL after 30s, proceed anyway and let the
          // Sign Out assertion below give the definitive failure with context.
          console.warn(
            "authenticateE2eUser: still on /api/auth/callback after 30s — proceeding",
          );
        });

      await expect(freshSignOutButton).toHaveCount(1, { timeout: 120_000 });
    }
  } else {
    throw new Error(`Unsupported env ${targetEnv}`);
  }

  if (isMobile) {
    await openMobileNav(page);
  }
}
