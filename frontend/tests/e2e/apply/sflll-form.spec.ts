import { test } from "@playwright/test";
import { createSpoofedSessionCookie } from "tests/e2e/loginUtils";
import playwrightEnv from "tests/e2e/playwright-env";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import { fillSflllFormUtils } from "tests/e2e/utils/forms/fill-sflll-form-utils";
import { userInterfaceSflllFormUtils } from "tests/e2e/utils/forms/user-interface-sflll-form-utils";
import { validationSflllFormUtils } from "tests/e2e/utils/forms/validation-sflll-form-utils";
import { ensurePageClosed } from "tests/e2e/utils/test-lifecycle-helpers";

const { baseUrl, testOrgLabel } = playwrightEnv;
const OPPORTUNITY_ID = "f7a1c2b3-4d5e-6789-8abc-1234567890ab";
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;

test.describe("Test Suite - SFLLL Form", () => {

  // Ensure the page is closed after each test
  test.afterEach(async ({ page }) => {
    await ensurePageClosed(page);
  });

  test.beforeEach(async ({ context }) => {
    await createSpoofedSessionCookie(context);
  });
  // Set a timeout of 120 seconds for the test
  test.setTimeout(120000);

  test("Fill - SFLLL Form", async ({ page }, testInfo) => {
    await page.goto(`${baseUrl}${OPPORTUNITY_URL}`, {
      waitUntil: "load",
      timeout: 30000,
    });

    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
    await fillSflllFormUtils(testInfo, page);
  });

  test("UI - SFLLL Form", async ({ page }, testInfo) => {
    await page.goto(`${baseUrl}${OPPORTUNITY_URL}`, {
      waitUntil: "load",
      timeout: 30000,
    });

    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
    await userInterfaceSflllFormUtils(testInfo, page);
  });

  test("Validation - SFLLL Form", async ({ page }, testInfo) => {
    await page.goto(`${baseUrl}${OPPORTUNITY_URL}`, {
      waitUntil: "load",
      timeout: 30000,
    });

    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
    await validationSflllFormUtils(testInfo, page);
  });

  test("Smoke test - SFLLL Form", async ({ page }, testInfo) => {
    await page.goto(`${baseUrl}${OPPORTUNITY_URL}`, {
      waitUntil: "load",
      timeout: 30000,
    });

    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
    await userInterfaceSflllFormUtils(testInfo, page);
    await fillSflllFormUtils(testInfo, page);
  });

  test("Regression test - SFLLL Form", async ({ page }, testInfo) => {
    await page.goto(`${baseUrl}${OPPORTUNITY_URL}`, {
      waitUntil: "load",
      timeout: 30000,
    });

    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
    await userInterfaceSflllFormUtils(testInfo, page);
    await validationSflllFormUtils(testInfo, page);
    await fillSflllFormUtils(testInfo, page);
  });
});
