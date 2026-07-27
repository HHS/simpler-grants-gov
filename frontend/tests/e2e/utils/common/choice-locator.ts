/**
 * Resolves locator strategy for selector, testId, getByText, and data-text fallback.
 * Usage: import { getChoiceLocator } from "tests/e2e/utils/common/choice-locator";
 */

import { Locator, Page } from "@playwright/test";

import { FillFieldDefinition } from "./types";

/** Converts text to snake_case-like values used by many checkbox inputs. */
const toSnakeCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

/** Builds checkbox value candidates from valueKey and data. */
const deriveCheckboxValueCandidates = (
  field: FillFieldDefinition,
  data: string | boolean | undefined,
) => {
  const candidates: string[] = [];

  if (typeof field.valueKey === "string") {
    const keySnake = toSnakeCase(field.valueKey);
    if (keySnake.length > 0) {
      candidates.push(keySnake);

      const parts = keySnake.split("_").filter(Boolean);
      if (parts.length > 1) {
        candidates.push(parts[parts.length - 1]);
      }
    }
  }

  if (typeof data === "string") {
    const normalized = toSnakeCase(data);
    if (normalized.length > 0) {
      candidates.push(normalized);
    }
  }

  return [...new Set(candidates)];
};

/** Returns the first locator that resolves to at least one element. */
const resolveFirstAvailableLocator = async (
  locators: Locator[],
): Promise<Locator | undefined> => {
  for (const locator of locators) {
    if ((await locator.count()) > 0) {
      return locator;
    }
  }

  return undefined;
};

/** Selects the base locator strategy from field metadata and field value. */
const resolveBaseChoiceLocator = async (
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
) => {
  if (field.getByText) {
    return page.getByText(field.getByText, {
      exact: field.textExact ?? false,
    });
  }

  if (field.selector) {
    return page.locator(field.selector);
  }

  if (field.testId) {
    return page.getByTestId(field.testId);
  }

  if (field.type === "checkbox") {
    const candidateLocators = deriveCheckboxValueCandidates(field, data).map(
      (value) => page.locator(`input[type="checkbox"][value="${value}"]`),
    );

    const valueBasedLocator =
      await resolveFirstAvailableLocator(candidateLocators);
    if (valueBasedLocator) {
      return valueBasedLocator;
    }

    if (typeof data === "string") {
      return page.getByRole("checkbox", {
        name: data,
        exact: field.textExact ?? true,
      });
    }
  }

  if (field.type === "radiobutton" && typeof data === "string") {
    return page.getByRole("radio", {
      name: data,
      exact: field.textExact ?? true,
    });
  }

  const textValue = typeof data === "string" ? data : String(data ?? "");
  return page.getByText(textValue, {
    exact: field.textExact ?? field.useDataAsText ?? false,
  });
};

/**
 * Resolves a Playwright locator for radio/checkbox fields using selector, testId, getByText, or data-text fallback.
 * Supports optional regex filtering.
 */
export async function getChoiceLocator(
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
) {
  const hasConfiguredLocator = Boolean(
    field.getByText || field.selector || field.testId || field.valueKey,
  );
  if (!hasConfiguredLocator && typeof data !== "string") {
    throw new Error(
      `Choice field ${field.field} is missing locator config (testId, selector, or getByText), and data cannot be used as text locator: ${String(
        data,
      )}`,
    );
  }

  let locator = await resolveBaseChoiceLocator(page, field, data);
  if (field.hasTextRegex) {
    locator = locator.filter({ hasText: new RegExp(field.hasTextRegex) });
  }
  return locator;
}
