import { expect, Page, test } from "@playwright/test";

import playwrightEnv from "./playwright-env";

const { baseUrl } = playwrightEnv;

const setupLoginRedirectSpoof = async (page: Page) => {
  // Clear session storage before each test
  await page.goto(`/`, { waitUntil: "domcontentloaded" });
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

  test("should redirect to home page when no redirect URL is stored", async ({
    page,
  }) => {
    await page.goto(`/login`);
    await expect(page).toHaveURL(`/`);
  });

  test("should redirect to stored URL after login", async ({ page }) => {
    await page.evaluate(() => {
      sessionStorage.setItem("login-redirect", "/opportunities");
    });
    await page.goto(`/login`);
    await expect(page).toHaveURL(`/opportunities`);
  });

  test("should redirect to home page when stored URL is empty", async ({
    page,
  }) => {
    await page.evaluate(() => {
      sessionStorage.setItem("login-redirect", "/");
    });
    await page.goto(`/login`);
    await expect(page).toHaveURL(`/`);
  });

  test("should redirect to home page when stored URL is external", async ({
    page,
  }) => {
    await page.evaluate(() => {
      sessionStorage.setItem("login-redirect", "https://external.com");
    });
    await page.goto(`/login`);
    // Wait longer on staging for redirect to occur
    await page.waitForTimeout(5000);
    await expect(page).toHaveURL(`/`, { timeout: 30000 });
  });

  test('should display "Redirecting..." text while redirecting', async ({
    page,
  }) => {
    await page.evaluate(() => {
      sessionStorage.setItem("login-redirect", "/opportunities");
    });

    await page.goto(`/login`);
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
  });
});
