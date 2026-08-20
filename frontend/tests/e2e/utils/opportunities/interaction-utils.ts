/**
 * Shared interaction helpers for Playwright field actions.
 *
 * Reviewer guide:
 * - Wait for the locator to be visible before clicking.
 * - Click before filling or selecting whenever possible.
 * - Keep field interactions stable across tests.
 *
 * Using waitForVisibleAndClick() increases test reliability by ensuring that
 * elements are visible and ready before interaction occurs. This helps make
 * form interactions more deterministic, particularly for:
 *
 * - Frontend validation scenarios
 * - Validation message rendering
 * - Field state transitions
 * - Enable/disable gating behavior
 *
 * As a result, tests are less susceptible to timing issues and intermittent
 * failures caused by UI rendering delays or asynchronous state updates.
 */
import { type Locator } from "@playwright/test";

const DEFAULT_WAIT_TIMEOUT = 5000;

/** Waits for a locator to be visible and clicks it. */
export async function waitForVisibleAndClick(locator: Locator): Promise<void> {
  await locator.waitFor({ state: "visible", timeout: DEFAULT_WAIT_TIMEOUT });
  await locator.click();
}

/** Clicks the locator and fills it with the provided text. */
export async function clickAndFill(
  locator: Locator,
  text: string,
): Promise<void> {
  await waitForVisibleAndClick(locator);
  await locator.fill(text);
}

/** Clicks a native select locator and chooses the option label. */
export async function clickAndSelectOption(
  locator: Locator,
  optionLabel: string,
): Promise<void> {
  await waitForVisibleAndClick(locator);
  await locator.selectOption({ label: optionLabel });
}
