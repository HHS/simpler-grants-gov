import { expect, Page, test } from "@playwright/test";
import { baseURL } from "tests/playwright.config";

const setUpLocalLogin = async (page: Page) => {
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
    if (!url.startsWith(baseURL)) {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: `<html><head><meta http-equiv="refresh" content="0;url=${baseURL}/"></head></html>`,
      });
    } else {
      await route.continue();
    }
  });
};

test.describe("Login Page Redirect", () => {
  // disable login spoofing for now, can turn on for local if we want

  // test.beforeEach(async ({ page }) => {
  //   await setUpLocalLogin(page);
  // });

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
      sessionStorage.setItem("login-redirect", "");
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
    await expect(page).toHaveURL(`/`);
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
