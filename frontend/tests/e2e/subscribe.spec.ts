/**
 * @feature Newsletter subscription
 * @featureFile frontend/tests/e2e/subscribe.feature
 * @scenario Show the subscription page title
 * @scenario Show errors when submitting empty form
 * @scenario Subscribe with valid name and email
 * @scenario Show error when subscription fails
 */

import { VALID_TAGS } from "tests/e2e/tags";

import {
  expect,
  // NextFixture,
  test,
} from "next/experimental/testmode/playwright";

import playwrightEnv from "./playwright-env";

const { FULL_REGRESSION } = VALID_TAGS;

const { targetEnv } = playwrightEnv;

// function mockAPIEndpoints(next: NextFixture, responseText = "1") {
//   next.onFetch((request: Request) => {
//     if (request.url.endsWith("/subscribe") && request.method === "POST") {
//       return new Response(responseText, {
//         status: 200,
//         headers: {
//           "Content-Type": "text/plain",
//         },
//       });
//     }

//     return "abort";
//   });
// }

test.beforeEach(async ({ page }) => {
  const timeout = targetEnv === "staging" ? 180000 : 60000;

  // Background: Given I open "/newsletter"
  await page.goto("/newsletter", { waitUntil: "domcontentloaded", timeout });
  await page.route("**/newsletter", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }
  });
});

/**
 * @scenario Show the subscription page title
 */
test("has title", { tag: [FULL_REGRESSION] }, async ({ page }) => {
  // Then the page title should match "Subscribe | Simpler.Grants.gov"
  await expect(page).toHaveTitle(/Subscribe | Simpler.Grants.gov/);
});

/*
  note that most of these tests are currently skipped, and will be revisited in

  https://github.com/HHS/simpler-grants-gov/issues/5152

  we will need to figure out a way to mock out the calls to sendy, which may likely
  mean mocking out the server action call. Unclear how to do that, may need to proxy it
  through a normal API call or something.
*/

/**
 * @scenario Show errors when submitting empty form
 */
test.skip("client side errors", async ({ page }) => {
  // When I click "Subscribe" button
  await page.getByRole("button", { name: /subscribe/i }).click();

  // Verify client-side errors for required fields
  // Then I should see 2 error messages
  await expect(page.getByTestId("errorMessage")).toHaveCount(2);

  // And I should see "Please enter a name."
  await expect(page.getByText("Please enter a name.")).toBeVisible();

  // And I should see "Please enter an email address."
  await expect(page.getByText("Please enter an email address.")).toBeVisible();
});

/**
 * @scenario Subscribe with valid name and email
 */
test.skip("successful signup", async ({ /* next */ page }) => {
  // mockAPIEndpoints(next);

  // When I fill "First Name (required)" with "Apple"
  await page.getByLabel("First Name (required)").fill("Apple");

  // And I fill "Email (required)" with "name@example.com"
  await page.getByLabel("Email (required)").fill("name@example.com");

  // And I click "Subscribe" button
  const subscribeButton = page.getByRole("button", {
    name: /subscribe/i,
  });
  await expect(subscribeButton).toBeVisible();
  await subscribeButton.click();

  // Then I should see "Subscribed" heading
  await expect(
    page.getByRole("heading", { name: /subscribed/i }),
  ).toBeVisible();
});

/**
 * @scenario Show error when subscription fails
 */
test.skip("error during signup", async ({ /* next */ page }) => {
  // mockAPIEndpoints(next, "Error with subscribing");

  // When I fill "First Name (required)" with "Apple"
  await page.getByLabel("First Name (required)").fill("Apple");

  // And I fill "Email (required)" with "name@example.com"
  await page.getByLabel("Email (required)").fill("name@example.com");

  // And I click "Subscribe" button
  await page.getByRole("button", { name: /subscribe/i }).click();

  // Then I should see 1 error message
  await expect(page.getByTestId("errorMessage")).toHaveCount(1);

  // And I should see "An error occurred when trying to save your subscription."
  await expect(
    page.getByText(/an error occurred when trying to save your subscription./i),
  ).toBeVisible();
});
