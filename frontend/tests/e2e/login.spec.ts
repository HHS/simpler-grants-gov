import { expect, test } from "@playwright/test";

const BASE_URL = "http://127.0.0.1:3000";

test.describe("Login Page Redirect", () => {
  test.beforeEach(async ({ page }) => {
    // Clear session storage before each test
    await page.goto(`${BASE_URL}/`);
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
      if (!url.startsWith(BASE_URL) && !url.startsWith("http://127.0.0.1:8080")) {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `<html><head><meta http-equiv="refresh" content="0;url=${BASE_URL}/"></head></html>`
        });
      } else {
        await route.continue();
      }
    });
  });

  test("should redirect to home page when no redirect URL is stored", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });

  test("should redirect to stored URL after login", async ({ page }) => {
    await page.evaluate(() => {
      sessionStorage.setItem("login-redirect", "/opportunities");
    });
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveURL(`${BASE_URL}/opportunities`);
  });

  test("should redirect to home page when stored URL is empty", async ({
    page,
  }) => {
    await page.evaluate(() => {
      sessionStorage.setItem("login-redirect", "");
    });
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });

  test("should redirect to home page when stored URL is external", async ({
    page,
  }) => {
    await page.evaluate(() => {
      sessionStorage.setItem("login-redirect", "https://external.com");
    });
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });

  test('should display "Redirecting..." text while redirecting', async ({
    page,
  }) => {
    await page.evaluate(() => {
      sessionStorage.setItem("login-redirect", "/opportunities");
    });
    await page.goto(`${BASE_URL}/login`);
    await expect(page.getByText("Redirecting...")).toBeVisible();
  });

  test("should handle redirect after successful login flow", async ({
    page,
  }) => {
    // Navigate to opportunities page
    await page.goto(`${BASE_URL}/opportunities`);
    
    // Wait for the sign-in button to be ready and click it
    const signInButton = page.getByTestId("sign-in-button");
    await signInButton.waitFor({ state: "visible", timeout: 10000 });
    await signInButton.click();

    // Wait for the modal heading to be visible
    const modalHeading = page.getByRole("heading", { name: "Sign in to Simpler.Grants.gov" });
    await modalHeading.waitFor({ state: "visible", timeout: 10000 });

    // Wait for the login link to be visible and click it
    const loginLink = page.getByRole("link", { name: /Sign in with Login.gov/i });
    await loginLink.waitFor({ state: "visible", timeout: 10000 });

    // Start waiting for navigation before clicking
    const navigationPromise = page.waitForNavigation();
    await loginLink.click();
    await navigationPromise;
  });
});
