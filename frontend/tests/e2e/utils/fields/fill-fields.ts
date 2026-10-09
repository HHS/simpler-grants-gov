/**
 * Canonical single-field fill entry point.
 *
 * Merged from two files that each had exactly one caller and no logic of
 * their own worth isolating:
 *  - field-handler-dispatcher.ts (a field-type -> handler lookup map)
 *  - shared-field-filling.ts (the fill-and-wrap-errors execution path)
 *
 * The field-type strategy pattern itself (fieldHandlerMap) is kept - that
 * part is genuinely good practice, not indirection - it's just colocated
 * here with the one function that uses it instead of living behind its own
 * single-consumer file.
 *
 * Usage: import { fillField } from "tests/e2e/utils/fields/fill-fields";
 */

import { type Page } from "@playwright/test";
import { checkboxHandler } from "tests/e2e/utils/common/checkbox-handler";
import { comboBoxInputHandler } from "tests/e2e/utils/common/combo-box-input-handler";
import { buildFieldIdentifier } from "tests/e2e/utils/common/field-identifier";
import { fileHandler } from "tests/e2e/utils/common/file-handler";
import {
  type FieldHandler,
  type FieldType,
  type FillFieldDefinition,
} from "tests/e2e/utils/common/types";

import {
  dateHandler,
  dropdownHandler,
  emailHandler,
  radioButtonHandler,
  selectHandler,
  textHandler,
} from "./simple-field-handlers";

/** Central map of field types to handler functions. */
export const fieldHandlerMap: Record<FieldType, FieldHandler> = {
  text: textHandler,
  textarea: textHandler,
  email: emailHandler,
  dropdown: dropdownHandler,
  select: selectHandler,
  date: dateHandler,
  file: fileHandler,
  radiobutton: radioButtonHandler,
  checkbox: checkboxHandler,
  "combo-box-input": comboBoxInputHandler,
};

type FillFieldOptions = {
  fieldIdentifier?: string;
  fieldContextLabel?: string;
};

const defaultFieldContextLabel = "field";

/**
 * Fills one field through the shared handler map with consistent error
 * wrapping. This is the single entry point every form/page fill helper
 * should call directly - no intermediate dispatcher or wrapper layer.
 */
export async function fillField(
  page: Page,
  field: FillFieldDefinition,
  data: string | boolean | undefined,
  options?: FillFieldOptions,
): Promise<void> {
  const fieldIdentifier =
    options?.fieldIdentifier ?? buildFieldIdentifier(field);
  const fieldContextLabel =
    options?.fieldContextLabel ?? defaultFieldContextLabel;
  const notFoundHandlerMessage = `No handler found for ${fieldContextLabel} type: ${field.type}`;
  const wrappedErrorPrefix = `Failed to fill ${fieldContextLabel} ${fieldIdentifier}`;

  try {
    if (data === undefined) {
      return;
    }

    const handler = fieldHandlerMap[field.type];
    if (!handler) {
      throw new Error(notFoundHandlerMessage);
    }

    await handler(page, field, data);
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error while filling field";

    // Preserve Playwright timeout/page lifecycle errors so callers can handle them upstream.
    if (
      page.isClosed() ||
      /Test timeout|Target page, context or browser has been closed/i.test(
        errorMessage,
      )
    ) {
      throw error instanceof Error ? error : new Error(errorMessage);
    }

    const wrappedError = new Error(wrappedErrorPrefix + ": " + errorMessage);
    (wrappedError as Error & { cause?: unknown }).cause = error;
    throw wrappedError;
  }
}
