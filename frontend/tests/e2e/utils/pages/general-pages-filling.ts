/**
 * Generic page-field filling helpers that dispatch to shared field handlers.
 * Usage: import { fillPageField, fillPageFields } from "tests/e2e/utils/pages/general-pages-filling";
 */

import { type Page, type TestInfo } from "@playwright/test";
import { runFieldFillBatch } from "tests/e2e/utils/common/index";
import {
  type FillFieldDefinition,
  type FillPageFieldsOptions,
} from "tests/e2e/utils/common/types";
import { fillField } from "tests/e2e/utils/forms/general-forms-filling";

export type PageFillField = FillFieldDefinition & {
  value: string | boolean;
};

/** Fills a single page field using page-level attachment and context labels. */
export async function fillPageField(
  testInfo: TestInfo | undefined,
  page: Page,
  field: PageFillField,
  data: string | boolean | undefined,
): Promise<void> {
  await fillField(testInfo, page, field, data, {
    attachmentNamePrefix: "fillPageField",
    fieldContextLabel: "page field",
  });
}

/**
 * Fills all provided page fields on the current page.
 * Does NOT perform navigation, save, or assertions.
 */
export async function fillPageFields(
  page: Page,
  fields: PageFillField[],
  testInfo?: TestInfo,
  options?: FillPageFieldsOptions,
): Promise<void> {
  const continueOnError = options?.continueOnError ?? false;
  await runFieldFillBatch({
    items: fields,
    continueOnError,
    fillItem: async (field) => {
      await fillPageField(testInfo, page, field, field.value);
    },
    formatError: (field, error) => {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return `${field.label} [${field.type}]: ${errorMessage}`;
    },
    failureSummary: (failureCount, failures) => {
      return `Failed to fill ${failureCount} field(s):\n${failures.join("\n")}`;
    },
  });
}
