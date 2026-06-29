/**
 * Shared helper for single-field fill execution with consistent error wrapping.
 * Usage: import { runSharedFieldFill } from "tests/e2e/utils/common/shared-field-filling";
 */

import { type Page } from "@playwright/test";
import { fieldHandlerMap } from "tests/e2e/utils/common/field-handler-dispatcher";
import { buildFieldIdentifier } from "tests/e2e/utils/common/field-identifier";
import { type FillFieldDefinition } from "tests/e2e/utils/common/types";

type SharedFillOptions = {
  page: Page;
  field: FillFieldDefinition;
  data: string | boolean | undefined;
  fieldIdentifier?: string;
  fieldContextLabel?: string;
};

const defaultFieldContextLabel = "field";

/** Fills a single field through the shared handler map with consistent error wrapping. */
export async function runSharedFieldFill(
  options: SharedFillOptions,
): Promise<void> {
  const { page, field, data } = options;

  const fieldIdentifier =
    options.fieldIdentifier ?? buildFieldIdentifier(field);
  const fieldContextLabel =
    options.fieldContextLabel ?? defaultFieldContextLabel;
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
