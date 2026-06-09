// general-pages-filling.ts
// Generic page-field filling helpers that dispatch to shared field handlers.
// Usage: import { fillPageField, fillPageFields } from "tests/e2e/utils/pages/general-pages-filling";

import { type Page, type TestInfo } from "@playwright/test";
import { buildFieldIdentifier } from "tests/e2e/utils/common/field-identifier";
import {
  runFieldFillBatch,
  runSharedFieldFill,
} from "tests/e2e/utils/common/index";
import {
  type FieldType,
  type FillFieldDefinition,
  type FillPageFieldsOptions,
} from "tests/e2e/utils/common/types";

export type PageFillField = {
  label: string;
  type: FieldType;
  value: string | boolean;
  exact?: boolean;
};

const toCommonFieldDefinition = (field: PageFillField): FillFieldDefinition => {
  return {
    field: field.label,
    type: field.type,
    label: field.label,
    labelExact: field.exact,
  };
};

export async function fillPageField(
  testInfo: TestInfo | undefined,
  page: Page,
  field: PageFillField,
  data: string | boolean | undefined,
): Promise<void> {
  const fieldIdentifier = buildFieldIdentifier(field);
  const commonField = toCommonFieldDefinition(field);
  await runSharedFieldFill({
    testInfo,
    page,
    field: commonField,
    data,
    fieldIdentifier,
    attachmentNames: {
      skipped: "fillPageField",
      success: "fillPageField",
      error: "fillPageField",
    },
    notFoundHandlerMessage: `No handler found for page field type: ${field.type}`,
    wrappedErrorPrefix: `Failed to fill page field ${field.label}`,
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
