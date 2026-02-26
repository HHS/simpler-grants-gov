import { type Locator, type Page } from "@playwright/test";

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
