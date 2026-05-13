import { Locator, Page } from "@playwright/test";

/**
 * Fills a field locator with a value and fires blur/change events to trigger
 * inline validation — equivalent to a real user leaving the field.
 *
 * @param locator - Playwright Locator for the input
 * @param value   - String value to enter
 */
export async function fillAndBlur(
  locator: Locator,
  value: string,
): Promise<void> {
  await locator.fill(value);
  await locator.dispatchEvent("input");
  await locator.dispatchEvent("change");
  await locator.blur();
}

/**
 * Clears a field and fires blur to trigger required-field validation.
 *
 * @param locator - Playwright Locator for the input
 */
export async function clearAndBlur(locator: Locator): Promise<void> {
  await locator.fill("");
  await locator.dispatchEvent("change");
  await locator.blur();
}

/**
 * Returns the current visible character count / value length for a field.
 * Reads the `value` property from the DOM so truncated values are measured
 * accurately even when HTML maxlength silently trims the input.
 *
 * @param locator - Playwright Locator for the input
 */
export async function getFieldValueLength(locator: Locator): Promise<number> {
  const value = await locator.inputValue();
  return value.length;
}

/**
 * Returns the raw string value of a field as seen by the DOM.
 *
 * @param locator - Playwright Locator for the input
 */
export async function getFieldValue(locator: Locator): Promise<string> {
  return locator.inputValue();
}

/**
 * Scrolls an element into view and waits for it to be enabled before
 * interacting — prevents flaky interactions on slow-rendered forms.
 *
 * @param locator - Playwright Locator for the element
 */
export async function waitAndScrollToField(locator: Locator): Promise<void> {
  await locator.waitFor({ state: "visible", timeout: 10000 });
  await locator.scrollIntoViewIfNeeded();
}

/**
 * Reads the `maxlength` HTML attribute directly from a DOM element.
 * Returns `null` when the attribute is absent.
 *
 * @param page          - Playwright Page
 * @param locatorString - CSS selector / locator string for the input
 */
export async function getDomMaxLength(
  page: Page,
  locatorString: string,
): Promise<number | null> {
  try {
    const raw = await page
      .locator(locatorString)
      .first()
      .getAttribute("maxlength");
    return raw !== null ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}
