// visibility-assertions.ts
// Provides reusable visibility assertions for locators, text, and page details.
// Usage: import { assertLocatorVisible, assertTextVisible, assertTextsVisibleOnPage, assertPageHeadingAndTextsVisible } from "tests/e2e/utils/common/visibility-assertions";

import { expect, type Locator, type Page } from "@playwright/test";

export const assertLocatorVisible = async (locator: Locator) => {
  await expect(locator).toBeVisible();
};

export const assertTextVisible = async (page: Page, text: string) => {
  await expect(page.getByText(text).first()).toBeVisible();
};

export const assertTextsVisibleOnPage = async (page: Page, texts: string[]) => {
  for (const text of texts) {
    await assertTextVisible(page, text);
  }
};

export const assertPageHeadingAndTextsVisible = async (
  page: Page,
  options: { heading: string; texts: string[] },
) => {
  await expect(
    page.getByRole("heading", { name: options.heading }),
  ).toBeVisible();

  await assertTextsVisibleOnPage(page, options.texts);
};

export const assertPageDetailsVisible = assertPageHeadingAndTextsVisible;
