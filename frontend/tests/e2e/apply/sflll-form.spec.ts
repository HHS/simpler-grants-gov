import { test } from "@playwright/test";
import { createSpoofedSessionCookie } from "tests/e2e/loginUtils";
import playwrightEnv from "tests/e2e/playwright-env";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import { fillSflllForm } from "tests/e2e/utils/forms/fill-sflll-form-utils";
import { validateSflllUI} from "tests/e2e/utils/forms/user-interface-sflll-form-utils";
import { validateSflllFormRequiredFields } from "tests/e2e/utils/forms/validation-sflll-form-utils";
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
    await fillSflllForm(testInfo, page);
  });

  test("UI - SFLLL Form", async ({ page }, testInfo) => {
    await page.goto(`${baseUrl}${OPPORTUNITY_URL}`, {
      waitUntil: "load",
      timeout: 30000,
    });

    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
    await validateSflllUI(testInfo, page);
  });

  test("Validation - SFLLL Form", async ({ page }, testInfo) => {
    await page.goto(`${baseUrl}${OPPORTUNITY_URL}`, {
      waitUntil: "load",
      timeout: 30000,
    });

    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
    await validateSflllFormRequiredFields(testInfo, page);
  });

  test("Smoke test - SFLLL Form", async ({ page }, testInfo) => {
    await page.goto(`${baseUrl}${OPPORTUNITY_URL}`, {
      waitUntil: "load",
      timeout: 30000,
    });

    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
    await validateSflllUI(testInfo, page);
    await fillSflllForm(testInfo, page);
  });

  test("Regression test - SFLLL Form", async ({ page }, testInfo) => {
    await page.goto(`${baseUrl}${OPPORTUNITY_URL}`, {
      waitUntil: "load",
      timeout: 30000,
    });

    await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
    await validateSflllUI(testInfo, page);
    await validateSflllFormRequiredFields(testInfo, page);
    await fillSflllForm(testInfo, page);
  });
});
