import { type Locator } from "@playwright/test";

const DEFAULT_WAIT_TIMEOUT = 5000;

/** Waits for a locator to be visible and clicks it. */
export async function waitForVisibleAndClick(
  locator: Locator,
): Promise<void> {
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
