/**
 * authenticateE2eUser is a high-level helper for E2E test authentication.
 *
 * - Local: spoofs a session using loginUtils.ts with a fake JWT cookie.
 * - Staging: performs a real login with credentials and MFA using perform-login-utils.ts.
 *
 * This provides a single authentication helper across environments.
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
    const signOutButton = await performStagingLogin(page, isMobile);
    if (!signOutButton) {
      throw new Error("signOutButton was not found after performStagingLogin");
    }
    await expect(signOutButton).toHaveCount(1, { timeout: 120_000 });
  } else {
    throw new Error(`Unsupported env ${targetEnv}`);
  }

  if (isMobile) {
    await openMobileNav(page);
  }
}
