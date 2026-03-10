import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Gets a form link element by matching form name text.
 * @param page Playwright Page object
 * @param formName Form name or pattern to match (case-insensitive)
 * @returns Locator for the form link
 */
export function getFormLink(page: Page, formName: string): Locator {
  return page.locator("a, button").filter({
    hasText: new RegExp(formName, "i"),
  });
}

/**
 * Opens a form from the application forms table.
 * @param page Playwright Page object
 * @param formMatcher Form name or regex-style matcher used to find the form link
 * @returns true when a link was found and opened, false otherwise
 */
export async function openForm(
  page: Page,
  formMatcher: string,
): Promise<boolean> {
  const formLink = getFormLink(page, formMatcher);
  await expect(formLink).toBeVisible({ timeout: 60000 });
  const linkCount = await formLink.count();

  if (linkCount === 0) return false;

  await formLink.first().waitFor({ state: "visible", timeout: 60000 });
  await Promise.all([
    page.waitForURL(/\/applications\/[a-f0-9-]+\/form\/[a-f0-9-]+/, {
      timeout: 30000,
    }),
    formLink.first().click(),
  ]);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);
  return true;
}
