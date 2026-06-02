// choice-locator.ts
// Resolves locator strategy for selector, testId, getByText, and data-text fallback.
// Usage: import { getChoiceLocator } from './choice-locator';

import { Page } from "@playwright/test";

import { FillFieldDefinition } from "./types";

/**
 * Resolves a Playwright locator for radio/checkbox fields using selector, testId, getByText, or data-text fallback.
 * Supports optional regex filtering.
 */
export function getChoiceLocator(
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
) {
  const hasConfiguredLocator = Boolean(
    field.getByText || field.selector || field.testId,
  );
  if (!hasConfiguredLocator && typeof data !== "string") {
    throw new Error(
      `Choice field ${field.field} is missing locator config (testId, selector, or getByText), and data cannot be used as text locator: ${String(
        data,
      )}`,
    );
  }

  let locator = field.getByText
    ? page.getByText(field.getByText, { exact: field.textExact ?? false })
    : field.selector
      ? page.locator(field.selector)
      : field.testId
        ? page.getByTestId(field.testId)
        : page.getByText(String(data), {
            exact: field.textExact ?? field.useDataAsText ?? false,
          });
  if (field.hasTextRegex) {
    locator = locator.filter({ hasText: new RegExp(field.hasTextRegex) });
  }
  return locator;
}
