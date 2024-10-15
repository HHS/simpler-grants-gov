/* eslint-disable testing-library/prefer-screen-queries */
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/subscribe");
});

test.afterEach(async ({ context }) => {
  await context.close();
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle(/Subscribe | Simpler.Grants.gov/);
});

test("client side errors", async ({ page }) => {
  await page.getByRole("button", { name: /subscribe/i }).click();

  // Verify client-side errors for required fields
  await expect(page.getByTestId("errorMessage")).toHaveCount(2);
  await expect(page.getByText("Enter your first name.")).toBeVisible();
  await expect(page.getByText("Enter your email address.")).toBeVisible();
});

test("successful signup", async ({ page }) => {
  // TODO: determine if it's worth hitting this endpoint vs. mocking a specific response
  await page.route("http://127.0.0.1:3000/api/subscribe", (route) =>
    route.fulfill({
      status: 200,
      body: "true",
    }),
  );

  // Fill out form
  await page.getByLabel("First Name (required)").fill("Apple");
  await page.getByLabel("Email (required)").fill("name@example.com");

  await page.getByRole("button", { name: /subscribe/i }).click();

  await expect(
    page.getByRole("heading", { name: /you’re subscribed/i }),
  ).toBeVisible();
});

test("error during signup", async ({ page }) => {
  await page.route("http://127.0.0.1:3000/api/subscribe", (route) =>
    route.fulfill({
      status: 500,
      json: {
        error:
          "Failed to subscribe user due to a server error. Try again later.",
      },
    }),
  );

  // Fill out form
  await page.getByLabel("First Name (required)").fill("Apple");
  await page.getByLabel("Email (required)").fill("name@example.com");

  await page.getByRole("button", { name: /subscribe/i }).click();

  await expect(
    page.getByRole("heading", { name: "An error occurred" }),
  ).toBeVisible();
});
