/**
 * authenticateE2eUser is a high-level helper for E2E test authentication.
 *
 * - Local: spoofs a session using loginUtils.ts with a fake JWT cookie.
 * - Staging (standalone run): performs a real login with credentials and MFA
 *   using perform-login-utils.ts.
 * - Staging (full suite run): if a storageState session was injected via
 *   playwright.config.ts (setup project), the user is already authenticated
 *   and the full login flow is skipped automatically.
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

const { baseUrl, targetEnv, testOrgLabel } = playwrightEnv;

export async function authenticateE2eUser(
  page: Page,
  context: BrowserContext,
  isMobile: boolean,
): Promise<void> {
  if (targetEnv === "local") {
    await createSpoofedSessionCookie(context);
    await page.waitForTimeout(1000);
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

    const signInModal = page.locator('[role="dialog"], #sign-in-modal');
    if (await signInModal.isVisible()) {
      await selectLocalTestUser(page, testOrgLabel);
      await page.waitForTimeout(2000);
    }
  } else if (targetEnv === "staging") {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

    // If storageState was injected by the setup project in playwright.config.ts,
    // the session cookie is already present and the user is logged in.
    // Skip the full MFA login flow in that case.
    const signOutButton = page.locator(
      'button:has-text("Sign out"), a:has-text("Sign out")',
    );
    const isAlreadyLoggedIn = await signOutButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (isAlreadyLoggedIn) {
      // Session was injected via storageState — nothing more to do
      // console.warn(
      //   "authenticateE2eUser: session already active, skipping login",
      // );
    } else {
      // Standalone run or session expired — perform full MFA login.
      // Do NOT clear cookies here: login.gov tracks session state across
      // the redirect flow and clearing cookies mid-suite can cause
      // rate-limiting or broken OAuth state.
      const signOutButton = await performStagingLogin(page, isMobile);
      if (!signOutButton) {
        throw new Error(
          "signOutButton was not found after performStagingLogin",
        );
      }
      await expect(signOutButton).toHaveCount(1, { timeout: 120_000 });
    }
  } else {
    throw new Error(`Unsupported env ${targetEnv}`);
  }

  if (isMobile) {
    await openMobileNav(page);
  }
}
