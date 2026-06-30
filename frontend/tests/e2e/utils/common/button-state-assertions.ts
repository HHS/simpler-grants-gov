/**
 * Asserts enabled/disabled state for named action buttons on a page.
 * Usage: import { assertButtonEnabledDisabledStates } from "tests/e2e/utils/common/button-state-assertions";
 */

import { expect, type Page } from "@playwright/test";

import { escapeRegex } from "./regex-utils";

/** Verifies each named button is enabled or disabled as expected. */
export const assertButtonEnabledDisabledStates = async (
  page: Page,
  buttonStates: Record<string, boolean>,
) => {
  for (const [buttonName, shouldBeEnabled] of Object.entries(buttonStates)) {
    const button = page
      .getByRole("button", { name: new RegExp(`^${escapeRegex(buttonName)}$`) })
      .first();
    await expect(button).toBeVisible();

    if (shouldBeEnabled) {
      await expect(button).toBeEnabled();
    } else {
      await expect(button).toBeDisabled();
    }
  }
};
