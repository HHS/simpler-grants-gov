/**
 * Resolves locator strategy for selector, testId, getByText, and data-text fallback.
 * Usage: import { getChoiceLocator } from "tests/e2e/utils/common/choice-locator";
 */

import { Page } from "@playwright/test";

import { FillFieldDefinition } from "./types";

/** Selects the base locator strategy from field metadata and field value. */
const resolveBaseChoiceLocator = (
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
) => {
  switch (true) {
    case Boolean(field.getByText):
      return page.getByText(field.getByText as string, {
        exact: field.textExact ?? false,
      });
    case Boolean(field.selector):
      return page.locator(field.selector as string);
    case Boolean(field.testId):
      return page.getByTestId(field.testId as string);
    case field.type === "checkbox" && typeof data === "string":
      return page.getByRole("checkbox", {
        name: data,
        exact: field.textExact ?? true,
      });
    case field.type === "radiobutton" && typeof data === "string":
      return page.getByRole("radio", {
        name: data,
        exact: field.textExact ?? true,
      });
    default:
      return page.getByText(String(data), {
        exact: field.textExact ?? field.useDataAsText ?? false,
      });
  }
};

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

  let locator = resolveBaseChoiceLocator(page, field, data);
  if (field.hasTextRegex) {
    locator = locator.filter({ hasText: new RegExp(field.hasTextRegex) });
  }
  return locator;
}
