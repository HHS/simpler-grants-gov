import { test, expect } from "@playwright/test";
import { fillSearchInputAndSubmit } from "./searchSpecUtil";

test("should copy search query URL to clipboard", async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto("/search");
  
  const searchTerm = "education grants";
  await fillSearchInputAndSubmit(searchTerm, page);
  await page.click("button:has-text('Search')");
  await page.waitForSelector(".search-results, .result-item", { timeout: 5000 });
  
  // Try multiple selectors for the copy button
  const copySelectors = [
    "a:has-text('Copy this search query')",
  ]
  
  // Increase timeout for clipboard operations
  await page.waitForTimeout(300);
  const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
  const encodedTerm = encodeURIComponent(searchTerm).replace(/%20/g, "+");
  expect(clipboardContent).toContain(`/search?keywords=${encodedTerm}`);
});