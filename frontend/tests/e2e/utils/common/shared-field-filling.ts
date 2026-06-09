// shared-field-filling.ts
// Shared helper for single-field fill execution with consistent attachments and errors.
// Usage: import { runSharedFieldFill } from "tests/e2e/utils/common/shared-field-filling";

import { type Page, type TestInfo } from "@playwright/test";
import { fieldHandlerDispatcher } from "tests/e2e/utils/common/field-handler-dispatcher";
import { type FillFieldDefinition } from "tests/e2e/utils/common/types";

type SharedFillAttachmentNames = {
  skipped: string;
  success: string;
  error: string;
};

type SharedFillOptions = {
  testInfo?: TestInfo;
  page: Page;
  field: FillFieldDefinition;
  data: string | boolean | undefined;
  fieldIdentifier: string;
  attachReports?: boolean;
  attachmentNames?: SharedFillAttachmentNames;
  notFoundHandlerMessage: string;
  wrappedErrorPrefix: string;
};

const defaultAttachmentNames: SharedFillAttachmentNames = {
  skipped: "fillField",
  success: "fillField",
  error: "fillField",
};

export async function runSharedFieldFill(
  options: SharedFillOptions,
): Promise<void> {
  const {
    testInfo,
    page,
    field,
    data,
    fieldIdentifier,
    attachReports,
    notFoundHandlerMessage,
    wrappedErrorPrefix,
  } = options;

  const attachmentNames = options.attachmentNames ?? defaultAttachmentNames;

  try {
    if (data === undefined) {
      if (testInfo && attachReports) {
        await testInfo.attach(
          attachmentNames.skipped + "-" + fieldIdentifier + "-skipped",
          {
            body: "Skipped " + fieldIdentifier + ": no data provided",
            contentType: "text/plain",
          },
        );
      }
      return;
    }

    const handler = fieldHandlerDispatcher[field.type];
    if (!handler) {
      throw new Error(notFoundHandlerMessage);
    }

    await handler(testInfo, page, field, data);

    if (testInfo && attachReports) {
      await testInfo.attach(
        attachmentNames.success + "-" + fieldIdentifier + "-success",
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
    const errorMessage = error instanceof Error ? error.message : String(error);

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
        attachmentNames.error + "-" + fieldIdentifier + "-error",
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
