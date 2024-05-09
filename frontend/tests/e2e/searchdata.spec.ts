/* eslint-disable testing-library/prefer-screen-queries */
import { test, expect } from "@playwright/test";

const API_URL = 'http://api-dev-1839587515.us-east-1.elb.amazonaws.com/';
const API_TOKEN = 'GTLnH7YFuibYWkhcyjiF';

// Request context is reused by all tests in the file.
let apiContext;

test.beforeAll(async ({ playwright }) => {
  apiContext = await playwright.request.newContext({
    // All requests we send go to this API endpoint.
    baseURL: API_URL,
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'X-Auth': API_TOKEN,
      'Content-Type': 'application/json',
    },
  });
});

test.afterAll(async () => {
  // Dispose all responses.
  await apiContext.dispose();
});

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.afterEach(async ({ context }) => {
  await context.close();
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle(/Simpler.Grants.gov/);
});

test("this is data", async ({
  context,
  browser,
}) => {
  const remoteContext = await browser.newContext();
  const remotePage = await remoteContext.newPage();
  await remotePage.goto('https://grants.gov/search-grants');
  const available = await remotePage.locator('div.usa-table-container--scrollable')
  // await available.waitFor({timeout: 10000});
  await new Promise(r => setTimeout(r, 2000));

  const ggData = await remotePage.locator('xpath=//*[@data-sort-value=*]').all();

  const oppIds = await Promise.all(ggData.map(async (item) => {
    const text = await item.textContent();
    return text;
  })) ;
  console.log(oppIds);

  // Dispose context once it's no longer needed.
  await context.close()

  const response = await apiContext.post("v0.1/opportunities/search", {
    data: {
      filters: {
        opportunity_status: {
          one_of: [
            "forecasted",
            "posted"
          ]
        }
      },
      pagination: {
        order_by: "post_date",
        page_offset: 1,
        page_size: 25,
        sort_direction: "descending"
      },
      query: "philadelphia"
    }
  })
  const sgData = await response.json();
  const sgOpIds = sgData.data.map((item) => {
    console.log(item)
    return item.opportunity_number;
  });
  console.log(sgOpIds);

});

test("skips to main content when navigating via keyboard", async ({
  page,
  browserName,
}) => {
  // Firefox does not tab through links automatically and requires updating preferences at the
  // system settings level; https://www.a11yproject.com/posts/macos-browser-keyboard-navigation/
  test.skip(
    browserName === "firefox" && !process.env.CI,
    "Firefox's built-in tabbing focuses only on buttons and inputs",
  );

  const header = page.getByTestId("header");
  const skipToMainContentLink = page.getByRole("link", {
    name: /skip to main content/i,
  });

  await expect(header).toBeInViewport({ ratio: 1 });
  const key = browserName === "webkit" ? "Alt+Tab" : "Tab";
  await page.keyboard.press(key);
  await expect(skipToMainContentLink).toBeFocused();
  await page.keyboard.press("Enter");

  // Veifies that skipping to main content means the page scrolls past the header
  await expect(header).not.toBeInViewport({ ratio: 1 });
});
