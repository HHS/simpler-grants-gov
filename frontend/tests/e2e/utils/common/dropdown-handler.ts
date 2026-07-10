/**
 * Handles dropdown page fields using selector and test ID properties.
 * Usage: import { dropdownHandler } from "tests/e2e/utils/common/dropdown-handler";
 */

import { type Page } from "@playwright/test";
import { selectDropdownByValueOrLabel } from "tests/e2e/utils/forms/select-dropdown-utils";

import { escapeRegex } from "./regex-utils";
import { type FieldHandler, type FillFieldDefinition } from "./types";

export const dropdownHandler: FieldHandler = async (
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
) => {
  if (typeof data !== "string") {
    throw new Error(
      `Dropdown field ${field.field} requires string data, received ${typeof data}`,
    );
  }
  if (field.selector) {
    await selectDropdownByValueOrLabel(page, field.selector, data);
    return;
  }
  if (field.testId) {
    const locator = page.getByTestId(`${field.testId}${data}`);
    await locator.waitFor({ state: "visible", timeout: 5000 });
    await locator.click();
    return;
  }
  if (field.label) {
    const control = page
      .getByLabel(field.label, { exact: field.labelExact })
      .first();
    await control.waitFor({ state: "visible", timeout: 5000 });

    const tagName = await control.evaluate((node) =>
      node.tagName.toLowerCase(),
    );
    if (tagName === "select") {
      await control.selectOption({ label: data });
      return;
    }

    await control.click();
    const option = page
      .getByRole("option", {
        name: new RegExp(`^${escapeRegex(data)}$`, "i"),
      })
      .first();

    if (await option.isVisible().catch(() => false)) {
      await option.click();
      return;
    }

    await control.fill(data);
    await control.press("Enter");
    return;
  }
  throw new Error(
    `Dropdown field ${field.field} is missing selector, testId, or label`,
  );
};
