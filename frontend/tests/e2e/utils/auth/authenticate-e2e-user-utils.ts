/**
 * authenticateE2eUser is a high-level helper for E2E test authentication.
 *
 * Both local and staging use the same mechanism: fetch a session token for a
 * seeded test user from the staging-only internal endpoint
 * POST /v1/internal/e2e-token (authorized by the test-user-manager API key),
 * then encode it into a spoofed client session cookie. This means tests can be
 * run individually or as part of the full suite without any changes.
 *
 * Test users are chosen via a TestUserKey (see test-users.ts). Spoofing is the
 * only supported path — seeded test users have no login credentials or MFA — so
 * any failure throws and fails the test rather than falling back to a real login.
 */

import { type BrowserContext, type Page } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { openMobileNav } from "tests/e2e/playwrightUtils";
import { createSpoofedSessionCookie } from "tests/e2e/utils/auth/login-utils";
import {
  getTestUserId,
  type TestUserKey,
} from "tests/e2e/utils/auth/test-users";

const { baseUrl, apiUrl, testUserManagerApiKey } = playwrightEnv;

// Fetches a server-side session token for a test user by calling the internal
// e2e-token endpoint with the manager API key and the target user id.
const fetchE2eSessionToken = async (userId: string): Promise<string> => {
  if (!testUserManagerApiKey) {
    throw new Error(
      "Unable to spoof login: test user manager API key is not set",
    );
  }
  const response = await fetch(`${apiUrl}/v1/internal/e2e-token`, {
    headers: {
      "X-API-Key": testUserManagerApiKey,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
  if (!response.ok) {
    throw new Error(`unable to fetch e2e user token: ${response.status}`);
  }
  const json = (await response.json()) as { data: { token: string } };
  return json.data.token;
};

export async function authenticateE2eUser(
  page: Page,
  context: BrowserContext,
  isMobile: boolean,
  testUserKey: TestUserKey = "primaryOrgAdmin",
): Promise<void> {
  const userId = getTestUserId(testUserKey);
  const token = await fetchE2eSessionToken(userId);
  await createSpoofedSessionCookie(context, token);

  // Give the spoofed session cookie a moment to settle before navigating, then
  // let the page hydrate the authenticated state after load. These waits are
  // carried over from the previous local flow to avoid a race where the nav
  // renders before the client resolves the session.
  await page.waitForTimeout(1000);
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  if (isMobile) {
    await openMobileNav(page);
  }
}
