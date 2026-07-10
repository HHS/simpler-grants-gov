/**
 * Generic page-field filling helpers that dispatch to shared field handlers.
 * Usage: import { fillPageField, fillPageFields } from "tests/e2e/utils/pages/general-pages-filling";
 */

import { type Page } from "@playwright/test";
import { runFieldFillBatch } from "tests/e2e/utils/common/index";
import {
  type FillFieldDefinition,
  type FillPageFieldsOptions,
} from "tests/e2e/utils/common/types";
import { fillField } from "tests/e2e/utils/forms/general-forms-filling";

export type PageFillField = FillFieldDefinition & {
  value: string | boolean;
};

/** Fills a single page field using page-level context labels. */
export async function fillPageField(
  page: Page,
  field: PageFillField,
  data: string | boolean | undefined,
): Promise<void> {
  await fillField(page, field, data, {
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
  options?: FillPageFieldsOptions,
): Promise<void> {
  const continueOnError = options?.continueOnError ?? false;
  await runFieldFillBatch({
    items: fields,
    continueOnError,
    fillItem: async (field) => {
      await fillPageField(page, field, field.value);
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
