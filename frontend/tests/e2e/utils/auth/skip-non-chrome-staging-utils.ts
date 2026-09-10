import { test, TestInfo } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";

/**
 * Staging MFA login is limited to Chrome to avoid OTP rate-limiting.
 * Call inside a test.beforeEach in any spec that authenticates against staging.
 */
export function skipNonChromeOnStaging(testInfo: TestInfo): void {
  if (playwrightEnv.targetEnv !== "local") {
    test.skip(
      testInfo.project.name !== "Chrome",
      "Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
    );
  }
}

/**
 * Skip WebKit tests for submission specs due to widespread flakiness.
 * Only skips in local environment; staging runs Chrome-only anyway due to MFA constraints.
 * Call inside a test.beforeEach in submission spec files.
 */
export function skipWebkit(testInfo: TestInfo): void {
  test.skip(
    testInfo.project.name === "Webkit",
    "Webkit tests are flaky in CI - reenable once resolved",
  );
}
