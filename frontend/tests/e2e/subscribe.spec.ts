/* eslint-disable testing-library/prefer-screen-queries */

import {
  expect,
  NextFixture,
  test,
} from "next/experimental/testmode/playwright";

function mockAPIEndpoints(next: NextFixture, responseText = "1") {
  next.onFetch((request: Request) => {
    if (request.url.endsWith("/subscribe") && request.method === "POST") {
      return new Response(responseText, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    return "abort";
  });
}
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

test("successful signup", async ({ next, page }) => {
  mockAPIEndpoints(next);

  await page.getByLabel("First Name (required)").fill("Apple");
  await page.getByLabel("Email (required)").fill("name@example.com");

  await page.getByRole("button", { name: /subscribe/i }).click();

  await expect(
    page.getByRole("heading", { name: /you['’]re subscribed/i }),
  ).toBeVisible();
});

test("error during signup", async ({ next, page }) => {
  mockAPIEndpoints(next, "Error with subscribing");

  await page.getByLabel("First Name (required)").fill("Apple");
  await page.getByLabel("Email (required)").fill("name@example.com");

  await page.getByRole("button", { name: /subscribe/i }).click();

  await expect(page.getByTestId("errorMessage")).toHaveCount(1);
  await expect(
    page.getByText(/an error occurred when trying to save your subscription./i),
  ).toBeVisible();
});
