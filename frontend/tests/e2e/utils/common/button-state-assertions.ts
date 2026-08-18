/**
 * Asserts enabled/disabled state for named action buttons on a page.
 * Usage: import { assertButtonEnabledDisabledStates } from "tests/e2e/utils/common/button-state-assertions";
 */

import { expect, type Page } from "@playwright/test";

import { escapeRegex } from "./regex-utils";

export type ButtonStateAssertionOptions = {
  timeoutMs?: number;
};

/** Verifies each named button is enabled or disabled as expected. */
export const assertButtonEnabledDisabledStates = async (
  page: Page,
  buttonStates: Record<string, boolean>,
  options?: ButtonStateAssertionOptions,
) => {
  const timeout = options?.timeoutMs ?? 10000;

  for (const [buttonName, shouldBeEnabled] of Object.entries(buttonStates)) {
    const button = page
      .getByRole("button", { name: new RegExp(`^${escapeRegex(buttonName)}$`) })
      .first();

    await expect(button).toBeVisible({ timeout });

    if (shouldBeEnabled) {
      await expect(button).toBeEnabled({ timeout });
    } else {
      await expect(button).toBeDisabled({ timeout });
    }
  }
};
