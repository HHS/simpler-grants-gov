/**
 * Shared helper for single-field fill execution with consistent attachments and errors.
 * Usage: import { runSharedFieldFill } from "tests/e2e/utils/common/shared-field-filling";
 */

import { type Page, type TestInfo } from "@playwright/test";
import { fieldHandlerMap } from "tests/e2e/utils/common/field-handler-dispatcher";
import { buildFieldIdentifier } from "tests/e2e/utils/common/field-identifier";
import { type FillFieldDefinition } from "tests/e2e/utils/common/types";

type SharedFillOptions = {
  testInfo?: TestInfo;
  page: Page;
  field: FillFieldDefinition;
  data: string | boolean | undefined;
  fieldIdentifier?: string;
  attachReports?: boolean;
  attachmentNamePrefix?: string;
  fieldContextLabel?: string;
};

const defaultAttachmentNamePrefix = "fillField";
const defaultFieldContextLabel = "field";

/** Fills a single field through the shared handler map with consistent error wrapping and attachments. */
export async function runSharedFieldFill(
  options: SharedFillOptions,
): Promise<void> {
  const { testInfo, page, field, data, attachReports } = options;

  const fieldIdentifier =
    options.fieldIdentifier ?? buildFieldIdentifier(field);
  const attachmentNamePrefix =
    options.attachmentNamePrefix ?? defaultAttachmentNamePrefix;
  const fieldContextLabel =
    options.fieldContextLabel ?? defaultFieldContextLabel;
  const notFoundHandlerMessage = `No handler found for ${fieldContextLabel} type: ${field.type}`;
  const wrappedErrorPrefix = `Failed to fill ${fieldContextLabel} ${fieldIdentifier}`;

  try {
    if (data === undefined) {
      if (testInfo && attachReports) {
        await testInfo.attach(
          attachmentNamePrefix + "-" + fieldIdentifier + "-skipped",
          {
            body: "Skipped " + fieldIdentifier + ": no data provided",
            contentType: "text/plain",
          },
        );
      }
      return;
    }

    const handler = fieldHandlerMap[field.type];
    if (!handler) {
      throw new Error(notFoundHandlerMessage);
    }

    await handler(testInfo, page, field, data);

    if (testInfo && attachReports) {
      await testInfo.attach(
        attachmentNamePrefix + "-" + fieldIdentifier + "-success",
        {
          body:
            "Successfully filled " +
            fieldIdentifier +
            ': "' +
            String(data) +
            '"',
          contentType: "text/plain",
        },
      );
    }
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

    if (testInfo && attachReports) {
      await testInfo.attach(
        attachmentNamePrefix + "-" + fieldIdentifier + "-error",
        {
          body: "Failed to fill " + fieldIdentifier + ": " + errorMessage,
          contentType: "text/plain",
        },
      );
    }

    const wrappedError = new Error(wrappedErrorPrefix + ": " + errorMessage);
    (wrappedError as Error & { cause?: unknown }).cause = error;
    throw wrappedError;
  }
}
