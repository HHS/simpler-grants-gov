/**
 * @feature Login Page Redirect
 * @featureFile e2e/login/features/login-redirect.feature
 * @scenario Redirect behavior of the /login page based on stored redirect URL
 */

import { expect, Page, test } from "@playwright/test";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";

const { AUTH, SMOKE, CORE_REGRESSION, FULL_REGRESSION } = VALID_TAGS;
const { baseUrl, targetEnv } = playwrightEnv;

const TEST_REDIRECT_TIMEOUT = targetEnv === "local" ? 5000 : 30000;

const setupLoginRedirectSpoof = async (page: Page) => {
  // Clear session storage before each test
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    if (window.sessionStorage) {
      window.sessionStorage.clear();
    }
  });
  await page.context().addCookies([
    {
      name: "_ff",
      value: JSON.stringify({}),
      domain: baseUrl,
      path: "/",
    },
  ]);

  // Prevent navigation to external sites by redirecting back to base URL
  await page.route("**/*", async (route) => {
    const url = route.request().url();
    if (!url.startsWith(baseUrl)) {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: `<html><head><meta http-equiv="refresh" content="0;url=${baseUrl}/"></head></html>`,
      });
    } else {
      await route.continue();
    }
  });
};

// these tests do not actually test logging in, but only the behavior of the /login page
test.describe("Login Page Redirect", () => {
  test.beforeEach(async ({ page }) => {
    await setupLoginRedirectSpoof(page);
  });

  // Scenario: should redirect to home page when no redirect URL is stored
  test(
    "should redirect to home page when no redirect URL is stored",
    { tag: [AUTH, CORE_REGRESSION] },
    async ({ page }) => {
      // Given I navigate to the Simpler Grants site (done in beforeEach)
      // When I open the login page
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      // Then I am redirected to the home page
      await expect(page).toHaveURL("/");
    },
  );

  // Scenario: should redirect to stored URL after login
  test(
    "should redirect to stored URL after login",
    { tag: [SMOKE, AUTH] },
    async ({ page }) => {
      // Given I have stored "/grantor/opportunities" as the login redirect
      await page.evaluate(() => {
        sessionStorage.setItem("login-redirect", "/grantor/opportunities");
      });
      // When I open the login page
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(`/grantor/opportunities`);
    },
  );

  // Scenario: should redirect to home page when stored URL is empty
  test(
    "should redirect to home page when stored URL is empty",
    { tag: [AUTH, CORE_REGRESSION] },
    async ({ page }) => {
      // Given I have stored "/" as the login redirect
      await page.evaluate(() => {
        sessionStorage.setItem("login-redirect", "/");
      });
      // When I open the login page
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(TEST_REDIRECT_TIMEOUT);
      // Then I am redirected to the home page
      await expect(page).toHaveURL("/", { timeout: TEST_REDIRECT_TIMEOUT });
    },
  );

  // Scenario: should redirect to home page when stored URL is external
  test(
    "should redirect to home page when stored URL is external",
    { tag: [AUTH, SMOKE] },
    async ({ page }) => {
      // Given I have stored "https://external.com" as the login redirect
      await page.evaluate(() => {
        sessionStorage.setItem("login-redirect", "https://external.com");
      });
      // When I open the login page
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(TEST_REDIRECT_TIMEOUT);
      // Then I am redirected to the home page
      await expect(page).toHaveURL("/", { timeout: TEST_REDIRECT_TIMEOUT });
    },
  );

  // Scenario: should display "Redirecting..." text while redirecting
  test(
    'should display "Redirecting..." text while redirecting',
    { tag: [AUTH, FULL_REGRESSION] },
    async ({ page }) => {
      await page.evaluate(() => {
        sessionStorage.setItem("login-redirect", "/grantor/opportunities");
      });

      await page.goto("/login", { waitUntil: "domcontentloaded" });
      const redirectingText = page.getByText("Redirecting...");
      const redirectResult = await Promise.race([
        redirectingText
          .waitFor({ state: "visible", timeout: 2000 })
          .then(() => "message"),
        page
          .waitForURL("/grantor/opportunities", { timeout: 15000 })
          .then(() => "redirect"),
      ]);

      if (redirectResult === "message") {
        await expect(page).toHaveURL("/grantor/opportunities", {
          timeout: 15000,
        });
      }
    },
  );
});
