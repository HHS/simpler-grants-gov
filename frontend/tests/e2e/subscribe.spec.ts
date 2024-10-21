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
  await expect(page.getByText("Please enter a name.")).toBeVisible();
  await expect(page.getByText("Please enter an email address.")).toBeVisible();
});

//eslint-disable-next-line jest/no-disabled-tests
test.skip("successful signup", async ({ page }) => {
  // TODO: mock a successful response
  //
  // Old Method:
  // await page.route("http://127.0.0.1:3000/api/subscribe", (route) =>
  //   route.fulfill({
  //     status: 200,
  //     body: "true",
  //   }),
  // )

  // Fill out form
  await page.getByLabel("First Name (required)").fill("Apple");
  await page.getByLabel("Email (required)").fill("name@example.com");

  await page.getByRole("button", { name: /subscribe/i }).click();

  await expect(
    page.getByRole("heading", { name: /you’re subscribed/i }),
  ).toBeVisible();
});

//eslint-disable-next-line jest/no-disabled-tests
test.skip("error during signup", async ({ page }) => {
  // TODO: mock a error response
  //
  // Old Method:
  // await page.route("http://127.0.0.1:3000/api/subscribe", (route) =>
  //   route.fulfill({
  //     status: 500,
  //     json: {
  //       error:
  //         "Failed to subscribe user due to a server error. Try again later.",
  //     },
  //   }),
  // );

  // Fill out form
  await page.getByLabel("First Name (required)").fill("Apple");
  await page.getByLabel("Email (required)").fill("name@example.com");

  await page.getByRole("button", { name: /subscribe/i }).click();

  await expect(
    page.getByRole("heading", {
      name: "Failed to subscribe, due to a server error. Please try again later.",
    }),
  ).toBeVisible();
});
