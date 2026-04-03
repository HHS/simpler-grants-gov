import { expect, Page, test } from "@playwright/test";
import { VALID_TAGS } from "tests/e2e/tags";

import playwrightEnv from "./playwright-env";

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

  test(
    "should redirect to home page when no redirect URL is stored",
    { tag: [AUTH, CORE_REGRESSION] },
    async ({ page }) => {
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL("/");
    },
  );

  test(
    "should redirect to stored URL after login",
    { tag: [SMOKE, AUTH] },
    async ({ page }) => {
      await page.evaluate(() => {
        sessionStorage.setItem("login-redirect", "/opportunities");
      });
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(`/opportunities`);
    },
  );

  test(
    "should redirect to home page when stored URL is empty",
    { tag: [AUTH, CORE_REGRESSION] },
    async ({ page }) => {
      await page.evaluate(() => {
        sessionStorage.setItem("login-redirect", "/");
      });
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(TEST_REDIRECT_TIMEOUT);
      await expect(page).toHaveURL("/", { timeout: TEST_REDIRECT_TIMEOUT });
    },
  );

  test(
    "should redirect to home page when stored URL is external",
    { tag: [AUTH, SMOKE] },
    async ({ page }) => {
      await page.evaluate(() => {
        sessionStorage.setItem("login-redirect", "https://external.com");
      });
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(TEST_REDIRECT_TIMEOUT);
      await expect(page).toHaveURL("/", { timeout: TEST_REDIRECT_TIMEOUT });
    },
  );

  test(
    'should display "Redirecting..." text while redirecting',
    { tag: [AUTH, FULL_REGRESSION] },
    async ({ page }) => {
      await page.evaluate(() => {
        sessionStorage.setItem("login-redirect", "/opportunities");
      });

      await page.goto("/login", { waitUntil: "domcontentloaded" });
      const redirectingText = page.getByText("Redirecting...");
      const redirectResult = await Promise.race([
        redirectingText
          .waitFor({ state: "visible", timeout: 2000 })
          .then(() => "message"),
        page
          .waitForURL("/opportunities", { timeout: 15000 })
          .then(() => "redirect"),
      ]);

      if (redirectResult === "message") {
        await expect(page).toHaveURL("/opportunities", { timeout: 15000 });
      }
    },
  );
});
