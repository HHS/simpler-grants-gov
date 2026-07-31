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
