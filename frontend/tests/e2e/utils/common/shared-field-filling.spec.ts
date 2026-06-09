// shared-field-filling.spec.ts
// Unit-style Playwright tests for shared field-fill orchestration behavior.
// Usage: npx playwright test tests/e2e/utils/common/shared-field-filling.spec.ts

import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { fieldHandlerDispatcher } from "tests/e2e/utils/common/field-handler-dispatcher";
import { runSharedFieldFill } from "tests/e2e/utils/common/shared-field-filling";
import { type FillFieldDefinition } from "tests/e2e/utils/common/types";

type AttachmentRecord = {
  name: string;
  body: string;
  contentType: string;
};

const buildTestInfo = (attachments: AttachmentRecord[]): TestInfo => {
  const attachMock: TestInfo["attach"] = (name, options) => {
    attachments.push({
      name,
      body: String(options?.body ?? ""),
      contentType: String(options?.contentType ?? ""),
    });

    return Promise.resolve();
  };

  return {
    attach: attachMock,
  } as unknown as TestInfo;
};

const buildPage = (closed = false): Page => {
  return {
    isClosed: () => closed,
  } as unknown as Page;
};

const field: FillFieldDefinition = {
  field: "Test field",
  type: "text",
};

test.describe("runSharedFieldFill", () => {
  test("skips and attaches when data is undefined", async () => {
    const originalHandler = fieldHandlerDispatcher.text;
    const attachments: AttachmentRecord[] = [];
    let handlerCalls = 0;

    fieldHandlerDispatcher.text = () => {
      handlerCalls += 1;
      return Promise.resolve();
    };

    try {
      await runSharedFieldFill({
        testInfo: buildTestInfo(attachments),
        page: buildPage(false),
        field,
        data: undefined,
        fieldIdentifier: "test-text",
        attachReports: true,
        attachmentNames: {
          skipped: "fillField",
          success: "fillField",
          error: "fillField",
        },
        notFoundHandlerMessage: "No handler found",
        wrappedErrorPrefix: "Failed to fill field",
      });

      expect(handlerCalls).toBe(0);
      expect(attachments).toHaveLength(1);
      expect(attachments[0].name).toBe("fillField-test-text-skipped");
      expect(attachments[0].body).toContain(
        "Skipped test-text: no data provided",
      );
    } finally {
      fieldHandlerDispatcher.text = originalHandler;
    }
  });

  test("fills successfully and attaches success", async () => {
    const originalHandler = fieldHandlerDispatcher.text;
    const attachments: AttachmentRecord[] = [];

    fieldHandlerDispatcher.text = () => Promise.resolve();

    try {
      await runSharedFieldFill({
        testInfo: buildTestInfo(attachments),
        page: buildPage(false),
        field,
        data: "hello",
        fieldIdentifier: "test-text",
        attachReports: true,
        attachmentNames: {
          skipped: "fillField",
          success: "fillField",
          error: "fillField",
        },
        notFoundHandlerMessage: "No handler found",
        wrappedErrorPrefix: "Failed to fill field",
      });

      expect(attachments).toHaveLength(1);
      expect(attachments[0].name).toBe("fillField-test-text-success");
      expect(attachments[0].body).toContain(
        'Successfully filled test-text: "hello"',
      );
    } finally {
      fieldHandlerDispatcher.text = originalHandler;
    }
  });

  test("throws wrapped error when handler is missing and attaches error", async () => {
    const originalHandler = fieldHandlerDispatcher.text;
    const attachments: AttachmentRecord[] = [];

    (fieldHandlerDispatcher as unknown as Record<string, unknown>).text =
      undefined;

    try {
      await expect(
        runSharedFieldFill({
          testInfo: buildTestInfo(attachments),
          page: buildPage(false),
          field,
          data: "hello",
          fieldIdentifier: "test-text",
          attachReports: true,
          attachmentNames: {
            skipped: "fillField",
            success: "fillField",
            error: "fillField",
          },
          notFoundHandlerMessage: "No handler found",
          wrappedErrorPrefix: "Failed to fill field",
        }),
      ).rejects.toThrow("Failed to fill field: No handler found");

      expect(attachments).toHaveLength(1);
      expect(attachments[0].name).toBe("fillField-test-text-error");
      expect(attachments[0].body).toContain(
        "Failed to fill test-text: No handler found",
      );
    } finally {
      fieldHandlerDispatcher.text = originalHandler;
    }
  });

  test("preserves original timeout/lifecycle errors without attaching wrapped error", async () => {
    const originalHandler = fieldHandlerDispatcher.text;
    const attachments: AttachmentRecord[] = [];
    const timeoutError = new Error("Test timeout of 30000ms exceeded");

    fieldHandlerDispatcher.text = () => Promise.reject(timeoutError);

    try {
      await expect(
        runSharedFieldFill({
          testInfo: buildTestInfo(attachments),
          page: buildPage(false),
          field,
          data: "hello",
          fieldIdentifier: "test-text",
          attachmentNames: {
            skipped: "fillField",
            success: "fillField",
            error: "fillField",
          },
          notFoundHandlerMessage: "No handler found",
          wrappedErrorPrefix: "Failed to fill field",
        }),
      ).rejects.toBe(timeoutError);

      expect(attachments).toHaveLength(0);
    } finally {
      fieldHandlerDispatcher.text = originalHandler;
    }
  });
});
