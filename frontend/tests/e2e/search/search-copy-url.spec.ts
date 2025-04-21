import { expect, test } from "@playwright/test";

test("should copy search query URL to clipboard", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/search");
  
  const searchInput = page.getByLabel("Search terms Enter keywords,");
  await searchInput.fill("education grants");
  await searchInput.press("Enter");
  
  await page.waitForURL(/.*search.*query=education\+grants.*/, {
    timeout: 10000,
  });

  // First check if we need to show filters
  const showFiltersButton = page.getByRole("button", { name: "Show Filters" });
  if (await showFiltersButton.isVisible()) {
    await showFiltersButton.click();
    // Wait for any animations to complete
    await page.waitForTimeout(500);
  }
  
  // Now look for the copy button
  const copyButton = page.getByText("Copy this search query");
  
  // Make sure it's visible and clickable
  await copyButton.waitFor({ state: "visible", timeout: 5000 });
  await copyButton.click();
  
  // Add a small delay to ensure clipboard is updated
  await page.waitForTimeout(500);
  
  const clipboardContent = await page.evaluate(() =>
    navigator.clipboard.readText(),
  );
  
  expect(clipboardContent).toContain("/search?query=education+grants");
});
