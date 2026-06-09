// visibility-assertions.ts
// Provides reusable visibility assertions for locators, text, and page details.
// Usage: import { assertLocatorVisible, assertTextVisible, assertPageDetailsVisible } from "tests/e2e/utils/common/visibility-assertions";

import { expect, type Locator, type Page } from "@playwright/test";

export const assertLocatorVisible = async (locator: Locator) => {
  await expect(locator).toBeVisible();
};

export const assertTextVisible = async (page: Page, text: string) => {
  await expect(page.getByText(text).first()).toBeVisible();
};

export const assertPageDetailsVisible = async (
  page: Page,
  options: { heading: string; texts: string[] },
) => {
  await expect(page.getByRole("heading", { name: options.heading })).toBeVisible();

  for (const text of options.texts) {
    await assertTextVisible(page, text);
  }
};
