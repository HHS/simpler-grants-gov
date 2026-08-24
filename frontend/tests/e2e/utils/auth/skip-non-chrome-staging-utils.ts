import { test, TestInfo } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";

/**
 * Call inside a test.beforeEach in any spec that authenticates against staging.
 */
export function skipNonChromeOnStaging(testInfo: TestInfo): void {
  if (playwrightEnv.targetEnv !== "local") {
    test.skip(
      testInfo.project.name !== "Chrome",
    );
  }
}
