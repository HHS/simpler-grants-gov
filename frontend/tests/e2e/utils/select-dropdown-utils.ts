// ============================================================================
// Test Utility: Select Dropdown by Value or Label
// ============================================================================

import { Page } from "@playwright/test";

/**
 * Selects a dropdown option by value, with fallback to label matching.
 *
 * Attempts to select by value first (for dynamic dropdowns with explicit values).
 * If that fails, falls back to selecting by visible label text.
 *
 * @param page - Playwright Page object
 * @param selector - CSS selector for the dropdown element
 * @param option - Option value or label to select
 *
 * @throws Error if neither value nor label match any option
 *
 * @example
 * await selectDropdownByValueOrLabel(page, 'select#country', 'US');
 *
 * @example
 * await selectDropdownByValueOrLabel(page, 'select#state', 'California');
 */
export async function selectDropdownByValueOrLabel(
  page: Page,
  selector: string,
  option: string,
): Promise<void> {
  const dropdown = page.locator(selector);

  try {
    // Try selecting by option value first
    await dropdown.selectOption(option);
  } catch {
    // Fall back to selecting by visible label text
    await dropdown.selectOption({ label: option });
  }
}
