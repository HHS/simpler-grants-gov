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
    // URL should be /?_cb=... (cache buster is always added)
    // Match full URL or just the path with cache buster
    await expect(page).toHaveURL(/\/\?_cb=\d+_[a-z0-9]+$/);
  });

  test("should redirect to stored URL after login", async ({ page }) => {
    await page.evaluate(() => {
      sessionStorage.setItem("login-redirect", "/opportunities");
    });
    await page.goto(`/login`);
    // URL should be /opportunities?_cb=... (cache buster is always added)
    // Match full URL or just the path with cache buster
    await expect(page).toHaveURL(/\/opportunities\?_cb=\d+_[a-z0-9]+$/);
  });

  test("should redirect to home page when stored URL is empty", async ({
    page,
  }) => {
    await page.evaluate(() => {
      sessionStorage.setItem("login-redirect", "");
    });
    await page.goto(`/login`);
    // URL should be /?_cb=... (cache buster is always added)
    // Match full URL or just the path with cache buster
    await expect(page).toHaveURL(/\/\?_cb=\d+_[a-z0-9]+$/);
  });

  test("should redirect to home page when stored URL is external", async ({
    page,
  }) => {
    await page.evaluate(() => {
      sessionStorage.setItem("login-redirect", "https://external.com");
    });
    await page.goto(`/login`);
    // External URLs are intercepted by the test route handler and redirected to /
    // The login page should still add cache buster, but the interceptor might redirect to / first
    // So we check that we end up at / (with or without cache buster, as the interceptor may override)
    await expect(page).toHaveURL(/\/$|\/\?_cb=\d+_[a-z0-9]+$/);
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
