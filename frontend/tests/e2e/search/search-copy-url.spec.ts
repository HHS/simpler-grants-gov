import { test, expect } from "@playwright/test";

test("should copy search query URL to clipboard", async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto("/search");
  
  const searchInput = page.getByLabel('Search terms Enter keywords,');
  await searchInput.fill("education grants");
  await searchInput.press('Enter');
  
  await page.waitForURL(/.*search.*query=education\+grants.*/, { timeout: 10000 });
  
  // selector for copy buttons
  const copyButton = page.locator("button:has-text('Copy'), a:has-text('Copy')").first();
  await copyButton.waitFor({ timeout: 10000 });
  await copyButton.click();
  
  const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardContent).toContain("/search?query=education+grants");
})