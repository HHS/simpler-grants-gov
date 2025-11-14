import { expect, test } from "@playwright/test";

const BASE_URL = "http://127.0.0.1:3000";

test.describe("Login Page Redirect", () => {
  test.beforeEach(async ({ page }) => {
    // Clear session storage before each test
    await page.goto(`/`);
    await page.evaluate(() => {
      if (window.sessionStorage) {
        window.sessionStorage.clear();
      }
    });
    await page.context().addCookies([
      {
        name: "_ff",
        value: JSON.stringify({ authOn: true }),
        domain: "127.0.0.1",
        path: "/",
      },
    ]);

    // Prevent navigation to external sites by redirecting back to base URL
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      if (
        !url.startsWith(BASE_URL) &&
        !url.startsWith("http://127.0.0.1:8080")
      ) {
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `<html><head><meta http-equiv="refresh" content="0;url=${BASE_URL}/"></head></html>`,
        });
      } else {
        await route.continue();
      }
    });
  });

  test("should redirect to home page when no redirect URL is stored", async ({
    page,
  }) => {
    await page.goto(`/login`);
    await expect(page).toHaveURL("/");
  });

  test("should redirect to stored URL after login", async ({ page }) => {
    await page.evaluate(() => {
      sessionStorage.setItem("login-redirect", "/opportunities");
    });
    await page.goto(`/login`);
    await expect(page).toHaveURL("/opportunities");
  });

  test("should redirect to home page when stored URL is empty", async ({
    page,
  }) => {
    await page.evaluate(() => {
      sessionStorage.setItem("login-redirect", "");
    });
    await page.goto(`/login`);
    await expect(page).toHaveURL("/");
  });

  test("should redirect to home page when stored URL is external", async ({
    page,
  }) => {
    await page.evaluate(() => {
      sessionStorage.setItem("login-redirect", "https://external.com");
    });
    await page.goto(`/login`);
    // External URLs are redirected to /
    await expect(page).toHaveURL("/");
  });

  test('should display "Redirecting..." text while redirecting', async ({
    page,
  }) => {
    await page.evaluate(() => {
      sessionStorage.setItem("login-redirect", "/opportunities");
    });
    await page.goto(`/login`);
    await expect(page.getByText("Redirecting...")).toBeVisible();
  });
});
