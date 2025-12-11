import {
  expect,
  // NextFixture,
  test,
} from "next/experimental/testmode/playwright";

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
  await page.goto("/newsletter", { waitUntil: "domcontentloaded" });
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

test.afterEach(async ({ context }) => {
  await context.close();
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle(/Subscribe | Simpler.Grants.gov/);
});

/*
  note that most of these tests are currently skipped, and will be revisited in

  https://github.com/HHS/simpler-grants-gov/issues/5152

  we will need to figure out a way to mock out the calls to sendy, which may likely
  mean mocking out the server action call. Unclear how to do that, may need to proxy it
  through a normal API call or something.
*/

test.skip("client side errors", async ({ page }) => {
  await page.getByRole("button", { name: /subscribe/i }).click();

  // Verify client-side errors for required fields
  await expect(page.getByTestId("errorMessage")).toHaveCount(2);
  await expect(page.getByText("Please enter a name.")).toBeVisible();
  await expect(page.getByText("Please enter an email address.")).toBeVisible();
});

test.skip("successful signup", async ({ next, page }) => {
  // mockAPIEndpoints(next);

  await page.getByLabel("First Name (required)").fill("Apple");
  await page.getByLabel("Email (required)").fill("name@example.com");

  const subscribeButton = page.getByRole("button", {
    name: /subscribe/i,
  });
  await expect(subscribeButton).toBeVisible();
  await subscribeButton.click();

  await expect(
    page.getByRole("heading", { name: /subscribed/i }),
  ).toBeVisible();
});

test.skip("error during signup", async ({ next, page }) => {
  // mockAPIEndpoints(next, "Error with subscribing");

  await page.getByLabel("First Name (required)").fill("Apple");
  await page.getByLabel("Email (required)").fill("name@example.com");

  await page.getByRole("button", { name: /subscribe/i }).click();

  await expect(page.getByTestId("errorMessage")).toHaveCount(1);
  await expect(
    page.getByText(/an error occurred when trying to save your subscription./i),
  ).toBeVisible();
});
