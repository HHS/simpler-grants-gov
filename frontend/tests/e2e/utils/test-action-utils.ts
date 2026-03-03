// ============================================================================
// Test Action Utilities
// ============================================================================
// Helper functions for performing actions on page elements such as
// selecting dropdown options by value or label
// ============================================================================

import { Page } from "@playwright/test";

/**
 * Select an option from a dropdown by either its value or its label
 * If the option is not found by value, it attempts to select it by label
 * This helps handle dropdowns with dynamic option values
 *
 * @param page - Playwright Page object
 * @param selector - CSS selector for the dropdown element
 * @param option - Option value or label to select
 * @returns Promise that resolves when the option is selected
 *
 * @example
 * // Select by value
 * await selectDropdownByValueOrLabel(page, 'select#country', 'US');
 *
 * @example
 * // Select by label (fallback if value doesn't match)
 * await selectDropdownByValueOrLabel(page, 'select#state', 'California');
 */
export async function selectDropdownByValueOrLabel(
  page: Page,
  selector: string,
  option: string,
): Promise<void> {
  const dropdown = page.locator(selector);

  try {
    await dropdown.selectOption(option);
  } catch {
    await dropdown.selectOption({ label: option });
  }
}
